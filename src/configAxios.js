const got = require("got");

function retryAxios(opts) {
  return got
    .get(opts.url, {
      timeout: 2000,
      retries: 5,
      headers: {
        Referer: "http://www.jfox.info",
        "user-agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.100 Safari/537.36"
      }
    })
    .then(res => {
      return { data: res.body };
    });
}

module.exports = retryAxios;
