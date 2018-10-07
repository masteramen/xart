const path = require("path");
const fs = require("fs");
const fm = require("front-matter");
const shell = require("shelljs");
const axios = require("axios");
const md5 = require("./md5");
const sleep = require("./sleep");
const { postsFolder, draftsFolder } = require("./config");
function getImageMd5FileName(url) {
  let subfix = url.split(".").pop();
  if (subfix.length > 4) {
    subfix = "";
  } else subfix = `.${subfix}`;
  return `${md5(url)}${subfix}`;
}
function handleChangeMD(filePath) {
  if (!filePath.endsWith(".md")) return;
  return (async () => {
    try {
      const postfm = fm(fs.readFileSync(filePath, "utf8"));
      const { published, fileName, source } = postfm.attributes;
      let { date } = postfm.attributes;
      date = new Date(date);

      const folder = `${postsFolder}/${date.getFullYear()}/${fileName}/`;
      const draftFolder = `${draftsFolder}${fileName}/`;
      const postFileName = `${date.getFullYear()}-${`0${date.getMonth() +
        1}`.substr(-2, 2)}-${`0${date.getDate()}`.substr(
        -2,
        2
      )}-${fileName}.md`;
      const postFilePath = `${folder}${postFileName}`;

      if (published === true) {
        shell.mkdir("-p", folder);

        const fileContent = fs.readFileSync(filePath, "utf8");
        const data = fileContent.split("\n");
        const afterProcessData = [];
        const downloadedUrls = [];
        const allPostFiles = [];
        // download remote resource to jekyllPosts
        for (let i = 0; i < data.length; i += 1) {
          let line = data[i];
          let result;
          const myRegexp = /(!\[.*?\]\()(.*?)(\))/g;
          // eslint-disable-next-line no-cond-assign
          while ((result = myRegexp.exec(line))) {
            const url = result[2];
            console.log(url);
            if (
              url.match(/^http[s]?:\/\//) &&
              downloadedUrls.indexOf(url) === -1
            ) {
              const md5FileName = getImageMd5FileName(url);
              const resFilePath = folder + md5FileName;
              try {
                if (!fs.existsSync(resFilePath)) {
                  let headers = {
                    referer: source,
                    "user-agent":
                      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.100 Safari/537.36"
                  };
                  console.log(`download resource ${url} to ${resFilePath}`);
                  // eslint-disable-next-line no-await-in-loop
                  /*await request({
                      url,
                      headers: {
                        referer: source,
                        "user-agent":
                          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.100 Safari/537.36"
                      }
                    }).on("response", r => {
                      if (r.statusCode === 200) {
                        r.pipe(fs.createWriteStream(resFilePath));
                      } else {
                        console.log(`status code :${r.statusCode}`);
                      }
                    });*/
                  // eslint-disable-next-line no-await-in-loop
                  await axios({
                    method: "get",
                    url: url,
                    responseType: "stream",
                    headers: headers
                  }).then(response => {
                    console.log(` status:${response.status}`);
                    if (response.status === 200) {
                      console.log(resFilePath);
                      response.data.pipe(fs.createWriteStream(resFilePath));
                    }
                  });
                  await sleep(1000);
                } else {
                  console.log(`resource ${url} exists in ${resFilePath}`);
                }
                downloadedUrls.push(url);
              } catch (e) {
                console.log(`download resource ${url} fail:${e}`);
              }
            }
          }
          // replace remote resource to local
          line = line.replace(/(!\[.*?\]\()(.*?)(\))/, (
            match,
            p1,
            url,
            p3 /* , offset, string */
          ) => {
            const encodeUrl = getImageMd5FileName(url);
            allPostFiles.push(encodeUrl);
            const draftPath = draftFolder + encodeUrl;
            const postPath = folder + encodeUrl;
            if (fs.existsSync(draftPath) && !fs.existsSync(postPath)) {
              fs.createReadStream(draftPath).pipe(
                fs.createWriteStream(postPath)
              );
              console.log(`copy res from ${draftPath} to ${postPath}`);
            }
            console.log(`url ${url} replace to ${encodeUrl}`);

            return p1 + encodeUrl + p3;
          });

          afterProcessData.push(line);
        }

        fs.writeFileSync(postFilePath, afterProcessData.join("\n").trim());
        console.log(`postfm.attributes.lang:${postfm.attributes.lang}`);
        if (postfm.attributes.lang !== "zh_CN") {
          console.log(`translate to :${postFilePath}`);
          translatorCn(postFilePath, postFilePath);
        }
        allPostFiles.push(postFileName);
        shell
          .ls(folder)
          .filter(it => allPostFiles.indexOf(it) === -1)
          .forEach(it => {
            console.log(`remove file ${folder}${it}`);
            shell.rm(folder + it);
          });
      } else if (published === "deleted") {
        console.log(`delete folder ${path.dirname(filePath)}`);
        shell.rm("-rf", path.dirname(filePath));
      }
      // console.log(postfm);
    } catch (e) {
      console.log(e);
    }

    // log("File", filePath, "has been changed");
  })();
}

module.exports = { handleChangeMD };
