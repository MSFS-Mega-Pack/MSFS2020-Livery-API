const FetchSourceList = require('../../data/FetchSourceList');
const SendResponse = require('../../helpers/SendResponse');

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
async function Get_SourceList(req, res, cache) {
  /**
   * @type {[import('../../Cache/CacheItem'), boolean]}
   */
  const [cacheItem, cached] = await FetchSourceList(cache);
  return SendResponse.JSON(res, cacheItem.data, cached, cacheItem.cachedAt);
}

module.exports = Get_SourceList;
