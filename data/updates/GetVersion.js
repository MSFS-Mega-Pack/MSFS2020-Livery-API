const CacheItem = require('../../Cache/CacheItem');
const Log = require('../../logger');
const { CACHE_ENABLED } = require('../../Constants');
const GetLatestVersion = require('./GetLatestVersion');

module.exports = GetVersion;

/**
 * @typedef {object} Version
 *
 * @property {string} latest The latest version available
 * @property {string} latestAllowed The latest allowed version for auto-updating, fetched from BunnyCDN
 * @property {string} date The date of the latest release
 * @property {string} downloadUrl The download URL of the latest setup.exe
 * @property {int} size The size of the latest setup.exe in bytes
 */

/**
 * @param {import('../../Cache/Cache')} cache
 *
 * @returns {Promise<[CacheItem, boolean]>}
 */
async function GetVersion(cache) {
  if (!CACHE_ENABLED || cache.data.updates.latestVersion === null || cache.data.updates.latestVersion.hasExpired) {
    let s = await GetLatestVersion();

    if (s === null) {
      Log("Couldn't fetch updated version JSON! Re-using old one.");
      return [cache.data.updates.latestVersion, true];
    } else {
      cache.data.updates.latestVersion = new CacheItem(s, true, false);
      return [cache.data.updates.latestVersion, false];
    }
  } else {
    return [cache.data.updates.latestVersion, true];
  }
}
