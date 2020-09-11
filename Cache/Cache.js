/**
 * @type {ActiveCache}
 */
let Cache = {
  data: {
    baseManifests: {
      sourceList: null,
      cdnList: null,
    },
  },
};

/**
 * @typedef {Object} ActiveCache
 *
 * @property {Object} data
 * @property {Object} data.baseManifests
 * @property {?import('./CacheItem')} data.baseManifests.sourceList
 * @property {?import('./CacheItem')} data.baseManifests.cdnList
 */

module.exports = Cache;
