const gkm = require('gkm');
const notifier = require('node-notifier');
const ncp = require("copy-paste");
var translate = require("./translate");


const keys = {};

gkm.events.on('key.*', data => {
  const button = data[0];
  console.log(button);
  if (gkm.events.event === 'key.pressed' && button.indexOf('Control')>-1 ) {
    keys['CTRL']=1;
  }
  if (gkm.events.event === 'key.released' && button.indexOf('Control')>-1 ) {
    keys['CTRL']=0;
    keys['C']=0;
  }

  if (gkm.events.event === 'key.released' && keys['CTRL']==1  && button ==='C') {
    keys['C']+=1;
    if(keys['C']>=2){
      let rawText = ncp.paste().trim();
      if(rawText)translate(rawText, {
          raw: true,
          to: escape(rawText).split('%u').length<5 ? "zh-CN" : "en"
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

  }
});