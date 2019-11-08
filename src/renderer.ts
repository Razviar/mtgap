import { ipcRenderer } from "electron";
import "./index.css";
import { userbytokenid } from "./api/userbytokenid";

const Token: HTMLElement | null = document.getElementById("token");
const TokenResponse: HTMLElement | null = document.getElementById(
  "TokenResponse"
);

if (Token && TokenResponse) {
  Token.addEventListener("change", (element: any) => {
    //console.log(element.target);
    //ipcRenderer.send("token-input", element.target.value);
    userbytokenid(element.target.value, 1).then(res => {
      //console.log(res);
      if (res.status === "BAD_TOKEN") {
        TokenResponse.innerHTML = "Bad Token!";
      } else if (res.status === "NO_USER") {
        TokenResponse.innerHTML = "No user found!";
      } else {
        TokenResponse.innerHTML =
          "User found: <strong>" + res.status + "</strong>";
      }
    });
  });
}
