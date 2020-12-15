// const Trigger403 = require('../../default');
const SendResponse = require('../../helpers/SendResponse');
const GetVersion = require('../../data/updates/GetVersion');
const semver = require('semver');
const { default: fetch } = require('node-fetch');
const { USE_UPDATE_JSON_FROM_CDN } = require('../../Constants');

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('../Cache/Cache').ActiveCache} cache Active cache
 */
async function IsUpdateAvailable(req, res, cache) {
  const clientVersion = req.params.v;
  // console.log(clientVersion);

  let [cacheItem, wasCached] = await GetVersion(cache);

  /** @type {import('../../data/updates/GetVersion').Version} */
  let latestVersion = cacheItem.data;

  const latestAllowedUrl = USE_UPDATE_JSON_FROM_CDN
    ? latestVersion.downloadUrl.replace(new RegExp(`(${latestVersion.latest})`, 'g'), latestVersion.latestAllowed)
    : null;

  if (typeof clientVersion === 'undefined') {
    if (USE_UPDATE_JSON_FROM_CDN && semver.lt(latestVersion.latestAllowed, latestVersion.latest)) {
      SendResponse.JSON(
        res,
        { latest: latestVersion.latestAllowed, downloadUrl: latestAllowedUrl, size: null, date: null, realLatest: latestVersion.latest },
        wasCached,
        cacheItem.cachedAt,
        cacheItem.expires
      );
    } else {
      SendResponse.JSON(res, latestVersion, wasCached, cacheItem.cachedAt, cacheItem.expires);
    }
  } else {
    try {
      const updateAvailable = semver.lt(semver.clean(clientVersion), latestVersion.latest);
      const allowedToUpdate = USE_UPDATE_JSON_FROM_CDN ? semver.gte(latestVersion.latestAllowed, latestVersion.latest) : true;

      if (updateAvailable) {
        if (allowedToUpdate) {
          SendResponse.JSON(res, { update: true, info: latestVersion }, wasCached, cacheItem.cachedAt, cacheItem.expires);
        } else {
          SendResponse.JSON(
            res,
            {
              update: false,
              info: {
                details: 'New version available, but cannot update yet.',
                latest: latestVersion.latest,
                latestAllowed: latestVersion.latestAllowed,
              },
            },
            wasCached,
            cacheItem.cachedAt,
            cacheItem.expires
          );
        }
      } else {
        SendResponse.JSON(res, { update: false }, wasCached, cacheItem.cachedAt, cacheItem.expires);
      }
    } catch (error) {
      SendResponse.JSON(res, latestVersion, wasCached, cacheItem.cachedAt, cacheItem.expires);
    }
  }

  // Trigger403(req, res, cache);
}

module.exports = IsUpdateAvailable;
