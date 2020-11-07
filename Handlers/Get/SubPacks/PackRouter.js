const Trigger403 = require('../../default');
const FetchSubPacks = require('../../../data/SubPack/FetchSubPacks');
const SendResponse = require('../../../helpers/SendResponse');

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('../Cache/Cache').ActiveCache} cache Active cache
 */
async function PackRouter(req, res, cache) {

  let cacheItem, wasCached, feed, feedToSend;

      [cacheItem, wasCached] = await FetchSubPacks(cache);

      /** @type {import('../../../data/feed/FetchSubPacks').Feed} */
      feed = cacheItem.data;

      // send a MAX of 3 articles!
      feedToSend = {
        ...feed,
        isMoreHistoryAvailable: feed.feed.length > 3,
        feed: feed.feed.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 3),
      };

      SendResponse.JSON(res, feedToSend, wasCached, cacheItem.cachedAt, cacheItem.expires);
      break;
}

module.exports = PackRouter;
