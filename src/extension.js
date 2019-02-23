const vscode = require("vscode");
const { StatusBarAlignment, window } = vscode;
const { writeOpenArticle } = require("./md");
const { portIsOccupied } = require("./config");
const { open } = require("./vsfun");

require("./logger");
const got = require("got");

async function getWebviewContent(url) {
  const response = await got(url);
  return response.body;
}
function activate(context) {
  console.log('Congratulations, your extension "xart" is now active!');
  const status = window.createStatusBarItem(StatusBarAlignment.Right, 100);
  let port = 3888;
  status.text = `-${port}-`;
  status.show();
  status.command = "extension.startSayHello";
  context.subscriptions.push(status);
  portIsOccupied(port)
    .then(() => {
      return require("./app")(context, port);
    })
    .then(() => {
      status.text = `${port}`;
    })
    .catch(err => {
      console.log(err);
      status.text = `!${port}`;
      vscode.window.showInformationMessage(err);
    });

  let currentPanel = undefined;

  context.subscriptions.push(
    vscode.commands.registerCommand("extension.startSayHello", () => {
      let columnToShowIn = vscode.ViewColumn.Beside;

      if (currentPanel) {
        currentPanel.reveal();
      } else {
        currentPanel = vscode.window.createWebviewPanel(
          "index",
          "index",
          columnToShowIn,
          { enableScripts: true, retainContextWhenHidden: true }
        );
        getWebviewContent("http://localhost:3888").then(html => {
          currentPanel.webview.html = html;
        });
        currentPanel.webview.onDidReceiveMessage(
          message => {
            switch (message.command) {
              case "open":
                getWebviewContent(
                  `http://localhost:3888/${decodeURIComponent(message.text)}`
                );
                return;
              case "alert":
                vscode.window.showErrorMessage(message.text);
                return;
            }
          },
          undefined,
          context.subscriptions
        );
        // Reset when the current panel is closed
        currentPanel.onDidDispose(
          () => {
            currentPanel = undefined;
          },
          null,
          context.subscriptions
        );
      }
    })
  );

  let newPost = vscode.commands.registerCommand(
    "extension.newPost",
    function() {
      console.log("newPost");
      let date = new Date();
      let fileName = [
        date.getMonth(),
        date.getDate(),
        parseInt("" + Math.random() * 100)
      ]
        .map(e => ("0" + e).substr(-2, 2))
        .join("");

      /*
  cnTitle,
  date,
  url,
  fileName,
  lang,
  content,
  published,
  permalink
   */
      let data = {
        fileName,
        url: "",
        title: "new post",
        date: new Date(),
        lang: "zh_CN",
        content: "",
        published: false,
        permalink: ""
      };
      let filePath = writeOpenArticle(data);
      open(filePath);
    }
  );
  context.subscriptions.push(newPost);
}
exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {}
exports.deactivate = deactivate;
