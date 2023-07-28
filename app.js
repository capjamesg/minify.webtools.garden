const express = require('express')
const Readability = require('@mozilla/readability').Readability;
const app = express()
const cheerio = require('cheerio');
const jsdom = require("jsdom");
const nunjucks = require('nunjucks');
const port = 3000;

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const ELEMENTS_TO_REMOVE = [
    'script',
    'img',
    'video',
    'iframe',
    'figure',
];

app.use(express.static('public'))
app.set('views', __dirname + '/views');
// map the nunjucks template engine to .njk files
var ctx = nunjucks.configure('views', {
    autoescape: true,
    express: app
});
// handle errors
ctx.on('error', function(err) {
    console.log(err);
    throw err;
});

app.get('/', (req, res) => {
    var url = req.query.url;
    if (!url) {
        res.render('viewer.njk', { title: 'minify.webtools.garden', content: null });
    }
    var options = {
        method: 'GET',
        headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
            'Save-Data': 'on',
            'Accept': 'text/html'
        }
    };
    
    console.log(url);
    fetch(url, options)
        .then(res => res.text())
        .then(body => {
            var dom = new jsdom.JSDOM(body);
            var reader = new Readability(dom.window.document);
            var article = reader.parse();
            // delete images, videos, etc
            var $ = cheerio.load(article.content);
            
            ELEMENTS_TO_REMOVE.forEach((element) => {
                $(element).remove();
            });
            
            res.render('viewer.njk', { title: article.title, content: $.html(), url: url });
        }
    );
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})