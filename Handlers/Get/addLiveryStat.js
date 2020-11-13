// const Trigger403 = require('../../default');
require('dotenv').config();
const liveryStatModel = require('../../Models/liveryStat');

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
async function addLiveryStat(req, res) {
  const now = Math.round(new Date().getTime() / 1000);
  const clientData = req.params.livery;
  console.log(req.params);
  if (clientData == undefined || clientData.trim() == '') return res.json({ status: 'failed', data: null });
  //generate a key pair RSA type encryption with a .pem format
  try {
    //Return encrypted as base64 so I can copy paste to revert it xD
    try {
      const visit = new liveryStatModel({
        createdAt: now,
        Livery: clientData,
        Date: new Date().toISOString(),
      });
      visit.save(function (err, result) {
        if (err) return console.log(err);
        console.log(`Saved livery model!`);
      });
    } catch (error) {
      console.log(error);
    }
    return res.json({ status: 'success', data: clientData });
  } catch (err) {
    return res.json({ status: 'failed', data: null });
  }

  // Trigger403(req, res, cache);
}

module.exports = addLiveryStat;
