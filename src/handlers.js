const path = require("path");
const fs = require("fs");
const fm = require("front-matter");
const shell = require("shelljs");
const sleep = require("./sleep");
const { open } = require("./vsfun");
const { getPostFolders, getDraftFolders} = require("./config");
const {monitorWorkHome} = require("./app"); 
//const console = require("./logger");
function getImageMd5FileName(url) {
  let subfix = url.split(".").pop();
  if (subfix.length > 4) {
    subfix = "";
  } else subfix = `.${subfix}`;
  return ``;
}
function handleChangeMD(filePath) {
  (async ()=>{
    monitorWorkHome();
  });
  if (!filePath.endsWith(".md")) return;
  if (filePath.indexOf("_posts") > -1) {
    return;
  }
  console.log("handleChangeMD start");
  return (async () => {
    try {
      const postfm = fm(fs.readFileSync(filePath, "utf8"));
      const { published, fileName, source } = postfm.attributes;
      console.log(filePath);
      console.log(JSON.stringify(postfm.attributes));
      let { date } = postfm.attributes;
      date = new Date(date);

      const folder = `${getDraftFolders()}${date.getFullYear()}/${fileName}/`;
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
        const allPostFiles = [];

        fs.writeFileSync(postFilePath, fileContent.trim());
        console.log(`postfm.attributes.lang:${postfm.attributes.lang}`);

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
      } else {
        const postfm = fm(fs.readFileSync(filePath, "utf8"));
        const { title } = postfm.attributes;
        let titleFileName = title + ".md";
        let newFilePath = path.dirname(filePath) + "/" + titleFileName;
        if (path.basename(filePath) != titleFileName) {
          setTimeout(() => {
            shell.mv(filePath, newFilePath);
            //if(vscode.window.activeTextEditor.document.uri.fsPath==filePath){
            console.log(`newFilePath:${newFilePath}`);
            open(newFilePath);
            // }
          }, 200);
        }
      }
      // console.log(postfm);
    } catch (e) {
      console.log(e);
    }

    // log("File", filePath, "has been changed");
  })();
}

module.exports = { handleChangeMD };
