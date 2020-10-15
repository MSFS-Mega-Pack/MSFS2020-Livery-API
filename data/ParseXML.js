const CacheItem = require('../Cache/CacheItem');
const { CACHE_ENABLED, CDN_URL } = require('../Constants');
const Constants = require('../Constants');
const request = require('request');
const mongoose = require('mongoose');
const LiveryModel = require('../Models/livery');
const AllFilesCacheModel = require('../Models/allFilesCache');
mongoose.connect(process.env.MONGOURL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  poolSize: 3,
});

require('dotenv').config();

/**
 * Get JSON object with all files availible on the server
 *
 * @param {import('../Cache/Cache').ActiveCache} cache Active cache
 *
 * @return {Object} JSON object
 */
async function getAllFiles(cache) {
  if (!CACHE_ENABLED || cache.data.baseManifests.cdnFileListing === null || cache.data.baseManifests.cdnFileListing.hasExpired) {
    const now = Math.round(new Date().getTime() / 1000);
    const CacheDB = await AllFilesCacheModel.find();
    if (CacheDB != null && CacheDB.length > 0) {
      const CachedData = CacheDB[0];
      if (CachedData.validTill > now) {
        cache.data.baseManifests.cdnFileListing = new CacheItem({
          cdnBaseUrl: Constants.CDN_URL,
          fileList: CachedData.Data,
        });
        return [cache.data.baseManifests.cdnFileListing, true];
      }
    }

    const metadataArray = await getFilesFromStorage('https://ny.storage.bunnycdn.com/liveriesinstaller/');
    const metaDataDB = await LiveryModel.find();
    console.log(metaDataDB);
    let fileListing = [];
    for (let i = 0; i < metadataArray.liveries.length; i++) {
      let livery = metadataArray.liveries[i];
      if (!livery.Path.startsWith('./img') && !livery.Path.startsWith('img')) {
        let image = null,
          smallImage = null;

        if (image === '0' || image === 'undefined') image = null;
        if (smallImage === '0' || smallImage === 'undefined') smallImage = null;
        if (image == null || smallImage == null) {
          const thumbnailFound = await getThumbnail(metadataArray, livery.ObjectName.split('.zip')[0].trim());
          if (thumbnailFound.Image != null) image = encodeURI(thumbnailFound.Image);
          if (thumbnailFound.smallImage != null) smallImage = encodeURI(thumbnailFound.smallImage);
        }
        try {
          let AirplaneObject = {
            airplane: livery.Path.split('/liveriesinstaller/')[1].split('/')[0].trim() || null,
            fileName: encodeURI(`${livery.Path}${livery.ObjectName}`) || null,
            generation: livery.LastChanged || null,
            metaGeneration: livery.Guid || null,
            lastModified: livery.LastChanged || null,
            ETag: livery.Guid || null,
            size: livery.Length || null,
            checkSum:
              metaDataDB.filter(
                liv => liv.fileName == `${livery.Path.split('/liveriesinstaller/')[1].split('/')[0].trim()}/${livery.ObjectName}`
              )[0].checkSum || null,
            image: image || null,
            smallImage: smallImage || null,
          };

          fileListing.push(AirplaneObject);
        } catch (error) {
          console.log(error);
        }
      }
    }
    await AllFilesCacheModel.remove();
    const cacheModel = new AllFilesCacheModel({
      createdAt: now,
      validTill: now + 60 * 10,
      Data: fileListing,
    });
    cacheModel.save(function (err, result) {
      if (err) return console.log(err);
      console.log(`Saved cache model!`);
    });
    cache.data.baseManifests.cdnFileListing = new CacheItem({
      cdnBaseUrl: Constants.CDN_URL,
      fileList: fileListing,
    });
    return [cache.data.baseManifests.cdnFileListing, false];
  }
  return [cache.data.baseManifests.cdnFileListing, true];
}
/**
 * Get all metadata from Google Storage, returns array, is empty when not logged in.
 * @return {Object} JSON object
 */
async function getFilesFromStorage(url) {
  let returnObject = {
    liveries: [],
    img: [],
  };
  const headers = {
    authority: 'storage.bunnycdn.com',
    pragma: 'no-cache',
    'cache-control': 'no-cache',
    accesskey: process.env.BunnyAPI,
    'sec-fetch-site': 'cross-site',
    'sec-fetch-mode': 'cors',
    'sec-fetch-dest': 'empty',
    'accept-language': 'nl,en-US;q=0.9,en;q=0.8',
  };

  const options = {
    url: url,
    headers: headers,
  };
  return new Promise(function (resolve, reject) {
    request(options, async function (error, response, body) {
      if (!error && response.statusCode == 200) {
        body = JSON.parse(body);
        for (let i = 0; i < body.length; i++) {
          console.log(`https://ny.storage.bunnycdn.com${body[i].Path}${body[i].ObjectName}/`, url);
          if (body[i].IsDirectory) {
            let returned = await getFilesFromStorage(`https://ny.storage.bunnycdn.com${body[i].Path}${body[i].ObjectName}/`);
            returnObject.liveries = returnObject.liveries.concat(returned.liveries);
            returnObject.img = returnObject.img.concat(returned.img);
          } else if (!body[i].IsDirectory) {
            if (body[i].ObjectName.toLowerCase().includes('jpg')) returnObject.img.push(body[i]);
            else returnObject.liveries.push(body[i]);
          }
        }
        resolve(returnObject);
      }
    });
  });
}

async function getThumbnail(metaDataArray, aircraftname) {
  let returnResult = {
    smallImage: null,
    Image: null,
  };
  let imageURL = `${aircraftname}.JPG`;
  let smallImageURL = `${aircraftname}_small.JPG`;
  try {
    let found = metaDataArray.img.filter(object => object.ObjectName.toLowerCase() == imageURL.toLowerCase())[0];
    returnResult.Image = `${found.Path}${found.ObjectName}` || null;
  } catch (error) {}
  try {
    let found = metaDataArray.img.filter(object => object.ObjectName.toLowerCase() == smallImageURL.toLowerCase())[0];
    returnResult.smallImage = `${found.Path}${found.ObjectName}` || null;
  } catch (error) {}
  return returnResult;
}

module.exports = {
  getAllFiles: getAllFiles,
};
