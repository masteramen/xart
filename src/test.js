const { translateStr, translatePure } = require("./translator");
translateStr(`The real point of this article is this finder object`).then(
  res => {
    console.log(res);
  }
);

if (true)
  translateStr(
    `The real point of this article is this finder object, or particularly how we connect the lister object with a particular finder object. The reason why this is interesting is that I want my wonderful moviesDirectedBy method to be completely independent of how all the movies are being stored. So all the method does is refer to a finder, and all that finder does is know how to respond to the findAll method. I can bring this out by defining an interface for the finder.`
  ).then(res => {
    console.log(res);
  });
