const FetchArticle = require('../../../data/article/FetchArticle');
const SendResponse = require('../../../helpers/SendResponse');

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('../Cache/Cache').ActiveCache} cache Active cache
 */
async function GetArticle(req, res, cache) {
  const articleName = req.params.articleName;

  const [article, wasCached] = await FetchArticle(cache, articleName);

  SendResponse.JSON(res, article.data, wasCached, article.cachedAt, cacheItem.expires);
}

module.exports = GetArticle;
