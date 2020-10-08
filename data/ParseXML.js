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
    const metadataArray = await getFilesFromStorage('img');
    const metadataArrayImages = await getFilesFromStorage('liveries');
    let fileListing = [];

    //USED WHEN THERE IS A GOOGLE CLOUD STORAGE KEY FOUND
    if (storage != null) {
      for (let i = 0; i < metadataArray.length; i++) {
        let livery = metadataArray[i];
        if (!livery.name.startsWith('./img') && !livery.name.startsWith('img')) {
          let checkSum = livery.metadata.checkSum,
            image = livery.metadata.Image,
            smallImage = livery.metadata.smallImage;

          if (image === '0' || image === 'undefined') image = null;
          if (smallImage === '0' || smallImage === 'undefined') smallImage = null;
          if (image == null || smallImage == null) {
            const thumbnailFound = await getThumbnail(metadataArrayImages, livery.name.split('.zip')[0].trim());
            if (thumbnailFound.Image != null) image = encodeURI(thumbnailFound.Image);
            if (thumbnailFound.smallImage != null) smallImage = encodeURI(thumbnailFound.smallImage);
          }

          let AirplaneObject = {
            airplane: livery.name.split('/')[0].split('Liveries')[0].trim() || null,
            fileName: encodeURI(livery.name) || null,
            generation: livery.generation || null,
            metaGeneration: livery.metageneration || null,
            lastModified: livery.updated || null,
            ETag: livery.etag || null,
            size: livery.size || null,
            checkSum: checkSum || null,
            image: image || null,
            smallImage: smallImage || null,
          };

          fileListing.push(AirplaneObject);
        }
      }
      cache.data.baseManifests.cdnFileListing = new CacheItem({
        cdnBaseUrl: Constants.CDN_URL,
        fileList: fileListing,
      });
      return [cache.data.baseManifests.cdnFileListing, false];
    }

    //USED WHEN THERE IS NO GOOGLE CLOUD STORAGE KEY FOUND
    else {
      const response = await fetch(CDN_URL);

      if (response.ok) {
        const parsedResponse = convert.xml2js(await response.text(), {
          ignoreComment: true,
          alwaysChildren: true,
        });
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

              if (image === '0' || image === 'undefined') image = null;
              if (smallImage === '0' || smallImage === 'undefined') smallImage = null;
              if (image == null || smallImage == null) {
                const thumbnailFound = await getThumbnail(
                  metadataArrayImages,
                  allResults[i].elements[0].elements[0].text.split('.zip')[0].trim()
                );
                if (thumbnailFound.Image != null) image = encodeURI(thumbnailFound.Image);
                if (thumbnailFound.smallImage != null) smallImage = encodeURI(thumbnailFound.smallImage);
              }

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
  }
  return [cache.data.baseManifests.cdnFileListing, true];
}
/**
 * Get all metadata from Google Storage, returns array, is empty when not logged in.
 * @return {Object} JSON object
 */
async function getFilesFromStorage(FilterOut) {
  if (!process.env.PROJECT_ID_storage || !process.env.CLIENT_EMAIL_storage || !process.env.PRIVATE_KEY_storage) {
    return [];
  }

  let [files] = await storage.bucket(bucketName).getFiles();
  let tempArray = [];

  await files.forEach(file => {
    if (!file.name.toString().startsWith(FilterOut)) {
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

async function getThumbnail(metaDataArray, aircraftname) {
  let returnResult = {
    smallImage: null,
    Image: null,
  };
  let imageURL = `img/${aircraftname}.jpg`;
  let smallImageURL = `img/${aircraftname}_small.jpg`;
  try {
    returnResult.Image =
      (await metaDataArray.findByValueOfObject('name', imageURL)[0].name) ||
      (await metaDataArray.findByValueOfObject('name', `img/${aircraftname.split('/')[0].split('Liveries')[0].trim()}/thumbnail.JPG`)[0].name) ||
      null;
  } catch (error) {}
  try {
    returnResult.smallImage =
      (await metaDataArray.findByValueOfObject('name', smallImageURL)[0].name) ||
      (await metaDataArray.findByValueOfObject('name', `img/${aircraftname.split('/')[0].split('Liveries')[0].trim()}/thumbnail_small.JPG`)[0]
        .name) ||
      null;
  } catch (error) {}
  return returnResult;
}

module.exports = {
  getAllFiles: getAllFiles,
};

Array.prototype.findByValueOfObject = function (key, value) {
  return this.filter(function (item) {
    try {
      return item[key].toLowerCase() === value.toLowerCase();
    } catch (error) {}
  });
};
