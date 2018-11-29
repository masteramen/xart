//if (process.platform !== "darwin") {
const gkm = require("gkm");
const notifier = require("node-notifier");
const ncp = require("copy-paste");
var translate = require("./translate");

// Alternatively, pass true to start in DEBUG mode.
//ioHook.start(true);

const keys = {};
keys["CTRL"] = 0;
let trans = () => {
  let rawText = ncp.paste().trim();
  if (rawText)
    translate(rawText, {
      raw: true,
      to:
        escape(rawText).split("%u").length < rawText.length / 2 ? "zh-CN" : "en"
    }).then(result => {
      console.log(result);
      notifier.notify(
        {
          title: "翻译",
          message: result,
          wait: true // Wait with callback, until user action is taken against notification
        },
        function(err, response) {
          // Response is response from notification
        }
      );

    });
};
let listener = data => {
  console.log(data);
  const button = data[0];

  if (button.indexOf("Control") > -1 || button.indexOf("Meta") > -1) {
    keys["CTRL"] = gkm.events.event === "key.pressed" ? 1 : 0;
  }

  if (
    gkm.events.event === "key.released" &&
    keys["CTRL"] >= 1 &&
    button === "C"
  ) {
    keys["CTRL"] += 1;
    if (keys["CTRL"] > 2) {
      keys["CTRL"] = 0;
      trans();
    }
  }
};
if(process.platform!=='darwin'){
gkm.events.on('key.pressed',listener );
gkm.events.on('key.released',listener );


/**
 var processChild = require("child_process");
var pidTrees = require("pidtree");
let childProcess = null;
let pidGroup = [];
let mainPid = null;
setInterval(async () => {
  if (mainPid) {
    pidGroup = [...(await pidTrees(mainPid, { root: true }))];
    pidGroup = [...new Set(pidGroup)].sort();
    console.log("all pid: ", pidGroup);
    console.log("mainPid: ", mainPid);
    pidGroup.forEach(async pid => {
      if (pid >= mainPid) {
        await processChild.exec(`kill -9 ${pid};`);
      }
    });
    pidGroup = [];
  }
  setTimeout(() => {
    childProcess = processChild.exec("npm run z");
    mainPid = childProcess.pid;
    console.log(process.pid);
  }, 5000);
}, 15000);
 */

}
