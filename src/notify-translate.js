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

  if (gkm.events.event === "key.pressed") {
    if (button.indexOf("Control") > -1) keys["CTRL"] = 1;
    else if (button.indexOf("Meta") > -1) keys["CTRL"] = 1;
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

gkm.events.on("key.pressed", listener);
gkm.events.on("key.released", listener);
