require('dotenv').config();
const env = process.env;
const express = require('express');
const app = express();
const port = env.PORT;
const shrinkRay = require('shrink-ray-current');
const Log = require('./logger');
const Cache = require('./Cache/Cache');
const SentryHelper = require('./helpers/Sentry');

const GetHandlers = require('./Handlers/Get');
const DefaultHandler = require('./Handlers/default');
const Constants = require('./Constants');
const SendResponse = require('./helpers/SendResponse');
const mongoose = require('mongoose');
try {
  mongoose.connect(process.env.MONGOURL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    poolSize: 3,
  });
} catch (error) {
  console.log(error);
}

let ActiveCache = Cache;

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET');
  res.header('Access-Control-Max-Age', 86400);
  res.header('Cache-Control', `public, max-age=${Math.round(Constants.CACHE_TTL / 1000)}, stale-if-error=600, stale-while-revalidate=120`);
  next();
});

// Add ETag caching
app.set('etag', 'weak');
app.use(
  express.urlencoded({
    extended: true,
  })
);

// Add gzip/brotli compression
app.use(shrinkRay({ zlib: { level: 7 }, brotli: { quality: 5 } }));

app.get(`/${Constants.API_VERSION}/heartbeat`, (req, res) => {
  Log(`Heartbeat received`, Log.SEVERITY.DEBUG);
  return SendResponse.JSON(res, { ok: true }, false, null);
});

app.get(`/${Constants.API_VERSION}/get/allfiles`, (req, res) => GetHandlers.AllFiles(req, res, ActiveCache));
app.get(`/${Constants.API_VERSION}/get/feed/article/:articleName`, (req, res) => GetHandlers.GetArticle(req, res, ActiveCache));
app.get(`/${Constants.API_VERSION}/get/feed/:requestType`, (req, res) => GetHandlers.Feed(req, res, ActiveCache));
app.get(`/${Constants.API_VERSION}/get/update/:v`, (req, res) => GetHandlers.IsUpdateAvailable(req, res, ActiveCache));
app.get(`/${Constants.API_VERSION}/get/update`, (req, res) => GetHandlers.IsUpdateAvailable(req, res, ActiveCache));
app.post(`/${Constants.API_VERSION}/get/verify/`, (req, res) => GetHandlers.verifyClient(req, res));
app.get(`/${Constants.API_VERSION}/get/subpack/pack/:packName`, (req, res) => GetHandlers.GetPack(req, res, ActiveCache));
app.get(`/${Constants.API_VERSION}/get/subpack`, (req, res) => GetHandlers.Pack(req, res, ActiveCache));

app.get('*', (req, res) => DefaultHandler(req, res, ActiveCache));

Log(`Starting API listener...`, Log.SEVERITY.DEBUG);

let listener = app.listen(port || 2678, () => {
  Log(`Listening at localhost:${listener.address().port}`, Log.SEVERITY.INFO);
});

if (!Constants.CACHE_ENABLED) {
  Log(`Caching is disabled! This better not be in prod...`, Log.SEVERITY.WARNING);
}
