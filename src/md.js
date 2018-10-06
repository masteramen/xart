const read = require("node-readability");
const h2m = require("h2m");
const fs = require("fs");
const vscode = require("vscode");
const sanitize = require("sanitize-filename");

const { translateStr, translatePure } = require("./translator");
const md5 = require("./md5");

const { exec } = require("child_process");

function formate2(d) {
  return `0${d}`.substr(-2, 2);
}

function formatDateTime(date) {
  const timeStr = `${formate2(date.getUTCHours())}:${formate2(
    date.getMinutes()
  )}:${formate2(date.getSeconds())}`;
  const dateStr = `${date.getFullYear()}-${formate2(
    date.getMonth()
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
  draftsFolder
) {
  const body = articleContent(
    cnTitle,
    title,
    date,
    url,
    fileName,
    lang,
    content
  );
  const draftFolder = `${draftsFolder}${fileName}/`;
  const filePath = `${draftFolder}${sanitize(title).replace(/[/\\]/g, " ")}.md`;
  if (!fs.existsSync(draftFolder)) {
    fs.mkdirSync(draftFolder);
  }
  console.log(`filePaht:${filePath}`);
  fs.writeFileSync(filePath, body);
  var openPath = vscode.Uri.file(filePath);
  vscode.workspace.openTextDocument(openPath).then(doc => {
    vscode.window.showTextDocument(doc);
  });
}

function articleContent(cnTitle, title, date, url, fileName, lang, content) {
  return `---
layout: post
title:  "${cnTitle}"
title2:  "${title}"
date:   ${formatDateTime(date)}
source:  "${url}"
fileName:  "${fileName}"
lang:  "${lang}"
published: false
---
{% raw %}
${content.trim()}
{% endraw %}
`;
}
function tomd(url, draftsFolder) {
  return new Promise((resolve, reject) => {
    console.log(url);
    if (url) {
      read(
        url,
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
          let content = h2m(article.content, {});
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
            writeOpenArticle(
              fileName,
              url,
              cnTitle,
              article.title,
              date,
              lang,
              content,
              draftsFolder
            );
            // exec(`code "${filePath}"`, (err, stdout, stderr) => {});
          })();
        }
      );
    } else {
      return reject(`fail: ${url}`);
    }
  });
}

module.exports = { tomd, writeOpenArticle };
