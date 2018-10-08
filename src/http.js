const axios = require("./configAxios");
function httpGet(url, opts) {
  return axios({ opts, url: url }).then(res => {
    return res.data;
  });
}

module.exports = { httpGet };
