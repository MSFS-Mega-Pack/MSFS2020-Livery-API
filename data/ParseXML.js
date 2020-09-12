const { default: fetch } = require('node-fetch');
const convert = require('xml-js');
const CacheItem = require('../Cache/CacheItem');
const { CACHE_ENABLED, CDN_URL } = require('../Constants');
const { Storage } = require('@google-cloud/storage');
const { response } = require('express');
const Constants = require('../Constants');

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

/**
 * Get JSON object with all files availible on the server
 *
 * @param {import('../Cache/Cache').ActiveCache} cache Active cache
 *
 * @return {Object} JSON object
 */
async function getAllFiles(cache) {
  if (!CACHE_ENABLED || cache.data.baseManifests.cdnFileListing === null || cache.data.baseManifests.cdnFileListing.hasExpired) {
    const response = await fetch(CDN_URL);

    if (response.ok) {
      const parsedResponse = convert.xml2js(await response.text(), {
        ignoreComment: true,
        alwaysChildren: true,
      });
      const metadataArray = await getFilesFromStorage();
      let fileListing = [];
      const allResults = parsedResponse.elements[0].elements;
      for (let i = 0; i < allResults.length; i++) {
        if (allResults[i].name == 'Contents') {
          const metadataObject = metadataArray.findByValueOfObject('name', allResults[i].elements[0].elements[0].text);
          if (!allResults[i].elements[0].elements[0].text.startsWith('img')) {
            let checkSum, image, smallImage;

            if (metadataArray.length > 0 && typeof metadataObject[0] !== 'undefined') {
              checkSum = metadataObject[0].metadata.checkSum;
              image = encodeURI(`${metadataObject[0].metadata.Image}`);
              smallImage = encodeURI(`${metadataObject[0].metadata.smallImage}`);
            }

            if (image === '0') image = null;
            if (smallImage === '0') smallImage = null;

            let AirplaneObject = {
              airplane: allResults[i].elements[0].elements[0].text.split('/')[0].split('Liveries')[0].trim() || null,
              fileName: encodeURI(allResults[i].elements[0].elements[0].text) || null,
              generation: allResults[i].elements[1].elements[0].text || null,
              metaGeneration: allResults[i].elements[2].elements[0].text || null,
              lastModified: allResults[i].elements[3].elements[0].text || null,
              ETag: allResults[i].elements[4].elements[0].text || null,
              size: allResults[i].elements[5].elements[0].text || null,
              checkSum: checkSum || null,
              image: image || null,
              smallImage: smallImage || null,
            };

            fileListing.push(AirplaneObject);
          }
        }
      }

      cache.data.baseManifests.cdnFileListing = new CacheItem({
        cdnBaseUrl: Constants.CDN_URL,
        fileList: fileListing,
      });

      return [cache.data.baseManifests.cdnFileListing, false];
    }
  }
  return [cache.data.baseManifests.cdnFileListing, true];
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
  let tempArray = [];

  await files.forEach(file => {
    if (!file.name.toString().startsWith('img')) {
      if (typeof file.metadata.metadata === 'undefined') {
        file.metadata = {
          metadata: {
            checkSum: null,
            image: null,
            smallImage: null,
          },
        };
      }
      tempArray.push(file.metadata);
    }
  });

  files = tempArray;
  return files;
}

module.exports = {
  getAllFiles: getAllFiles,
};

Array.prototype.findByValueOfObject = function (key, value) {
  return this.filter(function (item) {
    return item[key] === value;
  });
};
