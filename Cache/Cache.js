/**
 * @type {ActiveCache}
 */
let Cache = {
  data: {
    baseManifests: {
      cdnFileListing: null,
      feed: null,
      feedArticles: [],
    },
  },
};

/**
 * @typedef {Object} ActiveCache
 *
 * @property {Object} data
 * @property {Object} data.baseManifests
 * @property {?import('./CacheItem')} data.baseManifests.cdnFileListing
 * @property {?import('./CacheItem')} data.baseManifests.feed
 * @property {import('./CacheItem')[]} data.baseManifests.feedArticles
 */

module.exports = Cache;
