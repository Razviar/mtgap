import {App, protocol, session} from 'electron';
import fs from 'fs';
import path from 'path';

import {downloadImage} from 'root/api/getimg';
import {error} from 'root/lib/logger';

export function setupRequestIntercept(app: App): void {
  protocol.registerBufferProtocol(
    'mtga-image',
    (request, callback) => {
      const pathImg = request.url.split('/card-image/');
      const appDataPath = app.getPath('userData');
      const pathImgDetails = pathImg[1].split('/');
      const imgDirs = [...pathImgDetails].splice(pathImgDetails.length - 1, 1);
      console.log(request.url, imgDirs);
      const p = path.join(appDataPath, ...pathImgDetails);
      if (fs.existsSync(p)) {
        callback({mimeType: 'image/webp', data: fs.readFileSync(p)});
      } else {
        const pathCreatedSoFar: string[] = [];
        imgDirs.forEach(dir => {
          pathCreatedSoFar.push(dir);
          if (!fs.existsSync(path.join(appDataPath, ...pathCreatedSoFar))) {
            fs.mkdirSync(path.join(appDataPath, ...pathCreatedSoFar), {recursive: true});
          }
        });
        downloadImage(`https://mtgarena.pro/${pathImg[1]}`, p)
          .then(() => {
            callback({mimeType: 'image/webp', data: fs.readFileSync(p)});
          })
          .catch(err => {
            error('Failure to get image', err, {...pathImgDetails});
          });
      }
    },
    error => {
      if (error) {
        console.error('Failed to register protocol');
      }
    }
  );
}
