const Path = require('path');
const Constants = require('../Constants');

const Headers = {
  wasCached: 'X-response-was-cached',
  cachedAtTime: 'X-response-cached-at',
  cacheTTL: 'X-response-cache-ttl',
  cacheExpiresIn: 'X-response-cache-expires-in',
};

/**
 * @param {import('express').Response} res
 * @param {object} data JSON data
 * @param {boolean} wasCached Indicates whether the returned data was cached
 * @param {number} cachedAt A timestamp of when this CacheItem was saved
 * @param {number} [statusCode=200] Status code to be returned
 */
function SendJSONResponse(res, data, wasCached, cachedAt = null, statusCode = 200) {
  let now = new Date();

  if (wasCached) {
    res.setHeader(Headers.wasCached, 1);
    res.setHeader(Headers.cacheTTL, Constants.CACHE_TTL);

    if (cachedAt) {
      res.setHeader(Headers.cachedAtTime, cachedAt);
      // res.setHeader(Headers.cacheExpiresIn, now.getTime() - cachedAt - Constants.CACHE_TTL);
    } else {
      res.setHeader(Headers.cachedAtTime, 'unknown');
      // res.setHeader(Headers.cacheExpiresIn, 'unknown');
    }
  }

  res.setHeader('Last-Modified', cachedAt ? new Date(cachedAt).toUTCString() : now.toUTCString());

  //! WARNING: do NOT add the `cacheExpiresIn` var here as it will
  //! cause the ETag to change when the data hasn't changed
  return res.status(statusCode).json({
    cached: wasCached || false,
    cachedAt: cachedAt || null,
    cacheTTL: Constants.CACHE_TTL,
    data: data,
  });
}

/**
 * @param {import('express').Response} res
 * @param {object} path File path, relative to repo root
 * @param {boolean} wasCached Indicates whether the returned data was cached
 * @param {number} cachedAt A timestamp of when this CacheItem was saved
 * @param {number} [statusCode=200] Status code to be returned
 */
function SendFileResponse(res, path, wasCached = false, cachedAt = null, statusCode = 200) {
  if (wasCached) {
    res.setHeader(Headers.wasCached, 1);
    res.setHeader(Headers.cacheTTL, Constants.CACHE_TTL);

    if (cachedAt) {
      res.setHeader(Headers.cachedAtTime, cachedAt);
      // res.setHeader(Headers.cacheExpiresIn, new Date() - cachedAt - Constants.CACHE_TTL);
    } else {
      res.setHeader(Headers.cachedAtTime, 'unknown');
      // res.setHeader(Headers.cacheExpiresIn, 'unknown');
    }
  }

  res.setHeader('Last-Modified', cachedAt ? new Date(cachedAt).toUTCString() : new Date().toUTCString());

  return res.status(statusCode).sendFile(path, {
    // root is one up from current dir
    root: Path.join(__dirname, '..'),
  });
}

module.exports = {
  JSON: SendJSONResponse,
  File: SendFileResponse,
};
