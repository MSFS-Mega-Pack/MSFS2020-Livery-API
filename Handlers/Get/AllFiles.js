const ParseXML = require('../../data/ParseXML');
const SendResponse = require('../../helpers/SendResponse');
const Log = require('../../logger');

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
async function Get_AllItems(req, res, cache) {
  Log(`Getting all livery zips...`, Log.SEVERITY.DEBUG);

  /**
   * @type {[import('../../Cache/CacheItem'), boolean]}
   */
  const [cacheItem, cached] = await ParseXML.getAllFiles(cache);

  cached && Log(`Livery zip list was cached! Woohoo!`, Log.SEVERITY.DEBUG);

  return SendResponse.JSON(res, cacheItem.data, cached, cacheItem.cachedAt);
}

module.exports = Get_AllItems;
