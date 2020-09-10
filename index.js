require('dotenv').config();
const env = process.env;
const app = require('express')();
const port = env.PORT;
const Log = require('./logger');
const path = require('path');
const Cache = require('./Cache/Cache');

const GetHandlers = require('./Handlers/Get');
const DefaultHandler = require('./Handlers/default');
const Constants = require('./Constants');

let currentTime = new Date();
let ActiveCache = Cache;

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET');
  res.header('Access-Control-Max-Age', 86400);
  res.header('Cache-Control', 'public, max-age=60, stale-if-error=600');
  next();
});

// Add ETag caching
app.set('etag', 'strong');

app.get(`/${Constants.API_VERSION}/get/sourcelist`, (req, res) => GetHandlers.SourceList(req, res, ActiveCache));
// not actually made yet...
// app.get(`/${Constants.API_VERSION}/get/allaircraft`, (req, res) => GetHandlers.AllAircraft(req, res, ActiveCache));
app.get(`/${Constants.API_VERSION}/get/allfiles`, (req, res) => GetHandlers.AllFiles(req, res, ActiveCache));

app.get('*', (req, res) => DefaultHandler(req, res, ActiveCache));

Log(`Starting API listener...`, Log.SEVERITY.DEBUG);

let listener = app.listen(port || 8080, () => {
  Log(`Listening at localhost:${listener.address().port}`, Log.SEVERITY.INFO);
});

if (!env.GIT_TOKEN || env.GIT_TOKEN === 'GIT ACCESS TOKEN') {
  Log(`No GitHub token specified!`, Log.SEVERITY.ERROR);
}
