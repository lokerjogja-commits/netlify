const { DateTime } = require("luxon");

module.exports = function(eleventyConfig) {
  eleventyConfig.addFilter("year", () => {
    return DateTime.now().toFormat("yyyy");
  });

  return {
    dir: {
      input: "src",
      includes: "_includes",
      output: "_site"
    }
  };
};
