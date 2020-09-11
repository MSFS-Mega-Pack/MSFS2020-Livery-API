/**
 * @type {ActiveCache}
 */
let Cache = {
  data: {
    baseManifests: {
      sourceList: null,
      cdnFileListing: null,
    },
  },
};

/**
 * @typedef {Object} ActiveCache
 *
 * @property {Object} data
 * @property {Object} data.baseManifests
 * @property {?import('./CacheItem')} data.baseManifests.sourceList
 * @property {?import('./CacheItem')} data.baseManifests.cdnFileListing
 */

module.exports = Cache;
