const CacheItem = require('../Cache/CacheItem');
const { CACHE_ENABLED, CDN_URL } = require('../Constants');
const Constants = require('../Constants');
const request = require('request');
const LiveryModel = require('../Models/livery');
const AllFilesCacheModel = require('../Models/allFilesCache');

require('dotenv').config();

let metadataArray;
let metaDataDB;

/**
 * Get JSON object with all files availible on the server
 *
 * @param {import('../Cache/Cache').ActiveCache} cache Active cache
 *
 * @return {Object} JSON object
 */
async function getAllFiles(cache) {
  if (!CACHE_ENABLED || cache.data.baseManifests.cdnFileListing === null || cache.data.baseManifests.cdnFileListing.hasExpired) {
    if(CACHE_ENABLED){
    const now = Math.round(new Date().getTime() / 1000);
    try {
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
    } catch (error) {
      console.log(error);
    }
  }

    metadataArray = await getFilesFromStorage(`https://ny.storage.bunnycdn.com/liveriesinstaller/dev/`);
    metaDataDB = await LiveryModel.find();
    console.log(metaDataDB.length, metadataArray.liveries.length);

    let finalListing = {
      airplanes: [],
      liveries: {},
    };
    let fileListingLiveries = [];

    //Liveries
    for (let i = 0; i < metadataArray.liveries.length; i++) {
      let livery = metadataArray.liveries[i];
      fileListingLiveries.push(await getLiveryFormattedObject(livery));
    }

    //Planes

    for (let i = 0; i < metadataArray.airplanes.length; i++) {
      const plane = metadataArray.airplanes[i];
      finalListing.airplanes.push(await getPlaneFormattedObject(plane));
    }

    finalListing.liveries = SortLiveryByAircraft(fileListingLiveries);
    try {
      if(CACHE_ENABLED){
      await AllFilesCacheModel.remove();
      const cacheModel = new AllFilesCacheModel({
        createdAt: now,
        validTill: now + 60 * 10,
        Data: finalListing,
      });
      cacheModel.save(function (err, result) {
        if (err) return console.log(err);
        console.log(`Saved cache model!`);
      });
    }
    } catch (error) {}
    cache.data.baseManifests.cdnFileListing = new CacheItem({
      cdnBaseUrl: Constants.CDN_URL,
      fileList: finalListing,
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
    airplanes: [],
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
        console.log('Getting ', url.split('https://ny.storage.bunnycdn.com')[1].trim(), body.length);
        for (let i = 0; i < body.length; i++) {
          console.log(`https://ny.storage.bunnycdn.com${body[i].Path}${body[i].ObjectName}/`, url);
          if (body[i].IsDirectory && body[i].ObjectName != '.') {
            let returned = await getFilesFromStorage(`https://ny.storage.bunnycdn.com${body[i].Path}${body[i].ObjectName}/`);
            returnObject.liveries = returnObject.liveries.concat(returned.liveries);
            returnObject.airplanes = returnObject.airplanes.concat(returned.airplanes);

            returnObject.img = returnObject.img.concat(returned.img);
          } else if (!body[i].IsDirectory) {
            if (body[i].ObjectName.toLowerCase().includes('jpg')) returnObject.img.push(body[i]);
            else {
              if (body[i].Path.includes('/livery/')) {
                returnObject.liveries.push(body[i]);
              } else if (body[i].Path.includes('/plane/')) {
                returnObject.airplanes.push(body[i]);
              }
            }
          }
        }
        resolve(returnObject);
      } else {
        console.log(`API request to: ${url} failed! `, body, error, response.statusCode);
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

function SortLiveryByAircraft(liveryArray) {
  let result = {};
  liveryArray.forEach(function (item) {
    //if the key doesn;t yet exist in the object declare it as an empty array
    if (!result[item.airplane]) {
      result[item.airplane] = [];
    }

    //push the value onto this key
    result[item.airplane].push(item);
  });
  return result;
}

async function getLiveryFormattedObject(livery) {
  if (!livery.Path.startsWith('/liveriesinstaller/img') && !livery.Path.startsWith('img')) {

    let searchFilename = livery.Path.startsWith('/liveriesinstaller/livery/') ? `${livery.Path.split('/liveriesinstaller/livery/')[1].split('/')[0].trim()}/${livery.ObjectName}` : `${livery.Path.split('/liveriesinstaller/')[1].split('/')[0].trim()}/${livery.ObjectName}`;
    if(livery.Path.startsWith('/liveriesinstaller/dev/livery')){
      searchFilename = `${livery.Path.split('/liveriesinstaller/dev/livery/')[1].split('/')[0].trim()}/${livery.ObjectName}`;
    }

    const planeObjectDB = metaDataDB.filter(
      liv => liv.fileName == searchFilename || liv.fileName == `livery/${searchFilename}` || liv.fileName == `dev/livery/${searchFilename}`
    )[0];
    let image = null,
      smallImage = null,
      checkSum = planeObjectDB != undefined ? planeObjectDB.checkSum : null;

    if (image === '0' || image === 'undefined') image = null;
    if (smallImage === '0' || smallImage === 'undefined') smallImage = null;
    if (image == null || smallImage == null) {
      const thumbnailFound = await getThumbnail(metadataArray, livery.ObjectName.split('.zip')[0].trim());
      if (thumbnailFound.Image != null) image = encodeURI(thumbnailFound.Image.split('/liveriesinstaller')[1]);
      if (thumbnailFound.smallImage != null) smallImage = encodeURI(thumbnailFound.smallImage.split('/liveriesinstaller')[1]);
    }
    try {
      const airplane = livery.Path.split('/liveriesinstaller/dev/livery/')[1].split('/')[0].trim();
      const fileName = encodeURI(`${livery.Path}${livery.ObjectName}`.split('/liveriesinstaller/')[1]);
      let displayName = fileName.substr(fileName.lastIndexOf('/') + 1);
      displayName = displayName.substr(0, displayName.length - 4);
      let AirplaneObject = {
        airplane: airplane || null,
        fileName: fileName || null,
        displayName: displayName || null,
        generation: livery.LastChanged || null,
        metaGeneration: livery.Guid || null,
        lastModified: livery.LastChanged || null,
        ETag: livery.Guid || null,
        size: livery.Length.toString() || null,
        checkSum: checkSum || null,
        image: image || null,
        smallImage: smallImage || null,
      };

      return AirplaneObject;
    } catch (error) {
      console.log(error);
    }
  }
}

async function getPlaneFormattedObject(plane) {
  let searchFilename = plane.Path.startsWith('/liveriesinstaller/plane/') ? `${plane.Path.split('/liveriesinstaller/plane/')[1].split('/')[0].trim()}/${plane.ObjectName}` : `${plane.Path.split('/liveriesinstaller/')[1].split('/')[0].trim()}/${plane.ObjectName}`;
  if(plane.Path.startsWith('/liveriesinstaller/dev/plane')){
    searchFilename = `${plane.Path.split('/liveriesinstaller/dev/plane/')[1].split('/')[0].trim()}/${plane.ObjectName}`;
  }

  const airplane = plane.Path.split('/liveriesinstaller/dev/plane/')[1].split('/')[0].trim();
  const fileName = encodeURI(`${plane.Path}${plane.ObjectName}`.split('/liveriesinstaller/')[1]);
  let displayName = fileName.substr(fileName.lastIndexOf('/') + 1);
  displayName = displayName.substr(0, displayName.length - 4);
  const planeObjectDB = metaDataDB.filter(
    liv => liv.fileName == searchFilename || liv.fileName == `plane/${searchFilename}` || liv.fileName == `dev/plane/${searchFilename}`
  )[0];
  let image = null,
    smallImage = null,
    checkSum = planeObjectDB != undefined ? planeObjectDB.checkSum : null;

  if (image === '0' || image === 'undefined') image = null;
  if (smallImage === '0' || smallImage === 'undefined') smallImage = null;
  if (image == null || smallImage == null) {
  
    const thumbnailFound = await getThumbnail(metadataArray, plane.ObjectName.split('.zip')[0].trim());
    if (thumbnailFound.Image != null) image = encodeURI(thumbnailFound.Image.split('/liveriesinstaller')[1]);
    if (thumbnailFound.smallImage != null) smallImage = encodeURI(thumbnailFound.smallImage.split('/liveriesinstaller')[1]);
  }

  let AirplaneObject = {
    airplane: airplane || null,
    fileName: fileName || null,
    displayName: displayName || null,
    generation: plane.LastChanged || null,
    metaGeneration: plane.Guid || null,
    lastModified: plane.LastChanged || null,
    ETag: plane.Guid || null,
    size: plane.Length.toString() || null,
    checkSum: checkSum || null,
    image: image || null,
    smallImage: smallImage || null,
  };
  return AirplaneObject;
}
