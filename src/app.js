const express = require("express");
const path = require("path");
const fs = require("fs");
const chokidar = require("chokidar");
const shell = require("shelljs");
const glob = require("glob");
const vscode = require("vscode");
//const console = require("./logger");

const {
  getWorkHome,
  getPostFolders,
  getDraftFolders,
  getAutoCommitAndPush
} = require("./config");

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

function commit() {
  let workHome = getWorkHome();
  if (fs.existsSync(workHome)) {
    shell.exec('git status',{ cwd: workHome },function(number, stdout, stderr){
      console.log(stdout);
      let contentLevel = stdout.indexOf(path.basename(getDraftFolders()))>-1?1:0;
      contentLevel = stdout.indexOf(path.basename(getPostFolders()))>-1 ? 2 : contentLevel;
      if(contentLevel){
        
        console.log(`git commit -am "auto commit ${new Date()}"`);
        shell.exec(`git add .`, {cwd: workHome});
        let ret = shell.exec(`git commit -am "auto commit ${new Date()}"`, {
          cwd: workHome
        });
        shell.exec(`git push`, { cwd: workHome });
        if(false && contentLevel==2){
          shell.exec('git checkout publish',{ cwd: workHome });
          shell.exec('git pull',{ cwd: workHome });
          shell.exec('git merge --no-commit --no-ff master',{ cwd: workHome });
          shell.exec(`git rm -r ${getDraftFolders()}`,{ cwd: workHome });
          shell.exec(`git add ${getPostFolders()}`, {cwd: workHome});
          shell.exec(`git commit -am "auto commit ${new Date()}"`, { cwd: workHome });
          shell.exec(`git push`, { cwd: workHome });
          shell.exec('git checkout master',{ cwd: workHome });
        }
      }

    });


    monitorWorkHome();
  } else {
    console.log(`${workHome} folder not exists!`);
  }
}
let workHomeChangeCallBack;
let timer = undefined;
function monitorWorkHome(callback) {
  if (callback) workHomeChangeCallBack = callback;
  let workHome = getWorkHome();
  if (fs.existsSync(workHome)) {
    if (timer) {
      clearTimeout(timer);
    }

    timer = setTimeout(function() {
      timer = undefined;
      console.log(`git status ${new Date()}"`);
      let ret = shell.exec(
        `git status`,
        {
          cwd: workHome
        },
        function(code, result) {
          console.log("result:");
          console.log(code);
          console.log(result);
          if (result.indexOf("git add") > -1) {
            workHomeChangeCallBack("No Commit");
          } else {
            workHomeChangeCallBack("Commited");
          }
        }
      );
    }, 3000);
  } else {
    console.log(`${workHome} folder not exists!`);
  }
}

function loopCommit(time) {
  if (getAutoCommitAndPush() == false) return;
  setTimeout(() => {
    commit();
  }, 10000);
  setTimeout(() => {
    loopCommit(time);
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
      if (result.toString().indexOf("Already") == -1) {
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
      let ret = shell.exec("git pull ", { cwd: getWorkHome() });
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
      const { url, inBrowser, translate } = req.query;
      console.log(url);

      (async () => {
        const first = glob
          .sync(`${getDraftFolders()}/**/*${md5(url)}.md`)
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
            draftsFolder: getDraftFolders(),
            callback: open,
            translate: translate === "yes"
          });
        }
      })();
    });

    app.get("/", (req, res) => {
      const targetPath = getDraftFolders();
      // var files = fs.readdirSync(targetPath);
      console.log(`index list ${targetPath}`);
      const files = fs
        .readdirSync(targetPath)
        .filter(f => {
          return !f.startsWith(".");
        })
        .map(f => {
          try {
            console.log(`targetPath, f:${targetPath},${f}`);
            const pf = getPostFile(path.join(targetPath, f));
            if (pf)
              return {
                name: path.join(f, pf),
                time: fs.statSync(path.join(targetPath, f, pf)).mtime.getTime()
              };
          } catch (e) {
            console.log(e);
            return {};
          }
        })
        .filter(f => f && f.name)
        .sort((a, b) => b.time - a.time)
        .map(v => v.name);

      res.render("drafts", { title: "Drafts", fileNames: files });
    });

    app.get("/edit", (req, res) => {
      console.log(req.query.fileName);

      const targetPath = getDraftFolders();

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

      const watcher = chokidar.watch(getDraftFolders(), {
        ignored: /[/\\]\./,
        persistent: true
      });
      const log = console.log.bind(console);

      watcher
        .on("change", filePath => {
          console.log("change " + filePath);
          setTimeout(() => handleChangeMD(filePath), 500);
        })
        .on("raw", (event, filePath, details) => {
          monitorWorkHome();
          log("Raw event info:", event, filePath, details);
        });
      loopCommit(1000 * 60 * 60 * 3);
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

module.exports = { commit, startServer, monitorWorkHome };
