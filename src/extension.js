// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require("vscode");
const globalTunnel = require("global-tunnel-ng");
const { URL } = require("url");
const { writeOpenArticle } = require("./md");
const { draftsFolder, setConfig} = require("./config");
const { open } = require("./vsfun");

//const express = require("express");
//const app = express();
let log = vscode.window.createOutputChannel("xart");
log.show();
//
console.log(
  "http.proxy:" + vscode.workspace.getConfiguration("http").get("proxy")
);
if (vscode.workspace.getConfiguration("http").get("proxy")) {
  setConfig("httpProxy",vscode.workspace.getConfiguration("http").get("proxy"));
  /*const httpProxyUrl = new URL(
    vscode.workspace.getConfiguration("http").get("proxy")
  );
  console.log(httpProxyUrl.hostname, httpProxyUrl.port);
  globalTunnel.initialize({
    host: httpProxyUrl.hostname,
    port: parseInt(httpProxyUrl.port)
    //proxyAuth: 'userId:password', // optional authentication
    //sockets: 50 // optional pool size for each http and https
  });*/
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('Congratulations, your extension "xart" is now active!');

  require("./app");

  /*app.get("/", (req, res) => {
    console.log("hello");
    res.send("Hello World!");
    log.appendLine("hello xmake!");
  });

  app.listen(3000, () => console.log("Example app listening on port 3000!"));
*/
  // The command has been defined in the package.json file
  // Now provide the implementation of the command with  registerCommand
  // The commandId parameter must match the command field in package.json
  let disposable = vscode.commands.registerCommand(
    "extension.sayHello",
    function() {
      // The code you place here will be executed every time your command is executed

      // Display a message box to the user
      vscode.window.showInformationMessage("Hello World!");
    }
  );

  context.subscriptions.push(disposable);
  let newPost = vscode.commands.registerCommand(
    "extension.newPost",
    function() {
      console.log("newPost");
      let date = new Date();
      let fileName = [
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        parseInt("" + Math.random() * 100)
      ]
        .map(e => ("0" + e).substr(-2, 2))
        .join("");
      let filePath = writeOpenArticle(
        fileName,
        "",
        "new post",
        "new post",
        new Date(),
        "zh_CN",
        "",
        draftsFolder
      );
      open(filePath);
    }
  );
  context.subscriptions.push(newPost);
}
exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {}
exports.deactivate = deactivate;
