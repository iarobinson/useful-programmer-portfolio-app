// server.js
// where your node app starts
'mongodb007\$'
// init project
var express = require('express');
var mongo = require('mongodb');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var shortid = require('shortid');
var dns = require('dns');
var app = express();
var port = process.env.PORT || 3000;

// mongoose.connect(process.env.DB_URI);
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// enable CORS (https://en.wikipedia.org/wiki/Cross-origin_resource_sharing)
// so that your API is remotely testable by FCC
var cors = require('cors');
app.use(cors({optionSuccessStatus: 200}));  // some legacy browsers choke on 204

// http://expressjs.com/en/starter/static-files.html
app.use(express.static('public'));

// http://expressjs.com/en/starter/basic-routing.html
app.get("/", function (req, res) {
  res.sendFile(__dirname + '/views/index.html');
});

app.get("/timestamp", function (req, res) {
  res.sendFile(__dirname + '/views/timestamp.html');
});

app.get("/requestHeaderParser", function (req, res) {
  res.sendFile(__dirname + '/views/requestHeaderParser.html');
});

app.get("/urlShortenerMicroservice", function (req, res) {
  res.sendFile(__dirname + '/views/urlShortenerMicroservice.html');
});

// your first API endpoint...
app.get("/api/hello", function (req, res) {
  console.log({greeting: 'hello API'});
  res.json({greeting: 'hello API'});
});


// Timestamp Project
app.get("/api/timestamp", function(req, res) {
  var now = new Date()
  res.json({
    "unix": now.getTime(),
    "utc": now.toUTCString()
  });
});

app.get("/api/timestamp/:date_string", function(req, res) {
  let dateString = req.params.date_string;

  if (parseInt(dateString) > 10000) {
    let unixTime = new Date(parseInt(dateString));
    res.json({
      "unix": unixTime.getTime(),
      "utc": unixTime.toUTCString()
    });
  }

  let passedInValue = new Date(dateString);

  if (passedInValue == "Invalid Date") {
    res.json({"error" : "Invalid Date" });
  } else {
    res.json({
      "unix": passedInValue.getTime(),
      "utc": passedInValue.toUTCString()
    })
  }
});

// Header Request
app.get("/api/whoami", function(req, res) {
  res.json({
    // "value": Object.keys(req),
    "ipaddress": req.connection.remoteAddress,
    "language": req.headers["accept-language"],
    "software": req.headers["user-agent"]
    // "req-headers": req.headers
  });
});

// URLS Shortening Service

// Build a schema and model to store saved URLS
var ShortURL = mongoose.model('ShortURL', new mongoose.Schema({
  short_url: String,
  original_url: String,
  suffix: String
}));
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))
// parse application/json
app.use(bodyParser.json())

app.post("/api/shorturl/new/", (req, res) => {
  let client_requested_url = req.body.url

  // dns.lookup(client_requested_url, { all:true, verbatim: true }, (err, address, family) => {
  //   console.log('address: %j family: IPv%s', address, family, err);
  //   if (err) {
  //     return res.json({"error": "invalid URL"});
  //   }
  // });

  let suffix = shortid.generate();
  let newShortURL = suffix

  let newURL = new ShortURL({
    short_url: __dirname + "/api/shorturl/" + suffix,
    original_url: client_requested_url,
    suffix: suffix
  })

  newURL.save((err, doc) => {
    if (err) return console.error(err);
    res.json({
      "saved": true,
      "short_url": newURL.short_url,
      "orignal_url": newURL.original_url,
      "suffix": newURL.suffix
    });
  });
});

app.get("/api/shorturl/:suffix", (req, res) => {
  let userGeneratedSuffix = req.params.suffix;
  ShortURL.find({suffix: userGeneratedSuffix}).then(foundUrls => {
    let urlForRedirect = foundUrls[0];
    res.redirect(urlForRedirect.original_url);
  });
});


// listen for requests :)
var listener = app.listen(port, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});
