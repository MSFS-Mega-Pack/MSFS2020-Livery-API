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

  return res.status(statusCode).json({ cached: wasCached, cachedAt: cachedAt, currentTimestamp: new Date().getTime(), data: data });
}

module.exports = {
  JSON: SendJSONResponse,
};
