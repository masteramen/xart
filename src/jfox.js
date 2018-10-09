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

const axios = require("./configAxios");

let headers = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/68.0.3440.106 Safari/537.36",
  Referer: "http://www.jfox.info"
};

function getArc(url) {
  console.log("start getArc");
  return axios({ url: url, headers: headers, timeout: 2000 })
    .then(res => {
      return res.data;
    })
    .then(html => {
      console.log("get Arc " + url);
      return new Promise((resolve, reject) => {
        read(html, {}, (err, article, meta) => {
          // console.log(article);
          if (err) {
            return reject(err);
          } else {
            return resolve(article);
          }
        });
      });
    });
}
let index = 0;

async function getUrl(url) {
  let arc = await getArc(url);
  console.log("art:");
  console.log(arc.title);
  let content = h2m(arc.content, {});
  let permalink = "2017/"+url.replace("http://www.jfox.info/", "");
  content = content
    .replace(/By  \- Last.*?[\r\n]/, "")
    .replace(
      "[![](http://www.jfox.info/wp-content/uploads/2018/06/ewm2.png)](https://itunes.apple.com/cn/app/学英语听新闻/id1368539116?mt=8)",
      ""
    );
  let date = new Date(new Date("2017-01-01").getTime() - 1000 * index);
  let fileName = 20170101500;
  arc.title = arc.title.replace("» java面试题", "").trim();
  let filePath = writeOpenArticle(
    "" + (fileName - index),
    url,
    arc.title || "new post",
    sanitize(arc.title) || "new post",
    date,
    "zh_CN",
    content,
    draftsFolder,
    true,
    permalink
  );
  console.log("handle...");
  await handleChangeMD(filePath);
  console.log("***finish " + filePath);
  //console.log(content);
}

(async () => {
  try {
    for (let i = 1; i < 40; i++) {
      index = 30 * (i - 1);
      console.log("**page " + i);
      let url = "http://www.jfox.info/page/" + i;
      console.log(url);
      let links = await axios({
        url: url,
        headers: headers
      }).then(res => {
        const { window } = new JSDOM(res.data);
        const $ = jq(window);
        let links = $.find("header h4 a");
        return links;
        //console.log(link.html());
      });
      console.log("start get links");
      for (let k = 0; k < links.length; k++) {
        let link = links[k];
        console.log(link.href);
        try {
          await getUrl(link.href);
        } catch (ee) {
          console.log(ee);
        }
        //console.log("sleep 5s");
        await sleep(3000);
        index += 1;
      }
    }
  } catch (e) {
    console.log("error");
    console.log(e);
  }
  console.log("done");
  process.exit(0);
})();
