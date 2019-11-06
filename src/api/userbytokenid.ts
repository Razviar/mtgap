import Request from "root/lib/request";
import { UserResult, UserRequest } from "root/models/userbytokenid";

export async function userbytokenid(
  cm_userbytokenid: string
): Promise<UserResult> {
  const res = await Request.post<UserRequest, UserResult>("/mtg/donew.php", {
    cmd: "cm_userbytokenid",
    cm_userbytokenid
  });
  console.log(res);
  return res;
}
