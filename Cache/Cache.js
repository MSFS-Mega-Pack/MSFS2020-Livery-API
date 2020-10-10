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
    updates: {
      latestVersion: null,
      changelog: null,
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
 * @property {import('./CacheItem')} data.updates.latestVersion
 * @property {import('./CacheItem')} data.updates.changelog
 */

module.exports = Cache;
