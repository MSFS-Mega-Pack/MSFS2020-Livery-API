const CacheItem = require('../../Cache/CacheItem');
const Log = require('../../logger');
const { CACHE_ENABLED } = require('../../Constants');
const RefetchPack = require('./RefetchPack');

module.exports = FetchPack;

/**
 * @param {import('../../Cache/Cache')} cache
 * @param {string} packName
 *
 * @returns {Promise<[CacheItem, boolean]>}
 */
async function FetchPack(cache, packName) {
  if (!CACHE_ENABLED || !cache.data.baseManifests.subpackItems[packName] || cache.data.baseManifests.subpackItems[packName].hasExpired) {
    let s = await RefetchPack(packName);
    s = JSON.parse(s);

    if (s === null) {
      if (cache.data.baseManifests.subpackItems[packName]) {
        Log("Couldn't fetch updated pack! Re-using old one.");
        return [cache.data.baseManifests.subpackItems[packName], true];
      } else {
        Log("Couldn't find specified pack");
        return ['**Pack not found.**', false];
      }
    } else {
      cache.data.baseManifests.subpackItems[packName] = new CacheItem(s, true, true);
      return [cache.data.baseManifests.subpackItems[packName], false];
    }
  } else {
    return [cache.data.baseManifests.subpackItems[packName], true];
  }
}
