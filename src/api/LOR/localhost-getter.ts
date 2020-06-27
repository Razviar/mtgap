import {Request} from 'root/app/request';

export async function getLorAPI(endpoint: string): Promise<string> {
  // console.log(`Getting ${endpoint}`);
  return Request.get(endpoint, {}, 'http://127.0.0.1:21337/');
}
