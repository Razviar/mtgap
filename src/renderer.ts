/**
 * This file will automatically be loaded by webpack and run in the "renderer" context.
 * To learn more about the differences between the "main" and the "renderer" context in
 * Electron, visit:
 *
 * https://electronjs.org/docs/tutorial/application-architecture#main-and-renderer-processes
 *
 * By default, Node.js integration in this file is disabled. When enabling Node.js integration
 * in a renderer process, please be aware of potential security implications. You can read
 * more about security risks here:
 *
 * https://electronjs.org/docs/tutorial/security
 *
 * To enable Node.js integration in this file, open up `main.js` and enable the `nodeIntegration`
 * flag:
 *
 * ```
 *  // Create the browser window.
 *  mainWindow = new BrowserWindow({
 *    width: 800,
 *    height: 600,
 *    webPreferences: {
 *      nodeIntegration: true
 *    }
 *  });
 * ```
 */

import { ipcRenderer } from "electron";
import "./index.css";

console.log(
  '👋 This message is being logged by "renderer.js", included via webpack'
);

const Token: HTMLElement | null = document.getElementById("token");
const TokenResponse: HTMLElement | null = document.getElementById(
  "TokenResponse"
);

if (Token) {
  Token.addEventListener("change", (element: any) => {
    //console.log(element.target);
    ipcRenderer.send("token-input", element.target.value);
  });
}

if (TokenResponse) {
  ipcRenderer.on("token-updated", (event, arg) => {
    //console.log("test");
    TokenResponse.innerHTML = "User found: <strong>" + arg + "</strong>";
  });

  ipcRenderer.on("token-bad", (event, arg) => {
    //console.log("test");
    TokenResponse.innerHTML = "Bad Token!";
  });
}
