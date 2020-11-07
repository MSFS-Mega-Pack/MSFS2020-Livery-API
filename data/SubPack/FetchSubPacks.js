const FetchLatestSubPacks = require('./FetchLatestSubPacks');
const CacheItem = require('../../Cache/CacheItem');
const Log = require('../../logger');
const { CACHE_ENABLED } = require('../../Constants');

module.exports = FetchSubPacks;

/**
 * @typedef {object} FeedItem
 *
 * @property {string} date
 * @property {string} title
 * @property {string} author
 * @property {string} article
 */

/**
 * @typedef {object} Feed
 *
 * @property {FeedItem[]} feed
 * @property {number} formatVersion
 * @property {'feed'} formatType
 */

/**
 * @param {import('../../Cache/Cache')} cache
 *
 * @returns {Promise<[CacheItem, boolean]>}
 */
async function FetchSubPacks(cache) {
  if (!CACHE_ENABLED || cache.data.baseManifests.feed === null || cache.data.baseManifests.feed.hasExpired) {
    let s = await FetchLatestSubPacks();

    if (s === null) {
      Log("Couldn't fetch updated feed! Re-using old one.");
      return [cache.data.baseManifests.feed, true];
    } else {
      cache.data.baseManifests.feed = new CacheItem(s, true, true);
      return [cache.data.baseManifests.feed, false];
    }
  } else {
    return [cache.data.baseManifests.feed, true];
  }
}
