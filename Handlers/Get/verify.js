// const Trigger403 = require('../../default');
const { generateKeyPairSync, publicEncrypt, privateDecrypt } = require('crypto');
const crypto = require('crypto');
require('dotenv').config();

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
async function verifyClient(req, res) {
  const clientData = req.body.info;
  console.log(req.body);
  if (clientData == undefined) return res.json({ status: 'failed', data: null });
  //generate a key pair RSA type encryption with a .pem format
  try {
    const NodeRSA = require('node-rsa');
    const key = new NodeRSA();
    key.importKey(Buffer.from(process.env.PRIVATE_KEY, 'base64').toString(), 'private');

    const decrypted = key.decrypt(clientData, 'utf8');
    //Return encrypted as base64 so I can copy paste to revert it xD
    return res.json({ status: 'success', data: decrypted });
  } catch (err) {
    return res.json({ status: 'failed', data: null });
  }

  // Trigger403(req, res, cache);
}

module.exports = verifyClient;
