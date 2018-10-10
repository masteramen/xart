const got = require("got");
const axios = require("axios");
const { getAgent } = require("./config");
function retryAxios(opts) {
  let  options = Object.assign(
    {
      timeout: 2000,
      retries: 5,
      headers: {
        Referer: "https://www.google.com",
        "user-agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.100 Safari/537.36"
      },
      agent: getAgent()
    },
    opts
  );
  console.log(JSON.stringify(options));
  return got
    .get(
      opts.url,
      options
    )
    .then(res => {
     // console.log(JSON.stringify(res))
      return { data: res.body };
    });
}

function proxyAxios(opts){
  axios.defaults.proxy = getAgent()['options']['proxy'];
  console.log(JSON.stringify(axios.defaults))

  return axios(opts);
}
module.exports = retryAxios;




module.exports.axios= proxyAxios;