const bucketName = 'msfsliverypack';
const fs = require('fs');
const { readdir, stat } = require('fs').promises;
require('dotenv').config();
let checksum = require('checksum');
const sharp = require('sharp');

const { Storage } = require('@google-cloud/storage');

const projectId = process.env.PROJECT_ID_storage;
const client_email = process.env.CLIENT_EMAIL_storage;
const private_key = process.env.PRIVATE_KEY_storage.replace(/\\n/gm, '\n');

// Creates a client
const storage = new Storage({
  projectId,
  credentials: {
    client_email,
    private_key,
  },
});
async function Main() {
  const liveryPaths = await GetDirectories('./public');
  await AsyncForEach(liveryPaths, async livDir => {
    fs.readdir(`./public/${livDir}`, async function (err, files) {
      if (err) {
        return console.log('Unable to scan directory: ' + err);
      }
      //listing all files using forEach
      files.forEach(async function (file) {
        // Do whatever you want to do with the file
        const metadataFile = await getMetadata(`${livDir}/${file}`);
        checksum.file(`./public/${livDir}/${file}`, async function (err, sum) {
          if (!metadataFile.fileExists || sum != metadataFile.metadata.metadata.checkSum) {
            const thumbnails = await getThumbnail(livDir, file, sum);
            console.log(`${file}: Different checksum! Old: ${metadataFile.metadata.metadata.checkSum} | New: ${sum}`);
            let uploadMetadata = {
              checkSum: sum,
              smallImage: 0,
              Image: 0,
            };
            try {
              if (thumbnails.length != 0) {
                for (let i = 0; i < thumbnails.length; i++) {
                  if (thumbnails[i].toString().includes('small')) {
                    uploadMetadata.smallImage = thumbnails[i].toString();
                  } else {
                    uploadMetadata.Image = thumbnails[i].toString();
                  }
                }
              }
            } catch (error) {
              console.log(error);
            }
            uploadFile(`./public/${livDir}/${file}`, uploadMetadata, `${livDir}/${file}`);
          }
        });
      });
    });
  });
}

/**
 *
 * @param {string} liveryType
 * @param {string} liveryName
 * @param {string} sum
 */
async function getThumbnail(liveryType, liveryName, sum) {
  let result = [];
  liveryName = liveryName
    .substring(liveryName.lastIndexOf('/') + 1)
    .trim()
    .replace('.zip', '');

  let dir = `./downloads/${liveryType}/${liveryName}/SimObjects/Airplanes`;
  if (!fs.existsSync(dir)) return console.log(dir);
  let directories = await GetDirectories(dir);
  dir += `/${directories[0]}`;
  directories = await GetDirectories(dir);
  for (let i = 0; i < directories.length; i++) {
    if (directories[i].includes('TEXTURE.')) {
      directories = directories[i];
      break;
    }
  }

  dir += `/${directories}`;
  fs.readdir(dir, async (err, files) => {
    files.forEach(async file => {
      if (file.includes('thumbnail')) {
        const dataType = file.substr(file.lastIndexOf('.') + 1).trim();

        if (dataType.match(/(jpe?g|png|gif)/i)) {
          let dest = `img/${liveryType}/${liveryName}.${dataType}`;
          if (file.includes('_small')) dest = `img/${liveryType}/${liveryName}_small.${dataType}`;
          sharp(`${dir}/${file}`)
            .jpeg({
              progressive: true,
              force: false,
            })
            .png({
              progressive: true,
              force: false,
            })
            .toFile(`./compressed/${liveryName}${file}`, (err, info) => {
              if (!err) {
                uploadFile(
                  `./compressed/${liveryName}${file}`,
                  {
                    checkSum: sum,
                  },
                  dest
                );
                result.push(dest);
              } else {
                uploadFile(
                  `${dir}/${file}`,
                  {
                    checkSum: sum,
                  },
                  dest
                );
                result.push(dest);
              }
            });
        }
      }
    });
  });
  return result;
}

async function uploadFile(sourceDirectory, metadata, Destdirectory) {
  await getMetadata(Destdirectory);
  // Uploads a local file to the bucket
  await storage.bucket(bucketName).upload(sourceDirectory, {
    destination: Destdirectory,
    // Support for HTTP requests made with `Accept-Encoding: gzip`
    gzip: true,
    // By setting the option `destination`, you can change the name of the
    // object you are uploading to a bucket.
    metadata: {
      // Enable long-lived HTTP caching headers
      // Use only if the contents of the file will never change
      // (If the contents will change, use cacheControl: 'no-cache')
      cacheControl: 'public, max-age=31536000',
      metadata,
    },
  });

  console.log(`${sourceDirectory} uploaded to ${Destdirectory}.`);
}

async function getMetadata(filename) {
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

/**
 * @callback forEachCallback
 * @param  {any} element - Value of array element
 * @param  {number} index   - Index of array element
 * @param  {Array}  array   - Array itself
 */

/**
 * Performs a ForEach asynchronously. Can't be guaranteed to execute in order.
 *
 * @param {Array} arr
 * @param {forEachCallback} callback
 */
async function AsyncForEach(arr, callback) {
  return Promise.all(arr.map(callback));
}

const GetDirectories = async (path = '.') =>
  (await stat(path)).isDirectory() ? Promise.all(await readdir(path)).then(results => [].concat(...results)) : [];

Main();
