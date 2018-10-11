// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require("vscode");
const {
  ExtensionContext,
  StatusBarAlignment,
  window,
  StatusBarItem,
  Selection,
  workspace,
  TextEditor,
  commands
} = vscode;
// const globalTunnel = require("global-tunnel-ng");
const { writeOpenArticle } = require("./md");
const { draftsFolder, setConfig } = require("./config");
const { open } = require("./vsfun");
const got = require("got");
//const express = require("express");
//const app = express();
let log = vscode.window.createOutputChannel("xart");
log.show();
//
console.log(
  "http.proxy:" + vscode.workspace.getConfiguration("http").get("proxy")
);
if (vscode.workspace.getConfiguration("http").get("proxy")) {
  setConfig(
    "httpProxy",
    vscode.workspace.getConfiguration("http").get("proxy")
  );
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
async function getWebviewContent(url) {
  return   `<!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Cat Coding</title>
  </head>
  <body>
      <img src="https://media.giphy.com/media/JIX9t2j0ZTN9S/giphy.gif" width="300" />
      <h1 id="lines-of-code-counter" onclick="open()">0</h1>
  
      <script>
        function open(){
          const vscode = acquireVsCodeApi();
          vscode.postMessage({
            command: 'alert',
            text: '🐛  hello '
        })
        }

      </script>
  </body>
  </html>`;
  //const response = await got(url);
  //return response.body;
}
function activate(context) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('Congratulations, your extension "xart" is now active!');
  const status = window.createStatusBarItem(StatusBarAlignment.Right, 100);
  status.text = "=3888";
  status.show();

  require("./app")(context)
    .then(() => {
      status.text = "3888";
      status.command = "extension.sayHello";
      context.subscriptions.push(status);
    })
    .catch(err => {
      console.log(err);
      status.text = "!3888";
      vscode.window.showInformationMessage(err);
    });

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

  let currentPanel = undefined;

  context.subscriptions.push(vscode.commands.registerCommand('extension.sayHello', () => {
      let  columnToShowIn = vscode.ViewColumn.Two;
      //vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : undefined;

      if (currentPanel) {
          currentPanel.reveal(columnToShowIn);
      } else {
          // Otherwise, create a new panel
          currentPanel = vscode.window.createWebviewPanel('catCoding', "Cat Coding", columnToShowIn, { enableScripts: true});
           getWebviewContent('http://localhost:3888').then(html=>{
            currentPanel.webview.html = html;
          });
        // Handle messages from the webview
        currentPanel.webview.onDidReceiveMessage(message => {
          switch (message.command) {
            case 'open':
            getWebviewContent(`http://localhost:3888/${message.text}`)
            return;
              case 'alert':
                  vscode.window.showErrorMessage(message.text);
                  return;
          }
      }, undefined, context.subscriptions);
          // Reset when the current panel is closed
          currentPanel.onDidDispose(() => {
              currentPanel = undefined;
          }, null, context.subscriptions);
      }
  }));

  /*let disposable = vscode.commands.registerCommand(
    "extension.sayHello",
    function() {
      // The code you place here will be executed every time your command is executed

      // Display a message box to the user
      vscode.commands.executeCommand(
        "vscode.open",
        vscode.Uri.parse("http://localhost:3888")
      );

      vscode.window.showInformationMessage("Hello World!");

      // Create and show a new webview
      const panel = vscode.window.createWebviewPanel(
        'catCoding', // Identifies the type of the webview. Used internally
        "Cat Coding", // Title of the panel displayed to the user
        vscode.ViewColumn.Two, // Editor column to show the new webview panel in.
        { } // Webview options. More on these later.
      );
      panel.webview.html = getWebviewContent();
      panel.onDidDispose(() => {
        // When the panel is closed, cancel any future updates to the webview content
    }, null, context.subscriptions)
    }
  );*/

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
