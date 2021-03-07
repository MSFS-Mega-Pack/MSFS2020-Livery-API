const FetchPack = require('../../../data/SubPack/FetchPack');
const SendResponse = require('../../../helpers/SendResponse');

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('../Cache/Cache').ActiveCache} cache Active cache
 */
async function GetPack(req, res, cache) {
  const packName = req.params.packName;

  const [pack, wasCached] = await FetchPack(cache, packName);

  SendResponse.JSON(res, pack.data, wasCached, pack.cachedAt, pack.expires);
}

module.exports = GetPack;
