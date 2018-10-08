const userHome = require("user-home");
const tunnel = require("tunnel-agent");

const jekyllHome = userHome + "/git/jekyll/";
const postsFolder = `${jekyllHome}_posts/`;
const draftsFolder = `${jekyllHome}/_drafts/`;
let httpProxy = null;
function getAgent() {
  if (httpProxy) {
    return tunnel.httpOverHttp({
      proxy: {
        host: httpProxy
      }
    });
  }
  return null;
}

module.exports = { jekyllHome, postsFolder, draftsFolder, getAgent };
