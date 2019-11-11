import axios, { AxiosRequestConfig } from 'axios';
import zlib from 'zlib';

function makeAxios<T, U>(method: 'post' | 'get', gzip?: boolean) {
  return async (
    url: string,
    data?: T,
    config?: AxiosRequestConfig
  ): Promise<U> => {
    let gzipped = '';
    if (data && gzip) {
      gzipped = zlib.gzipSync(JSON.stringify(data)).toString('base64');
    }
    const configBase: AxiosRequestConfig = {
      withCredentials: false,
      url: `https://mtgarena.pro/${url}`,
      method,
      data: gzip ? gzipped : data,
    };

    const newConfig = { ...(config || {}), ...configBase };
    return (await axios(newConfig)).data;
  };
}

interface RequestInterface {
  get<T>(url: string, config?: AxiosRequestConfig): Promise<T>;
  post<T, U>(url: string, data?: T, config?: AxiosRequestConfig): Promise<U>;
  gzip<T, U>(url: string, data?: T, config?: AxiosRequestConfig): Promise<U>;
}

const Request: RequestInterface = {
  get: makeAxios('get'),
  post: makeAxios('post'),
  gzip: makeAxios('post', true),
};

export default Request;
