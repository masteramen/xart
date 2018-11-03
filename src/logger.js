const vscode = require("vscode");
//const shell = require("shelljs");

let logger = vscode.window.createOutputChannel("xart");
logger.show();
let log = console.log;
console.log = function(str) {
  if (str) logger.appendLine(str.toString());
  else logger.appendLine(str);
  log(str);
};
