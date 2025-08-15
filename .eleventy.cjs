module.exports = function(eleventyConfig) {
  return {
    dir: {
      input: "src",        // folder sumber
      includes: "_includes", // folder includes di dalam src
      output: "_site"      // folder hasil build
    }
  };
};
