/**
 * TODO(developer): Uncomment the following lines before running the sample.
 */
const bucketName = 'msfsliverypack';
const fs = require('fs');
const { readdir, stat, mkdir, unlink } = require('fs').promises;
require('dotenv').config();
let checksum = require('checksum');
cs = checksum('dshaw');
// const filename = 'Local file to upload, e.g. ./local/path/to/file.txt';

// Imports the Google Cloud client library
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
  await AsyncForEach(liveryPaths, async (livDir, i) => {
    fs.readdir(`./public/${livDir}`, async function (err, files) {
      //handling error
      if (err) {
        return console.log('Unable to scan directory: ' + err);
      }
      //listing all files using forEach
      files.forEach(async function (file) {
        // Do whatever you want to do with the file
        const metadataFile = await getMetadata(`${livDir}/${file}`);
        checksum.file(`./public/${livDir}/${file}`, async function (err, sum) {
          if (!metadataFile.fileExists || sum != metadataFile.metadata.metadata.checkSum) {
            console.log(`${file}: Different checksum! Old: ${metadataFile.metadata.metadata.checkSum} | New: ${sum}`);
            uploadFile(`${file}`, sum, livDir);
          } //else console.log(`${file}: Is the same: Old: ${metadataFile.metadata.metadata.checkSum} | New: ${sum}`)
        });
      });
    });
  });
}

async function uploadFile(filename, checkSum, directory) {
  let fileRawName = filename.substring(filename.lastIndexOf('/') + 1);
  await getMetadata(`${directory}/${filename}`);
  // Uploads a local file to the bucket
  await storage.bucket(bucketName).upload(`public/${directory}/${filename}`, {
    destination: `${directory}/${filename}`,
    // Support for HTTP requests made with `Accept-Encoding: gzip`
    gzip: true,
    // By setting the option `destination`, you can change the name of the
    // object you are uploading to a bucket.
    metadata: {
      // Enable long-lived HTTP caching headers
      // Use only if the contents of the file will never change
      // (If the contents will change, use cacheControl: 'no-cache')
      cacheControl: 'public, max-age=31536000',
      metadata: {
        checkSum: checkSum,
      },
    },
  });

  console.log(`${filename} uploaded to ${bucketName}/${directory}.`);
}

async function getMetadata(filename) {
  // Gets the metadata for the file
  try {
    const [metadata] = await storage.bucket(bucketName).file(filename).getMetadata();
    if (metadata.metadata == undefined)
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
