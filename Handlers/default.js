const SendResponse = require('../helpers/SendResponse');

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
async function DefaultHandler(req, res, cache) {
  return SendResponse.File(res, 'static/403.html', false);
}

module.exports = DefaultHandler;
