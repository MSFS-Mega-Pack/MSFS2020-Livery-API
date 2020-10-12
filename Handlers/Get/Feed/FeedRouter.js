const Trigger403 = require('../../default');
const FetchFeed = require('../../../data/feed/FetchFeed');
const SendResponse = require('../../../helpers/SendResponse');

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('../Cache/Cache').ActiveCache} cache Active cache
 */
async function FeedRouter(req, res, cache) {
  const requestType = req.params.requestType;

  let cacheItem, wasCached, feed, feedToSend;

  switch (requestType) {
    case 'current':
      [cacheItem, wasCached] = await FetchFeed(cache);

      /** @type {import('../../../data/feed/FetchFeed').Feed} */
      feed = cacheItem.data;

      // send a MAX of 3 articles!
      feedToSend = {
        ...feed,
        isMoreHistoryAvailable: feed.feed.length > 3,
        feed: feed.feed.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 3),
      };

      SendResponse.JSON(res, feedToSend, wasCached, cacheItem.cachedAt, cacheItem.expires);
      break;

    case 'history':
      [cacheItem, wasCached] = await FetchFeed(cache);

      /** @type {import('../../../data/feed/FetchFeed').Feed} */
      feed = cacheItem.data;

      feedToSend = {
        ...feed,
        feed: feed.feed.sort((a, b) => new Date(b.date) - new Date(a.date)),
      };

      SendResponse.JSON(res, feedToSend, wasCached, cacheItem.cachedAt, cacheItem.expires);
      break;

    default:
      Trigger403(req, res, cache);
      break;
  }
}

module.exports = FeedRouter;
