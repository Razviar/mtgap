import {App, session} from 'electron';
import fs from 'fs';
import path from 'path';

import {downloadImage} from 'root/api/getimg';
import {error} from 'root/lib/logger';

const filter = {
  urls: ['*://localhost/card-image/*'],
};

export function setupRequestIntercept(app: App): void {
  session.defaultSession.webRequest.onBeforeRequest(filter, (details, callback) => {
    const pathImg = details.url.split('/card-image/');
    const appDataPath = app.getPath('userData');
    const pathImgDetails = pathImg[1].split('/');
    const imgDirs = [...pathImgDetails].splice(pathImgDetails.length - 1, 1);
    if (fs.existsSync(path.join(appDataPath, ...pathImgDetails))) {
      callback({redirectURL: path.join(appDataPath, ...pathImgDetails)});
    } else {
      const pathCreatedSoFar: string[] = [];
      imgDirs.forEach(dir => {
        pathCreatedSoFar.push(dir);
        if (!fs.existsSync(path.join(appDataPath, ...pathCreatedSoFar))) {
          fs.mkdirSync(path.join(appDataPath, ...pathCreatedSoFar));
        }
      });
      downloadImage(`https://mtgarena.pro/${pathImg[1]}`, path.join(appDataPath, ...pathImgDetails))
        .then(() => {
          callback({redirectURL: path.join(appDataPath, ...pathImgDetails)});
        })
        .catch(err => {
          error('Failure to get image', err, {...pathImgDetails});
        });
    }
  });
}
