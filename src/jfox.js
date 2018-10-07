const axios = require("axios");
const { draftsFolder } = require("./config");
const jsdom = require("jsdom");
const jq = require("jquery");
const { JSDOM } = jsdom;
const read = require("node-readability");
const h2m = require("h2m");

const sanitize = require("sanitize-filename");
const { writeOpenArticle } = require("./md");
const sleep = require("./sleep");
const { handleChangeMD } = require("./handlers");

function getArc(url) {
  return new Promise((resolve, reject) => {
    read(
      url,
      {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/68.0.3440.106 Safari/537.36",
        Referer: url
      },
      (err, article, meta) => {
        console.log(article);
        if (err) {
          return reject(err);
        } else {
          return resolve(article);
        }
      }
    );
  });
}
let index = 0;

function getUrl(url) {
  return (async () => {
    let arc = await getArc(url);
    console.log("art:");
    console.log(arc.title);
    let content = h2m(arc.content, {});
    let permalink = url.replace("http://www.jfox.info/", "");
    content = content
      .replace(/By  \- Last.*?[\r\n]/, "")
      .replace(
        "[![](http://www.jfox.info/wp-content/uploads/2018/06/ewm2.png)](https://itunes.apple.com/cn/app/学英语听新闻/id1368539116?mt=8)",
        ""
      );
    let date = new Date();
    let fileName = [2017, 1, 1, parseInt("" + index++)]
      .map(e => ("0" + e).substr(-2, 2))
      .join("");
    let filePath = writeOpenArticle(
      fileName,
      url,
      arc.title || "new post",
      sanitize(arc.title) || "new post",
      new Date("2017-01-01"),
      "zh_CN",
      content,
      draftsFolder,
      true,
      permalink
    );
    await handleChangeMD(filePath);
    console.log("***finish " + filePath);
    //console.log(content);
  })();
}

(async () => {
  for (let i = 1; i < 40; i++) {
    console.log("**page " + i);
    let url = "http://www.jfox.info/page/" + i;
    console.log(url);
    let links = await axios({
      url: url,
      headers: {
        referer: "http://www.jfox.info/",
        "user-agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.100 Safari/537.36"
      }
    }).then(res => {
      const { window } = new JSDOM(res.data);
      const $ = jq(window);
      let links = $.find("header h4 a");
      return links;
      //console.log(link.html());
    });

    for (let k = 0; k < links.length; k++) {
      let link = links[k];
      console.log(link.href);
      await getUrl(link.href);
      await sleep(2000);
    }
  }
  console.log("done");
  process.exit(0);
})();
