import axios, {AxiosResponse} from 'axios';
import fs from 'fs';
import {Stream} from 'stream';

export async function downloadImage(url: string, imgpath: string): Promise<void> {
  const writer = fs.createWriteStream(imgpath);

  const response: AxiosResponse<Stream> = await axios({url, method: 'GET', responseType: 'stream'});
  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on('finish', resolve);
    writer.on('error', reject);
  });
}
