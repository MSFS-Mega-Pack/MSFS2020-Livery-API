require('dotenv').config();
const env = process.env;
const app = require('express')();
const port = env.PORT;
const shrinkRay = require('shrink-ray-current');
const Log = require('./logger');
const Cache = require('./Cache/Cache');
const SentryHelper = require('./helpers/Sentry');

const GetHandlers = require('./Handlers/Get');
const DefaultHandler = require('./Handlers/default');
const Constants = require('./Constants');

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

// Add gzip/brotli compression
app.use(shrinkRay({ zlib: { level: 7 }, brotli: { quality: 5 } }));

app.get(`/${Constants.API_VERSION}/get/allfiles`, (req, res) => GetHandlers.AllFiles(req, res, ActiveCache));

app.get(`/${Constants.API_VERSION}/get/feed/article/:articleName`, (req, res) => GetHandlers.GetArticle(req, res, ActiveCache));
app.get(`/${Constants.API_VERSION}/get/feed/:requestType`, (req, res) => GetHandlers.Feed(req, res, ActiveCache));

app.get('*', (req, res) => DefaultHandler(req, res, ActiveCache));

Log(`Starting API listener...`, Log.SEVERITY.DEBUG);

let listener = app.listen(port || 8080, () => {
  Log(`Listening at localhost:${listener.address().port}`, Log.SEVERITY.INFO);
});

if (!Constants.CACHE_ENABLED) {
  Log(`Caching is disabled! This better not be in prod...`, Log.SEVERITY.WARNING);
}
