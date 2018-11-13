const gkm = require('gkm');
const notifier = require('node-notifier');
const ncp = require("copy-paste");
var translate = require("./translate");


const keys = {};

gkm.events.on('key.*', data => {
  const button = data[0];
  if (gkm.events.event === 'key.pressed' && button.indexOf('Alt')>-1 ) {
    keys['Alt']=1;
  }
  if (gkm.events.event === 'key.released' && button.indexOf('Alt')>-1 ) {
    keys['Alt']=0;
  }

  if (gkm.events.event === 'key.released' && keys['Alt']==1  && button ==='T') {

    let rawText = ncp.paste().trim();
    if(rawText)translate(rawText, {
        raw: true,
        to: escape(rawText).indexOf("%u") < 0 ? "zh-CN" : "en"
      }).then(result=>{
        console.log(result);
        notifier.notify(
          {
            title: '翻译',
            message: result,
            timeout: 10,
            wait: true // Wait with callback, until user action is taken against notification
          },
          function(err, response) {
            // Response is response from notification
          }
        );

      })
  }
});