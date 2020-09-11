const FetchSourceList = require('../../data/FetchSourceList');
const SendResponse = require('../../helpers/SendResponse');
const Log = require('../../logger');

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('../Cache/Cache').ActiveCache} cache Active cache
 */
async function Get_SourceList(req, res, cache) {
  Log(`Getting SourceList...`, Log.SEVERITY.DEBUG);

  /**
   * @type {[import('../../Cache/CacheItem'), boolean]}
   */
  const [cacheItem, cached] = await FetchSourceList(cache);

  cached && Log(`SourceList was cached! Woohoo!`, Log.SEVERITY.DEBUG);

  return SendResponse.JSON(res, cacheItem.data, cached, cacheItem.cachedAt);
}

module.exports = Get_SourceList;
