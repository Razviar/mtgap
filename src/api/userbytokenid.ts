import Request from "root/lib/request";
import { UserResult, UserRequest } from "root/models/userbytokenid";

export async function userbytokenid(
  cm_userbytokenid: string,
  version: number
): Promise<UserResult> {
  const res = await Request.post<UserRequest, UserResult>(
    "/mtg/donew2.php?cmd=cm_userbytokenid",
    {
      cm_userbytokenid,
      version
    }
  );
  return res;
}
