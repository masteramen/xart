const userHome = require("user-home");
const jekyllHome = userHome + "/git/jekyll/";
const postsFolder = `${jekyllHome}_posts/`;
const draftsFolder = `${jekyllHome}/_drafts/`;
module.exports = { jekyllHome, postsFolder, draftsFolder };
