// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require("vscode");
const { StatusBarAlignment, window } = vscode;
// const globalTunnel = require("global-tunnel-ng");
const { writeOpenArticle } = require("./md");
const { draftsFolder, portIsOccupied } = require("./config");
const { open } = require("./vsfun");
var translate = require("./translate");

require("./logger");
const got = require("got");

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

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
async function getWebviewContent(url) {
  const response = await got(url);
  return response.body;
}
function activate(context) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
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

  context.subscriptions.push(
    vscode.commands.registerCommand("extension.startSayHello", () => {
      let columnToShowIn = vscode.ViewColumn.Beside;
      //vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : undefined;

      if (currentPanel) {
        currentPanel.reveal();
      } else {
        // Otherwise, create a new panel
        currentPanel = vscode.window.createWebviewPanel(
          "index",
          "index",
          columnToShowIn,
          { enableScripts: true, retainContextWhenHidden: true }
        );
        getWebviewContent("http://localhost:3888").then(html => {
          currentPanel.webview.html = html;
        });
        // Handle messages from the webview
        currentPanel.webview.onDidReceiveMessage(
          message => {
            console.log(message.command);
            console.log(message.text);
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
  context.subscriptions.push(
    vscode.commands.registerCommand("extension.startTranslate", function() {
      // The code you place here will be executed every time your command is executed

      var editor = vscode.window.activeTextEditor;

      if (!editor) {
        console.log("no open thext editor!");
        return; // No open text editor
      }

      if (editor.selection.isEmpty) {
        const position = editor.selection.active;
        var startPosition = position.with(position.line, 0);
        //var endPosition = position.with(position.line + 1, 0);
        let endPosition = new vscode.Position(
          position.line,
          editor.document.lineAt(position.line).range.end.character
        );
        var newSelection = new vscode.Selection(startPosition, endPosition);
        editor.selection = newSelection;
      }
      var text = editor.document.getText(editor.selection);

      if (!text) {
        return;
      }

      (async () => {
        let translateResult = await translate(text.trim(), {
          raw: true,
          to: "zh-CN"
        });
        console.log(translateResult);
        vscode.window.showInformationMessage(translateResult);
      })();
    })
  );

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
  );

  context.subscriptions.push(disposable);
  */
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
  /*
  let disposable = vscode.commands.registerCommand(
    "extension.selectLine",
    () => {
      let editor = vscode.window.activeTextEditor;
      if (!editor) {
        return;
      }

      let { document, selections } = editor;

      editor.selections = selections.map(s => {
        // active.line is zero based while document.lineCount aren't
        // therefore s.active.line is increased by one here
        let currentLine = s.active.line + 1;
        let selectionFirst = new vscode.Position(s.start.line, 0);

        // expand selection to current line forward
        if (document.lineCount > currentLine) {
          let selectionForward = new vscode.Position(currentLine, 0);
          return new vscode.Selection(selectionFirst, selectionForward);
        }

        // default expand selection to current line
        let selectionCurrentLine = new vscode.Position(
          s.active.line,
          document.lineAt(s.active.line).range.end.character
        );
        return new vscode.Selection(selectionFirst, selectionCurrentLine);
      });
    }
  );

  context.subscriptions.push(disposable);*/
}
exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {}
exports.deactivate = deactivate;
