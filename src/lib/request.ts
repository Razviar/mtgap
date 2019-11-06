import axios, { AxiosRequestConfig } from "axios";

axios.defaults.withCredentials = true;

function makeAxios<T, U>(method: "post" | "get") {
  return async (
    url: string,
    data?: T,
    config?: AxiosRequestConfig
  ): Promise<U> => {
    const configBase: AxiosRequestConfig = {
      url: `https://mtgarena.pro/${url}`,
      method,
      data
    };
    const newConfig = { ...(config || {}), ...configBase };
    return (await axios(newConfig)).data;
  };
}

interface RequestInterface {
  get<T>(url: string, config?: AxiosRequestConfig): Promise<T>;
  post<T, U>(url: string, data?: T, config?: AxiosRequestConfig): Promise<U>;
}

const Request: RequestInterface = {
  get: makeAxios("get"),
  post: makeAxios("post")
};

export default Request;
