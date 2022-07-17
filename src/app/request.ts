import axios, {AxiosRequestConfig} from 'axios';
import zlib from 'zlib';

import {isStillSendingEvents} from 'root/api/logsender';
import {sendMessageToHomeWindow} from 'root/app/messages';
import {NetworkStatusMessage} from 'root/lib/messages';

export type AxiosResponse = any; // tslint:disable-line:no-any

async function makeAxios(
  method: 'post' | 'get',
  path: string,
  config: AxiosRequestConfig,
  baseURL: string = 'https://mtgarena.pro'
): Promise<AxiosResponse> {
  try {
    const res = await axios({
      ...config,
      withCredentials: false,
      url: `${baseURL}${path.startsWith('/') ? '' : '/'}${path}`,
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      method,
    });
    const sendingEvents = path.indexOf('cm_uploadpackfile') > -1;
    if (!sendingEvents && !isStillSendingEvents()) {
      sendMessageToHomeWindow('network-status', {active: true, message: NetworkStatusMessage.Connected});
    }
    return res.data;
  } catch (e) {
    sendMessageToHomeWindow('network-status', {active: false, message: NetworkStatusMessage.Disconnected});
    throw e;
  }
}

async function axiosGet(
  path: string,
  config: AxiosRequestConfig = {},
  baseURL: string = 'https://mtgarena.pro'
): Promise<AxiosResponse> {
  return makeAxios('get', path, config, baseURL);
}

async function axiosPost<T>(path: string, data?: T, config?: AxiosRequestConfig): Promise<AxiosResponse> {
  return makeAxios('post', path, {...(config || {}), data});
}

async function axiosPostGzip<T>(path: string, data?: T, config?: AxiosRequestConfig): Promise<AxiosResponse> {
  const gzippedData = data ? zlib.gzipSync(JSON.stringify(data)).toString('base64') : data;
  return axiosPost(path, gzippedData, config);
}

export const Request = {
  get: axiosGet,
  post: axiosPost,
  gzip: axiosPostGzip,
};
