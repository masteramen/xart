const userHome = require("user-home");
const { URL } = require("url");
const net = require("net");

const hexoHome = userHome + "/git/hexo";
const jekyllHome = `${hexoHome}/source/"`;
const postsFolder = `${jekyllHome}_posts/`;
const draftsFolder = `${jekyllHome}/_drafts/`;
//const config= {httpProxy:"http://proxy-tmg.wb.devb.hksarg:8080/"};
const config = { httpProxy: "" };
var tunnel = require("tunnel");

function setConfig(name, value) {
  config[name] = value;
  console.log(JSON.stringify(config));
}
function getAgent() {
  if (config["httpProxy"]) {
    const httpProxyUrl = new URL(config["httpProxy"]);
    console.log(httpProxyUrl.hostname, httpProxyUrl.port);
    return tunnel.httpsOverHttp({
      proxy: {
        host: httpProxyUrl.hostname,
        port: httpProxyUrl.port
      }
    });
  }
  return null;
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
  jekyllHome,
  postsFolder,
  draftsFolder,
  getAgent,
  setConfig,
  portIsOccupied
};
