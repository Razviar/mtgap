export interface UserResult {
  status: string;
  data: string;
}

export interface UserRequest {
  cm_userbytokenid: string;
  version: number;
}