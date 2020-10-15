// const Trigger403 = require('../../default');
const SendResponse = require('../../helpers/SendResponse');
const GetVersion = require('../../data/updates/GetVersion');
const semver = require('semver');

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('../Cache/Cache').ActiveCache} cache Active cache
 */
async function IsUpdateAvailable(req, res, cache) {
  const clientVersion = req.params.v;
  console.log(clientVersion);

  let [cacheItem, wasCached] = await GetVersion(cache);

  /** @type {import('../../data/updates/GetVersion').Version} */
  let latestVersion = cacheItem.data;

  if (typeof clientVersion === 'undefined') {
    SendResponse.JSON(res, latestVersion, wasCached, cacheItem.cachedAt, cacheItem.expires);
  } else {
    try {
      const updateAvailable = semver.lt(semver.clean(clientVersion), latestVersion.latest);

      if (!updateAvailable) {
        SendResponse.JSON(res, { update: false }, wasCached, cacheItem.cachedAt, cacheItem.expires);
      } else {
        SendResponse.JSON(res, { update: true, info: latestVersion }, wasCached, cacheItem.cachedAt, cacheItem.expires);
      }
    } catch (error) {
      SendResponse.JSON(res, latestVersion, wasCached, cacheItem.cachedAt, cacheItem.expires);
    }
  }

  // Trigger403(req, res, cache);
}

module.exports = IsUpdateAvailable;
