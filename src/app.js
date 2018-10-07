const express = require("express");
const path = require("path");
const fs = require("fs");
const { exec } = require("child_process");
const chokidar = require("chokidar");
const fm = require("front-matter");
const request = require("request");
const shell = require("shelljs");
const glob = require("glob");
const vscode = require("vscode");
const axios = require("axios");
const { jekyllHome, postsFolder, draftsFolder } = require("./config");

const { handleChangeMD } = require("./handlers");
const md5 = require("./md5");
const { tomd } = require("./md");
const { open } = require("./vsfun");
const translatorCn = require("./translator_cn");

// const globalTunnel = require('global-tunnel-ng');
/* globalTunnel.initialize({
  //host: "192.168.1.30",
  //port: 8080
  //proxyAuth: 'userId:password', // optional authentication
  //sockets: 50 // optional pool size for each http and https
}); */
function getPostFile(dir) {
  // console.log('Starting from dir '+startPath+'/');

  if (!fs.existsSync(dir)) {
    console.log("no dir ", dir);
    return null;
  }

  const files = fs.readdirSync(dir);
  for (let i = 0; i < files.length; i += 1) {
    const filename = path.join(dir, files[i]);
    const stat = fs.lstatSync(filename);
    if (!stat.isDirectory() && filename.endsWith(".md")) {
      console.log("-- found: ", filename);
      return files[i];
    }
  }
  return null;
}
const app = express();
// app.use(express.static('public'))
var currentPath = process.cwd();
console.log(`currentPath:${currentPath}`);
console.log(__dirname);
app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "pug");
app.set("views", path.join(__dirname, "/views"));

setTimeout(() => {
  shell.exec("git pull ", { cwd: __dirname });
  shell.exec("git pull ", { cwd: jekyllHome });
}, 3000);

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

app.get("/act", (req, res) => {
  const { url } = req.query;
  console.log(url);

  (async () => {
    const first = glob
      .sync(`${draftsFolder}/**/*${md5(url)}.md`)
      .concat(glob.sync(`${postsFolder}/**/*${md5(url)}.md`));
    if (first.length > 0) {
      console.log(first[0]);
      const result =
        "<html><head><script>history.go(-2);</script></head></html>";
      res.send(result);
      var openPath = vscode.Uri.file(first[0]);
      vscode.workspace.openTextDocument(openPath).then(doc => {
        vscode.window.showTextDocument(doc);
      });
      // exec(`code ${first[0]}`);
    } else {
      const result =
        "<html><head><script>history.go(-2);</script></head></html>";
      res.send(result);
      tomd(url, { ...req.query, draftsFolder: draftsFolder, callback: open });
    }
  })();
});

app.get("/hello", (req, res) => {
  const { url } = req.query;
  // console.log(url);
  console.log(req.host);

  res.render("hello", { url, draft_url: "http://localhost:3888" });
});

app.get("/", (req, res) => {
  const targetPath = draftsFolder;
  // var files = fs.readdirSync(targetPath);
  const files = fs
    .readdirSync(targetPath)
    .map(f => {
      const pf = getPostFile(path.join(targetPath, f));
      return {
        name: path.join(f, pf),
        time: fs.statSync(path.join(targetPath, f, pf)).mtime.getTime()
      };
    })
    .filter(f => f.name)
    .sort((a, b) => b.time - a.time)
    .map(v => v.name);

  res.render("drafts", { title: "Drafts", fileNames: files });
});

app.get("/edit", (req, res) => {
  console.log(req.query.fileName);

  const targetPath = draftsFolder;

  const filename = req.query.fileName;
  const filePath = path.join(targetPath, filename);
  console.log(filePath);
  const stats = fs.statSync(filePath);
  const isFile = stats.isFile();
  let result =
    '<html><head><script>alert("file not exists");window.close();</script></head><body></body></html>';
  if (isFile) {
    exec(`code "${filePath}"`, (err, stdout, stderr) => {
      if (err) {
        // node couldn't execute the command
        return;
      }
      console.log(`stdout: ${stdout}`);
      console.log(`stderr: ${stderr}`);
    });
    result =
      "<html><head><script>window.close();</script></head><body></body></html>";
  }

  res.send(result);
});

app.listen(3888, () => console.log("Example app listening on port 3888!"));

const watcher = chokidar.watch(draftsFolder, {
  ignored: /[/\\]\./,
  persistent: true
});
const log = console.log.bind(console);

watcher
  .on("add", filePath => {
    log("File", filePath, "has been added");
  })
  .on("addDir", file => {
    log("Directory", file, "has been added");
  })
  .on("change", filePath => {
    console.log("change " + filePath);
    handleChangeMD(filePath);
  })
  .on("unlink", filePath => {
    log("File", filePath, "has been removed");
  })
  .on("unlinkDir", filePath => {
    log("Directory", filePath, "has been removed");
  })
  .on("error", error => {
    log("Error happened", error);
  })
  .on("ready", () => {
    log("Initial scan complete. Ready for changes.");
  })
  .on("raw", (event, filePath, details) => {
    log("Raw event info:", event, filePath, details);
  });

function build(time) {
  console.log(`git commit -am "auto commit ${new Date()}"`);
  shell.exec(`git add .`, {
    cwd: jekyllHome
  });
  let ret = shell.exec(`git commit -am "auto commit ${new Date()}"`, {
    cwd: jekyllHome
  });
  shell.exec(`git push`, { cwd: jekyllHome });

  setTimeout(() => {
    build(time);
  }, time);
}
build(1000 * 60 * 60 * 3);
