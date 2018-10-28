const express = require("express");
const path = require("path");
const fs = require("fs");
const chokidar = require("chokidar");
const shell = require("shelljs");
const glob = require("glob");
const vscode = require("vscode");

const { jekyllHome, postsFolder, draftsFolder } = require("./config");

const { handleChangeMD } = require("./handlers");
const md5 = require("./md5");
const { tomd } = require("./md");
const { open } = require("./vsfun");

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

function build(time) {
  setTimeout(() => {
    if (fs.existsSync(jekyllHome)) {
      console.log(`git commit -am "auto commit ${new Date()}"`);
      shell.exec(`git add .`, {
        cwd: jekyllHome
      });
      let ret = shell.exec(`git commit -am "auto commit ${new Date()}"`, {
        cwd: jekyllHome
      });
      shell.exec(`git push`, { cwd: jekyllHome });
    } else {
      console.log(`${jekyllHome} folder not exists!`);
    }
  }, 10000);
  setTimeout(() => {
    build(time);
  }, time);
}

function startServer(context, port) {
  return new Promise((resolve, reject) => {
    const app = express();
    // app.use(express.static('public'))
    var currentPath = process.cwd();
    console.log(`currentPath:${currentPath}`);
    console.log(__dirname);
    app.use(express.static(path.join(__dirname, "public")));
    app.set("view engine", "pug");
    app.set("views", path.join(__dirname, "/views"));

    setTimeout(() => {
      let result = shell.exec("git pull ", { cwd: __dirname });
      if (result.toString().indexOf("Already up-to-date.") == -1) {
        const action = "Reload";

        vscode.window
          .showInformationMessage(`${result}`, action)
          .then(selectedAction => {
            if (selectedAction === action) {
              vscode.commands.executeCommand("workbench.action.reloadWindow");
            }
          });

        // vscode.commands.executeCommand("workbench.action.reloadWindow");
        // vscode.window.showInformationMessage(result.toString());
      }
      console.log(`result:${result}`);
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
      const { url, inBrowser } = req.query;
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
          open(first[0], inBrowser);
          // exec(`code ${first[0]}`);
        } else {
          const result =
            "<html><head><script>history.go(-2);</script></head></html>";
          res.send(result);
          tomd(url, {
            ...req.query,
            draftsFolder: draftsFolder,
            callback: open
          });
        }
      })();
    });

    app.get("/hello", (req, res) => {
      const { url, fileName } = req.query;
      // console.log(url);
      console.log(req.host);
      console.log("fileName:" + fileName);
      if (
        url.startsWith("http://localhost") ||
        url.startsWith("http://www.jfox.info")
      ) {
        if (fileName) {
          let draftFile = `${draftsFolder}${fileName}/*.md`;
          let postFile = `${postsFolder}${fileName}/*.md`;
          console.log(draftFile);
          console.log(postFile);
          const first = glob.sync(draftFile).concat(glob.sync(postFile));
          if (first.length > 0) open(first[0]);
        }
        const result =
          "<html><head><script>history.go(-1);</script></head></html>";
        res.send(result);
      } else res.render("hello", { url, draft_url: "http://localhost:3888" });
    });

    app.get("/", (req, res) => {
      const targetPath = draftsFolder;
      // var files = fs.readdirSync(targetPath);
      const files = fs
        .readdirSync(targetPath)
        .map(f => {
          console.log(`targetPath, f:${targetPath},${f}`);
          const pf = getPostFile(path.join(targetPath, f));
          if (pf)
            return {
              name: path.join(f, pf),
              time: fs.statSync(path.join(targetPath, f, pf)).mtime.getTime()
            };
        })
        .filter(f => f && f.name)
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
        open(filePath);

        result =
          "<html><head><script>window.close();</script></head><body></body></html>";
      }

      res.send(result);
    });

    let server = app.listen(port, () => {
      console.log(`Example app listening on port ${port}!`);

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
          setTimeout(() => handleChangeMD(filePath), 500);
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
      build(1000 * 60 * 60 * 3);
      resolve();
    });

    server.on("error", e => {
      if (e.code === "EADDRINUSE") {
        console.log("Address in use, retrying...");
        setTimeout(() => {
          server.close();
          reject();
          //server.listen(PORT, HOST);
        }, 1000);
      }
    });
  });
}

module.exports = startServer;
