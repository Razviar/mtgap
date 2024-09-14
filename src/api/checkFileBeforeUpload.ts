import {Request} from 'root/app/request';
import {asString} from 'root/lib/type_utils';
import zlib from 'zlib';
import AWS from 'aws-sdk';

export async function checkFileBeforeUpload(checkmd5: string): Promise<boolean> {
  const res = await Request.gzip('/mtg/uploadcards.php?version=1', {checkmd5});
  //console.log(checkmd5);
  //console.log(res);
  const resMap = asString(res);
  return resMap === 'UPDATE';
  //return true;
}

export async function doFileUpload(file: Buffer, name: string): Promise<boolean> {
  const s3 = new AWS.S3({
    /*secrets removed*/
  });
  zlib.gzip(file, async (error, blob) => {
    if (error === null) {
      await s3
        .upload({
          Bucket: 'gamedata.mtgarena.pro',
          Key: `${name}.gz`,
          Body: blob,
        })
        .promise();
      //console.log(data);
    }
  });

  return true;
}
