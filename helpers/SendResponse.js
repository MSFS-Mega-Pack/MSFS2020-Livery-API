const Path = require('path');

/**
 * @param {import('express').Response} res
 * @param {object} data JSON data
 * @param {boolean} wasCached Indicates whether the returned data was cached
 * @param {number} [statusCode=200] Status code to be returned
 */
function SendJSONResponse(res, data, wasCached, cachedAt = null, statusCode = 200) {
  if (wasCached) {
    res.setHeader('X-cached-by-origin', 1);
    cachedAt && res.setHeader('X-cached-by-origin-at', cachedAt);
  }

  return res.status(statusCode).json({
    cached: wasCached || false,
    cachedAt: cachedAt || null,
    currentTimestamp: new Date().getTime(),
    data: data,
  });
}

/**
 * @param {import('express').Response} res
 * @param {object} path File path, relative to repo root
 * @param {boolean} wasCached Indicates whether the returned data was cached
 * @param {number} [statusCode=200] Status code to be returned
 */
function SendFileResponse(res, path, wasCached = false, cachedAt = null, statusCode = 200) {
  if (wasCached) {
    res.setHeader('X-cached-by-origin', 1);
    cachedAt && res.setHeader('X-cached-by-origin-at', cachedAt);
  }

  return res.status(statusCode).sendFile(path, {
    // root is one up from current dir
    root: Path.join(__dirname, '..'),
  });
}

module.exports = {
  JSON: SendJSONResponse,
  File: SendFileResponse,
};
