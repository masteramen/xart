const fs = require("fs");
const { getDraftFolders } = require("./config");

const sanitize = require("sanitize-filename");
const shell = require("shelljs");
const path = require("path");

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

function writeOpenArticle({
  fileName,
  url,
  title,
  date,
  lang,
  content,
  published,
  permalink
}) {
  const body = articleContent({
    title,
    date,
    url,
    fileName,
    lang,
    content,
    published,
    permalink
  });

  const postFolder = `${getDraftFolders()}${fileName}/`;
  const filePath = `${postFolder}${sanitize(title).replace(/[/\\]/g, " ")}.md`;
  if (!fs.existsSync(postFolder)) {
    shell.mkdir("-p", postFolder);
  }
  console.log(`filePaht:${filePath}`);
  shell.mkdir(path.dirname(filePath), "p");
  fs.writeFileSync(filePath, body);
  return filePath;
}

function articleContent({
  title,
  date,
  url,
  fileName,
  lang,
  content,
  published,
  permalink
}) {
  return `---
layout: post
title:  "${title}"
date:   ${formatDateTime(date)}
source:  "${url}"
fileName:  "${fileName}"
lang:  "${lang}"
published: ${published}
categories: []
tags: []
${permalink ? 'permalink: "' + permalink + '"' : ""}
---
${content.trim()}
`;
}

module.exports = { writeOpenArticle };
