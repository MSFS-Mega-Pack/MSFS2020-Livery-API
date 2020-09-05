const { CACHE_TTL } = require('../Constants');

class CacheItem {
  /**
   * A timestamp of when this CacheItem expires
   *
   * @type {number}
   * @memberof CacheItem
   */
  expires;

  /**
   * A timestamp of when this CacheItem was saved
   *
   * @type {number}
   * @memberof CacheItem
   */
  cachedAt;

  /**
   * The data held within the CacheItem
   *
   * @type {any}
   * @memberof CacheItem
   */
  data;

  /**
   * Whether the data in this CacheItem is usable after it has expired if new data cannot be fetched
   *
   * @type {boolean}
   * @memberof CacheItem
   */
  usableIfStale;

  /**
   * Returns true if the CacheItem expiry timestamp is greater than the current timestamp, else returns false.
   *
   * @readonly
   * @returns {boolean}
   * @memberof CacheItem
   */
  get hasExpired() {
    return this.expires <= new Date().getTime();
  }

  /**
   * Returns the amount of milliseconds until the CacheItem expires
   *
   * @readonly
   * @returns {number}
   * @memberof CacheItem
   */
  get expiresIn() {
    return this.expires - new Date().getTime();
  }

  /**
   * Creates an instance of CacheItem.
   * @param {any} data
   * @param {boolean} [usableIfStale=true] Determines if the CacheItem can still be used when stale in case of a failed refresh (e.g. API outage)
   * @memberof CacheItem
   */
  constructor(data, usableIfStale = true) {
    this.data = data;
    this.cachedAt = new Date().getTime();
    this.expires = new Date().getTime() + CACHE_TTL;
    this.usableIfStale = usableIfStale;
  }
}

module.exports = CacheItem;
