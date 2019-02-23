const userHome = require("user-home");
const vscode = require("vscode");

let hexoHome = vscode.workspace
  .getConfiguration("xart.extension.config")
  .get("location")
  .replace("~", userHome);

function getPostFolders() {
  return (
    vscode.workspace
      .getConfiguration("xart.extension.config")
      .get("location")
      .replace("~", userHome) + "/_posts/"
  );
}
function getDraftFolders() {
  return (
    vscode.workspace
      .getConfiguration("xart.extension.config")
      .get("location")
      .replace("~", userHome) + "/_drafts/"
  );
}

//const hexoHome = userHome + "/git/hexo";
const jekyllHome = `${hexoHome}/source/`;
const postsFolder = `${jekyllHome}_posts/`;
const draftsFolder = `${jekyllHome}_drafts/`;

module.exports = {
  jekyllHome,
  postsFolder,
  draftsFolder,
  getPostFolders,
  getDraftFolders
};
