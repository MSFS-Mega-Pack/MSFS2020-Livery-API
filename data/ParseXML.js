const {
  default: fetch
} = require('node-fetch');
const convert = require('xml-js');
const CacheItem = require('../Cache/CacheItem');
const {
  CACHE_ENABLED,
  CDN_URL
} = require('../Constants');
const {
  Storage
} = require('@google-cloud/storage');
const {
  response
} = require('express');

require('dotenv').config();
const bucketName = 'msfsliverypack';
let storage;

if (process.env.PROJECT_ID_storage && process.env.CLIENT_EMAIL_storage && process.env.PRIVATE_KEY_storage) {
  const projectId = process.env.PROJECT_ID_storage;
  const client_email = process.env.CLIENT_EMAIL_storage;
  const private_key = process.env.PRIVATE_KEY_storage.replace(/\\n/gm, '\n');
  storage = new Storage({
    projectId,
    credentials: {
      client_email,
      private_key,
    },
  });
}
// Creates a client
/**
 * Get JSON object with all files availible on the server
 * @return {Object} JSON object
 */
async function getAllFiles(cache) {
  if (!CACHE_ENABLED || cache.data.baseManifests.cdnList === null || cache.data.baseManifests.cdnList.hasExpired) {
    const response = await fetch(CDN_URL);

    if (response.ok) {
      const parsedResponse = convert.xml2js(await response.text(), {
        ignoreComment: true,
        alwaysChildren: true,
      });
      const metadataArray = await getFilesFromStorage();
      let endVersion = [];
      const allResults = parsedResponse.elements[0].elements;

      for (let i = 4; i < allResults.length; i++) {
        const metadataObject = metadataArray.findByValueOfObject("name", allResults[i].elements[0].elements[0].text);
        let checkSum = 0;
        let image = 0;
        let smallImage = 0;
        if (metadataArray.length > 0 && typeof metadataObject[0] !== 'undefined') {
          checkSum = metadataObject[0].metadata.checkSum;
          image = `${CDN_URL}/${metadataObject[0].metadata.Image}`
          smallImage = `${CDN_URL}/${metadataObject[0].metadata.smallImage}`
        }
        let AirplaneObject = {
          airplane: allResults[i].elements[0].elements[0].text.split('/')[0].split('Liveries')[0].trim(),
          fileName: allResults[i].elements[0].elements[0].text,
          generation: allResults[i].elements[1].elements[0].text,
          metaGeneration: allResults[i].elements[2].elements[0].text,
          lastModified: allResults[i].elements[3].elements[0].text,
          ETag: allResults[i].elements[4].elements[0].text,
          size: allResults[i].elements[5].elements[0].text,
          checkSum: checkSum,
          image: image,
          smallImage: smallImage
        };
        endVersion.push(AirplaneObject);
      }

      cache.data.baseManifests.cdnList = new CacheItem(endVersion);
      return [cache.data.baseManifests.cdnList, false];
    }
  }
  return [cache.data.baseManifests.cdnList, true];
}
/**
 * Get all metadata from Google Storage, returns array, is empty when not logged in.
 * @return {Object} JSON object
 */
async function getFilesFromStorage() {
  if (!process.env.PROJECT_ID_storage || !process.env.CLIENT_EMAIL_storage || !process.env.PRIVATE_KEY_storage) {
    return [];
  }
  let [files] = await storage.bucket(bucketName).getFiles();
  let temparray = [];
  await files.forEach(file => {
    if (typeof file.metadata.metadata === 'undefined') {
      file.metadata = {
        metadata: {
          checkSum: 0,
          Image: 0,
          smallImage: 0
        },
      };
    }
    temparray.push(file.metadata);
  });
  files = temparray;
  return files;
}

module.exports = {
  getAllFiles: getAllFiles,
};

Array.prototype.findByValueOfObject = function (key, value) {
  return this.filter(function (item) {
    return (item[key] === value);
  });
}