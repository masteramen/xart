const userHome = require("user-home");
const vscode = require("vscode");
const net = require("net");
//https://juejin.im/post/59decff851882578c2084b5b
//https://tboox.org/cn/2017/10/11/xmake-vscode/
function getPostFolders() {
  return (
      getWorkHome()
      .replace("~", userHome) + "/source/_posts/"
  );
}

function getAutoCommitAndPush() {
  return (
    vscode.workspace
      .getConfiguration("xart")
      .get("autoCommitAndPush",false)
  );
}

function getDraftFolders() {
  return (
      getWorkHome()
      .replace("~", userHome) + "/source/_drafts/"
  );
}

function getWorkHome() {
  return (
    vscode.workspace
      .getConfiguration("xart")
      .get("location")
      .replace("~", userHome) 
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

module.exports = {
  getWorkHome,
  getPostFolders,
  getDraftFolders,
  portIsOccupied,getAutoCommitAndPush
};
