require('dotenv').config();
const env = process.env;
const app = require('express')();
const port = env.PORT;
const Log = require('./logger');
const path = require('path');
const Cache = require('./Cache/Cache');

const GetHandlers = require('./Handlers/Get');
const DefaultHandler = require('./Handlers/default');

let currentTime = new Date();
let ActiveCache = Cache;

function GetNewCacheTime() {
  return new Date(new Date().getTime() + 20 * 60000);
}

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET');
  res.header('Access-Control-Max-Age', 86400);
  next();
});

app.get('/get/sourcelist', (req, res) => GetHandlers.SourceList(req, res, ActiveCache));
app.get('/get/allaircraft', (req, res) => GetHandlers.AllAircraft(req, res, ActiveCache));

app.get('*', (req, res) => DefaultHandler(req, res, ActiveCache));

Log(`Starting API listener...`, Log.SEVERITY.DEBUG);

let listener = app.listen(port || 8080, () => {
  Log(`Listening at localhost:${listener.address().port}`, Log.SEVERITY.INFO);
});

if (!env.GIT_TOKEN || env.GIT_TOKEN === 'GIT ACCESS TOKEN') {
  Log(`No GitHub token specified!`, Log.SEVERITY.ERROR);
}
