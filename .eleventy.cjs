module.exports = function(eleventyConfig) {
  eleventyConfig.addGlobalData("currentYear", new Date().getFullYear());

  return {
    dir: {
      input: "src",
      includes: "_includes",
      output: "_site"
    }
  };
};
