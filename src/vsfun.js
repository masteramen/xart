const vscode = require("vscode");

function open(filePath) {
  var openPath = vscode.Uri.file(filePath);
  vscode.workspace.openTextDocument(openPath).then(doc => {
    vscode.window.showTextDocument(doc, vscode.ViewColumn.One);
  });
}
module.exports = { open };
