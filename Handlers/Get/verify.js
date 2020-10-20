// const Trigger403 = require('../../default');
require('dotenv').config();
const visitModel = require('../../Models/visit');

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
async function verifyClient(req, res) {
  const now = Math.round(new Date().getTime() / 1000);
  const clientData = req.body.info;
  console.log(req.body);
  if (clientData == undefined || clientData.trim() == '') return res.json({ status: 'failed', data: null });
  //generate a key pair RSA type encryption with a .pem format
  try {
    const NodeRSA = require('node-rsa');
    const key = new NodeRSA();
    key.importKey(Buffer.from(process.env.PRIVATE_KEY, 'base64').toString(), 'private');

    const decrypted = key.decrypt(clientData, 'utf8');
    //Return encrypted as base64 so I can copy paste to revert it xD
    try {
      const visit = new visitModel({
        createdAt: now,
        UUID: decrypted,
      });
      visit.save(function (err, result) {
        if (err) return console.log(err);
        console.log(`Saved visit model!`);
      });
    } catch (error) {
      console.log(error);
    }
    return res.json({ status: 'success', data: decrypted });
  } catch (err) {
    return res.json({ status: 'failed', data: null });
  }

  // Trigger403(req, res, cache);
}

module.exports = verifyClient;
