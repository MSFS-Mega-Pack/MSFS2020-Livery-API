const Trigger403 = require('../../default');
const FetchSubPacks = require('../../../data/SubPack/FetchSubPacks');
const SendResponse = require('../../../helpers/SendResponse');

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('../Cache/Cache').ActiveCache} cache Active cache
 */
async function PackRouter(req, res, cache) {

  let cacheItem, wasCached, subPack;

      [cacheItem, wasCached] = await FetchSubPacks(cache);

      /** @type {import('../../../data/SubPack/FetchSubPacks').SubPackItem} */
      subPack = cacheItem.data;
      };

      SendResponse.JSON(res, subPack, wasCached, cacheItem.cachedAt, cacheItem.expires);
      break;
}

module.exports = PackRouter;
