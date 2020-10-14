const fs = require('fs');
const {
  readdir,
  stat
} = require('fs').promises;
require('dotenv').config();
let checksum = require('checksum');
const sharp = require('sharp');
const mongoose = require('mongoose');
const LiveryModel = require('./Models/livery');
mongoose.connect(process.env.MONGOURL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  poolSize: 3
});
let AllLiveriesOnDB = [];


async function Main() {
  await LiveryModel.find(function (err, liveries) {
    AllLiveriesOnDB = liveries;
  })
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
          if (!metadataFile.fileExists || sum != metadataFile.checkSum) {
            const thumbnails = await getThumbnail(livDir, file, sum);
            console.log(await getThumbnail(livDir, file, sum))
            console.log(`${file}: Different checksum! Old: ${metadataFile.checkSum} | New: ${sum}`);
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

  let dir = `./downloads/${liveryType}/${liveryName}/SimObjects`;
  if (!fs.existsSync(dir)) return console.log(dir);
  let directories = await GetDirectories(dir);
  dir += `/${directories[0]}`;
  if (!fs.existsSync(dir)) return console.log(dir);
  directories = await GetDirectories(dir);
  dir += `/${directories[0]}`;
  if (!fs.existsSync(dir)) return console.log(dir);
  directories = await GetDirectories(dir);
  for (let i = 0; i < directories.length; i++) {
    if (directories[i].includes('TEXTURE.')) {
      directories = directories[i];
      break;
    }
  }

  dir += `/${directories}`;
  await fs.readdir(dir, async (err, files) => {
    await files.forEach(async file => {
      if (file.includes('thumbnail')) {
        const dataType = file.substr(file.lastIndexOf('.') + 1).trim();

        if (dataType.match(/(jpe?g|png|gif)/i)) {
          let dest = `img/${liveryType}/${liveryName}.${dataType}`;
          if (file.includes('_small')) dest = `img/${liveryType}/${liveryName}_small.${dataType}`;
          await sharp(`${dir}/${file}`)
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
                  `./compressed/${liveryName}${file}`, {
                    checkSum: sum,
                  },
                  dest
                );
                result.push(dest);
              } else {
                uploadFile(
                  `${dir}/${file}`, {
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
  })
  return result;
}

function addLiverytoDatabase(liveryObject) {
  LiveryModel.findOne({
    fileName: liveryObject.filename
  }, function (err, result) {
    if (err) return res.send(err);
    if (result != null) {
      LiveryModel.updateOne({
        fileName: liveryObject.filename
      }, {
        airplane: liveryObject.airplane,
        fileName: liveryObject.filename,
        generation: Math.round(new Date().getTime() / 1000),
        size: liveryObject.size,
        checkSum: liveryObject.checkSum,
        image: liveryObject.image,
        smallImage: liveryObject.smallImage,
      }, {
        upsert: true
      }, function (err, result) {
        console.log(`Updated ${liveryObject.fileName}`, result)
      });
    } else {
      const newLivery = new LiveryModel({
        airplane: liveryObject.airplane,
        fileName: liveryObject.filename,
        generation: Math.round(new Date().getTime() / 1000),
        size: liveryObject.size,
        checkSum: liveryObject.checkSum,
        image: liveryObject.image,
        smallImage: liveryObject.smallImage,
      });
      newLivery.save(function (err, result) {
        if (err) return console.log(err);
        console.log(`Inserted ${liveryObject.fileName}`, result)
      });
    }


  })
}

async function uploadFile(sourceDirectory, metadata, Destdirectory) {
  const filename = Destdirectory.toString();
  try {
    const formData = {
      attachments: [
        fs.createReadStream(sourceDirectory)
      ],
    };
    const request = require('request');
    request.put({
      url: `https://ny.storage.bunnycdn.com/liveriesinstaller/${Destdirectory}`,
      headers: {
        'AccessKey': process.env.BunnyAPIKey
      },
      formData: formData
    }, function optionalCallback(err, httpResponse, body) {
      if (err) {
        return console.error('upload failed:', err);
      }
      console.log('Upload successful!  Server responded with:', body);
      console.log(`${sourceDirectory} uploaded to ${Destdirectory}.`);
      if (!Destdirectory.toString().startsWith("img")) {
        addLiverytoDatabase({
          airplane: filename.split('/')[0].trim(),
          filename: filename,
          size: fs.statSync(sourceDirectory).size,
          checkSum: metadata.checkSum,
          image: metadata.Image,
          smallImage: metadata.smallImage
        })
      }
    });


  } catch (error) {
    console.log(`Uploading failed for: ${sourceDirectory}\nReason:`, error);
  }
}

async function getMetadata(filename) {
  // Gets the metadata for the file
  try {
    let metadata = AllLiveriesOnDB.filter(livery => livery.fileName == filename)[0];
    if (typeof metadata === 'undefined')
      metadata = {
        checkSum: 0
      };
    return {
      metadata
    };
  } catch (error) {
    return {
      checkSum: 0,
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