const userHome = require("user-home");
const vscode = require("vscode");
const net = require("net");

let hexoHome = vscode.workspace
  .getConfiguration("xart.extension.config")
  .get("location")
  .replace("~", userHome);

function getPostFolders() {
  return (
    vscode.workspace
      .getConfiguration("xart.extension.config")
      .get("location")
      .replace("~", userHome) + "/source/_posts/"
  );
}
function getDraftFolders() {
  return (
    vscode.workspace
      .getConfiguration("xart.extension.config")
      .get("location")
      .replace("~", userHome) + "/source/_drafts/"
  );
}
function portIsOccupied(port) {
  const server = net.createServer().listen(port);
  return new Promise((resolve, reject) => {
    server.on("listening", () => {
      console.log(`the server is runnint on port ${port}`);
      server.close();
      resolve(port);
    });

    server.on("error", err => {
      if (err.code === "EADDRINUSE") {
        reject(err);
        //resolve(portIsOccupied(port + 1)); //注意这句，如占用端口号+1
        console.log(`this port ${port} is occupied.try another.`);
      } else {
        reject(err);
      }
    });
  });
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
  getDraftFolders,
  portIsOccupied
};
