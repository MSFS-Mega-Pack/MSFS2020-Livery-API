const CacheItem = require('../../Cache/CacheItem');
const Log = require('../../logger');
const { CACHE_ENABLED } = require('../../Constants');
const RefetchArticle = require('./RefetchArticle');

module.exports = FetchArticle;

/**
 * @param {import('../../Cache/Cache')} cache
 * @param {string} articleName
 *
 * @returns {Promise<[CacheItem, boolean]>}
 */
async function FetchArticle(cache, articleName) {
  if (!CACHE_ENABLED || !cache.data.baseManifests.feedArticles[articleName] || cache.data.baseManifests.feedArticles[articleName].hasExpired) {
    let s = await RefetchArticle(articleName);

    if (s === null) {
      if (cache.data.baseManifests.feedArticles[articleName]) {
        Log("Couldn't fetch updated article! Re-using old one.");
        return [cache.data.baseManifests.feedArticles[articleName], true];
      } else {
        Log("Couldn't find specified article");
        return ['**Article not found.**', false];
      }
    } else {
      cache.data.baseManifests.feedArticles[articleName] = new CacheItem(s);
      return [cache.data.baseManifests.feedArticles[articleName], false];
    }
  } else {
    return [cache.data.baseManifests.feedArticles[articleName], true];
  }
}
