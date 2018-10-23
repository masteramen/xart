/**
 * Fix post permalink not overriding config permalink in Hexo v3.2.2
 * Add a `mypermalink: hello-example` to any post front-matter to override config.
 * Place this script in your project/scripts directory (project/scripts/hexo-post-permalink-fix.js)
 */


const fs = require('hexo-fs');
const path = require('path')

// 处理 post 中图片
hexo.extend.processor.register('posts/*path', function(file) {


  if (file.type == 'delete') return file
  if(file.source.endsWith(".md")||file.source.endsWith(".markdown"))return
  if(!/^_posts\//.test(file.path))return
 
 /* console.log(file.path);

  console.log(file.path.replace(/^_posts\//,''));
  console.log(file.source);

  hexo.route.set(file.path.replace(/^_posts\//,''), {
    data: function(){
      return fs.createReadStream(file.source)
    },
    modified: false
});
*/

  hexo.extend.generator.register('test', function(locals){
    return {
      path: file.path.replace(/^_posts\//,''),
      data: function(){
        return fs.createReadStream(file.source)
      }
    };
  });

})



hexo.extend.filter.register('post_permalink', function(data) {
  // if (typeof data.mypermalink != "undefined") {
       // unregister default post_permalink filter that doesn't respect custom post permalink
       hexo.extend.filter.unregister('post_permalink', require('hexo/lib/plugins/filter/post_permalink') );
       // hacky way to bypass an error due to newly missing filter above
       hexo.extend.filter.register('post_permalink', function(data) { return data; });
       if(data.slug.endsWith(".html"))return data.slug;
       if(data.fileName)return data.date.format('YYYY')+"/"+data.fileName+"/index.html";
   //}
   return data;
}, 9);


//将相对地址转为绝对地址
hexo.extend.filter.register('before_post_render', function(data){
  const config = this.config.easy_images
  var dir_post = path.join(this.source_dir, data.source)
  var post_id = path.basename(data.source, '.md')
  var dir_images = path.join(this.source_dir, post_id)
  var pattern = /!\[(.*?)\]\((.*?)\)/g

  data.content = data.content.replace(pattern, (match, alt, src) => {
    if (path.dirname(src) != path.relative(path.dirname(dir_post), dir_images)) {
      return match
    }

    let path_img = path.resolve(dir_post, '..', src)
    let src_new = path_img.replace(this.source_dir, '/')

    if (config && config.cdn_prefix && src_new[0] == '/') {
       src_new = config.cdn_prefix + src_new
    }

    return `![${alt}](${src_new})`
  })

  return data;
});