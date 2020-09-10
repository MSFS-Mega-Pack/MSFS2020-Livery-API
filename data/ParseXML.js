const { default: fetch } = require('node-fetch');
const convert = require('xml-js');
const CacheItem = require('../Cache/CacheItem');
const { CACHE_ENABLED } = require('../Constants');
const { Storage } = require('@google-cloud/storage');
const { response } = require('express');

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
    const response = await fetch('https://msfs-liverypack-cdn.mrproper.dev/');

    if (response.ok) {
      const parsedResponse = convert.xml2js(await response.text(), {
        ignoreComment: true,
        alwaysChildren: true,
      });

      let endVersion = [];
      const allResults = parsedResponse.elements[0].elements;

      for (let i = 4; i < allResults.length; i++) {
        const checkSum = await (await getMetadata(allResults[i].elements[0].elements[0].text)).metadata.metadata.checkSum;
        let AirplaneObject = {
          airplane: allResults[i].elements[0].elements[0].text.split('/')[0].split('Liveries')[0].trim(),
          fileName: allResults[i].elements[0].elements[0].text,
          generation: allResults[i].elements[1].elements[0].text,
          metaGeneration: allResults[i].elements[2].elements[0].text,
          lastModified: allResults[i].elements[3].elements[0].text,
          ETag: allResults[i].elements[4].elements[0].text,
          size: allResults[i].elements[5].elements[0].text,
          checkSum: checkSum,
        };
        endVersion.push(AirplaneObject);
      }

      console.log('Done caching');
      cache.data.baseManifests.cdnList = new CacheItem(endVersion);
      return [cache.data.baseManifests.cdnList, false];
    }
  }
  return [cache.data.baseManifests.cdnList, true];
}
async function getMetadata(filename) {
  if (!process.env.PROJECT_ID_storage || !process.env.CLIENT_EMAIL_storage || !process.env.PRIVATE_KEY_storage) {
    return {
      fileExists: false,
      metadata: {
        metadata: {
          checkSum: 0,
        },
      },
    };
  }
  // Gets the metadata for the file
  try {
    const [metadata] = await storage.bucket(bucketName).file(filename).getMetadata();
    if (typeof metadata.metadata === 'undefined')
      metadata = {
        metadata: {
          checkSum: 0,
        },
      };
    return {
      fileExists: true,
      metadata,
    };
  } catch (error) {
    return {
      fileExists: false,
      metadata: {
        metadata: {
          checkSum: 0,
        },
      },
    };
  }
}

module.exports = {
  getAllFiles: getAllFiles,
};
