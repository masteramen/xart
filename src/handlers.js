const path = require("path");
const fs = require("fs");
const fm = require("front-matter");
const shell = require("shelljs");
const { open } = require("./vsfun");
const { getPostFolders, getDraftFolders } = require("./config");

function handleChangeMD(filePath) {
  if (!filePath.endsWith(".md")) return;
  console.log(filePath);
  console.log(getDraftFolders());
  if (filePath.indexOf("_posts") > -1) {
    return;
  }
  console.log("handleChangeMD start");
  return (async () => {
    try {
      const postfm = fm(fs.readFileSync(filePath, "utf8"));
      const { published, fileName } = postfm.attributes;
      console.log(filePath);
      console.log(JSON.stringify(postfm.attributes));
      let { date } = postfm.attributes;
      date = new Date(date);

      const folder = `${getPostFolders()}${date.getFullYear()}/${fileName}/`;
      const postFileName = `${date.getFullYear()}-${`0${date.getMonth() +
        1}`.substr(-2, 2)}-${`0${date.getDate()}`.substr(
        -2,
        2
      )}-${fileName}.md`;
      const postFilePath = `${folder}${postFileName}`;
      console.log(`published:${published}`);
      if (published === true) {
        try {
          shell.mkdir("-p", folder);
        } catch (e) {}

        const fileContent = fs.readFileSync(filePath, "utf8");
        /* handle images */
        const data = fileContent.split("\n");
        const afterProcessData = [];
        const keepFiles = [];
        for (let i = 0; i < data.length; i += 1) {
          let line = data[i];

          line = line.replace(/(!\[.*?\]\()(.*?)(\))/, (
            match,
            p1,
            url,
            p3 /* , offset, string */
          ) => {
            const draftPath = `${getDraftFolders()}${fileName}/${url}`;
            const postPath = folder + url;
            if (
              !url.match(/^http[s]?:\/\/.*?/) &&
              fs.existsSync(draftPath) &&
              !fs.existsSync(postPath)
            ) {
              fs.createReadStream(draftPath).pipe(
                fs.createWriteStream(postPath)
              );
              console.log(`copy res from ${draftPath} to ${postPath}`);
            }
            keepFiles.push(url);
            return p1 + url + p3;
          });

          afterProcessData.push(line);
        }
        /* handler images end */

        fs.writeFileSync(postFilePath, fileContent.trim());
        console.log(`postfm.attributes.lang:${postfm.attributes.lang}`);

        keepFiles.push(postFileName);
        shell
          .ls(folder)
          .filter(it => keepFiles.indexOf(it) === -1)
          .forEach(it => {
            console.log(`remove file ${folder}${it}`);
            shell.rm(folder + it);
          });
      } else if (published === "deleted") {
        console.log(`delete folder ${path.dirname(filePath)}`);
        shell.rm("-rf", path.dirname(filePath));
        return;
      }

      const { title } = postfm.attributes;
      let titleFileName = title + ".md";
      let newFilePath = path.dirname(filePath) + "/" + titleFileName;
      console.log(`new FilePath:${newFilePath}`);
      if (path.basename(filePath) != titleFileName) {
        setTimeout(() => {
          shell.mv(filePath, newFilePath);
          //if(vscode.window.activeTextEditor.document.uri.fsPath==filePath){
          console.log(`newFilePath:${newFilePath}`);
          open(newFilePath);
          // }
        }, 200);
      }

      // console.log(postfm);
    } catch (e) {
      console.log(e);
    }

    // log("File", filePath, "has been changed");
  })();
}

module.exports = { handleChangeMD };
