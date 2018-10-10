const userHome = require("user-home");
const { URL } = require("url");
const jekyllHome = userHome + "/git/jekyll/";
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

module.exports = { jekyllHome, postsFolder, draftsFolder, getAgent, setConfig };
