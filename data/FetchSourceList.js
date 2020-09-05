const FetchLatestSourceList = require('./FetchLatestSourceList');
const CacheItem = require('../Cache/CacheItem');
const Log = require('../logger');
const { CACHE_ENABLED } = require('../Constants');

module.exports = FetchSourceList;

/**
 * @param {import('../Cache/Cache')} cache
 */
async function FetchSourceList(cache) {
  if (!CACHE_ENABLED || cache.data.baseManifests.sourceList === null || cache.data.baseManifests.sourceList.hasExpired) {
    let s = await FetchLatestSourceList();
    console.log('exp');

    if (s === null) {
      Log("Couldn't fetch updated Source List! Re-using old one.");
      return [cache.data.baseManifests.sourceList, true];
    } else {
      cache.data.baseManifests.sourceList = new CacheItem(s);
      return [cache.data.baseManifests.sourceList, false];
    }
  } else {
    return [cache.data.baseManifests.sourceList, true];
  }
}
