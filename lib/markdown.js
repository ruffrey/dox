var markdown = require('marked');
markdown.setOptions({
  renderer: new markdown.Renderer(),
  gfm: true,
  tables: true,
  breaks: false,
  pedantic: false,
  sanitize: true,
  smartLists: true,
  smartypants: false
});

exports = module.exports = markdown;
