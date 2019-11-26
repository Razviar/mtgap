import axios, {AxiosRequestConfig} from 'axios';
import zlib from 'zlib';

export type AxiosResponse = any; // tslint:disable-line:no-any
type AxiosPost<T> = (url: string, data?: T, config?: AxiosRequestConfig) => Promise<AxiosResponse>;

async function makeAxios(method: 'post' | 'get', path: string, config: AxiosRequestConfig): Promise<AxiosResponse> {
  return (
    await axios({
      ...config,
      withCredentials: false,
      url: `https://mtgarena.pro/${path}`,
      method,
    })
  ).data;
}

async function axiosGet(path: string, config: AxiosRequestConfig = {}): Promise<AxiosResponse> {
  return makeAxios('get', path, config);
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
