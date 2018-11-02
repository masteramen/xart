const read = require("node-readability");
const h2m = require("h2m");
const fs = require("fs");
const sanitize = require("sanitize-filename");
const shell = require("shelljs");
const path = require("path");

const { translateStr, translatePure } = require("./translator");
const md5 = require("./md5");
const { httpGet } = require("./http");

var TurndownService = require('turndown')
var turndownPluginGfm = require('turndown-plugin-gfm')

var gfm = turndownPluginGfm.gfm
var turndownService = new TurndownService()
turndownService.use(gfm)

function formate2(d) {
  return `0${d}`.substr(-2, 2);
}

function formatDateTime(date) {
  const timeStr = `${formate2(date.getUTCHours())}:${formate2(
    date.getMinutes()
  )}:${formate2(date.getSeconds())}`;
  const dateStr = `${date.getFullYear()}-${formate2(
    date.getMonth() + 1
  )}-${formate2(date.getDate())}`;
  return `${dateStr} ${timeStr}  +0800`;
}

function writeOpenArticle(
  fileName,
  url,
  cnTitle,
  title,
  date,
  lang,
  content,
  draftsFolder,
  published,
  permalink
) {
  const body = articleContent(
    cnTitle,
    title,
    date,
    url,
    fileName,
    lang,
    content,
    published,
    permalink
  );
  const draftFolder = `${draftsFolder}${fileName}/`;
  const filePath = `${draftFolder}${sanitize(title).replace(/[/\\]/g, " ")}.md`;
  if (!fs.existsSync(draftFolder)) {
    shell.mkdir("-p", draftFolder);

  }
  console.log(`filePaht:${filePath}`);
  shell.mkdir(path.dirname(filePath),'p');
  fs.writeFileSync(filePath, body);
  return filePath;
}

function articleContent(
  cnTitle,
  title,
  date,
  url,
  fileName,
  lang,
  content,
  published = false,
  permalink
) {
  return `---
layout: post
title:  "${cnTitle}"
title2:  "${title}"
date:   ${formatDateTime(date)}
source:  "${url}"
fileName:  "${fileName}"
lang:  "${lang}"
published: ${published}
${permalink ? 'permalink: "' + permalink + '"' : ""}
---
${content.trim()}
`;
}
function tomd(url, opts) {
  return new Promise((resolve, reject) => {
    console.log(url);
    let { draftsFolder } = opts;
    if (url) {
      httpGet(url, {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/68.0.3440.106 Safari/537.36",
        Referer: url
      }).then(html => {
        html = html.replace(/\n/g, " ");
        read(
          html,
          {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/68.0.3440.106 Safari/537.36",
            Referer: url
          },
          (err, article, meta) => {
            if (err) {
              return reject(`fail: ${err}`);
            }
            console.log(article.title);
           // let content = h2m(article.content, {});
            let content = turndownService.turndown(article.content);
            console.log(content);
            resolve("processing");
            (async () => {
              let cnTitle = article.title;
              let lang = "en";
              if (
                content.search(new RegExp("[\\u4E00-\\u9FFF]")) === -1 &&
                cnTitle.search(new RegExp("[\\u4E00-\\u9FFF]")) === -1
              ) {
                content = await translateStr(content);
                cnTitle = await translatePure(article.title);
              } else {
                lang = "zh_CN";
              }

              cnTitle = cnTitle.replace(/[\n\r]/g, "");
              console.log(content);
              const date = new Date();
              const fileName = md5(url);
              let filePath = writeOpenArticle(
                fileName,
                url,
                cnTitle,
                article.title,
                date,
                lang,
                content,
                draftsFolder
              );
              if (opts.callback) {
                opts.callback(filePath);
              }
              // exec(`code "${filePath}"`, (err, stdout, stderr) => {});
            })();
          }
        );
      });
    } else {
      return reject(`fail: ${url}`);
    }
  });
}

module.exports = { tomd, writeOpenArticle };
