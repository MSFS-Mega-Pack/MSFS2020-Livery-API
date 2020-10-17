console.log('It is upload time!');
const fs = require('fs');
const { readdir, stat } = require('fs').promises;
require('dotenv').config();
let checksum = require('checksum');
const sharp = require('sharp');
const mongoose = require('mongoose');
const LiveryModel = require('./Models/livery');
// const Client = require('ftp');
const ftp = require('basic-ftp');

const client = new ftp.Client();
client.ftp.verbose = true;

// const c = new Client();
console.log('Loaded all the modules');
mongoose.connect(process.env.MONGOURL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  poolSize: 3,
});
let AllLiveriesOnDB = [];
// c.connect({ host: process.env.ftpHost, user: process.env.ftpUser, password: process.env.ftpPassword });
console.log('Ready, set, go!');
async function Main() {
  await client.connect(process.env.ftpHost, 21);
  await client.login(process.env.ftpUser, process.env.ftpPassword);

  await client.send('TYPE I'); // Binary mode
  await client.sendIgnoringError('STRU F'); // Use file structure
  await client.sendIgnoringError('OPTS UTF8 ON'); // Some servers expect UTF-8 to be enabled explicitly
  await LiveryModel.find(function (err, liveries) {
    AllLiveriesOnDB = liveries;
  });

  const liveryPaths = await GetDirectories('./public');
  for (let i = 0; i < liveryPaths.length; i++) {
    const livDir = liveryPaths[i];
    const files = await fs.promises.readdir(`./public/${livDir}`);

    //listing all files using forEach
    for (let index = 0; index < files.length; index++) {
      const file = files[index];
      console.log(file);
      // Do whatever you want to do with the file
      const metadataFile = await getMetadata(`${livDir}/${file}`);

      await new Promise(resolve => {
        checksum.file(`./public/${livDir}/${file}`, async function (err, sum) {
          if (sum != metadataFile.checkSum) {
            const thumbnails = await getThumbnail(livDir, file, sum);
            console.log(`${file}: Different checksum! Old: ${metadataFile.checkSum} | New: ${sum}`);
            let uploadMetadata = {
              checkSum: sum,
              smallImage: null,
              Image: null,
            };
            try {
              if (thumbnails && thumbnails.length != 0) {
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
            await uploadFile(`./public/${livDir}/${file}`, uploadMetadata, `${livDir}/${file}`);
          } else {
            console.log('Same checksum');
          }
          // let x = await client.sendIgnoringError('NOOP');
          // console.log(x);
          resolve();
        });
      });
    }
  }
  await client.uploadFromDir('./compressed');
  return;
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
  if (!fs.existsSync(dir) || !fs.lstatSync(dir).isDirectory()) return console.log(dir);
  let directories = await GetDirectories(dir);
  if (directories.length == 0) return console.log(dir);
  dir += `/${directories[0]}`;
  if (!fs.existsSync(dir) || !fs.lstatSync(dir).isDirectory()) return console.log(dir);
  directories = await GetDirectories(dir);
  dir += `/${directories[0]}`;
  if (!fs.existsSync(dir) || !fs.lstatSync(dir).isDirectory()) return console.log(dir);
  directories = await GetDirectories(dir);
  for (let i = 0; i < directories.length; i++) {
    if (directories[i].includes('TEXTURE.')) {
      directories = directories[i];
      break;
    }
  }
  dir += `/${directories}`;
  if (!fs.existsSync(dir) || !fs.lstatSync(dir).isDirectory()) return console.log(dir);
  await fs.readdir(dir, async (err, files) => {
    await files.forEach(async file => {
      if (file.includes('thumbnail')) {
        const dataType = file.substr(file.lastIndexOf('.') + 1).trim();
        if (dataType.match(/(jpe?g|png|gif)/i)) {
          let dest = `img/${liveryType}/${liveryName}.${dataType}`;
          if (file.includes('_small')) dest = `img/${liveryType}/${liveryName}_small.${dataType}`;
          try {
            await sharp(`${dir}/${file}`)
              .jpeg({
                progressive: true,
                force: false,
              })
              .png({
                progressive: true,
                force: false,
              })
              .toFile(`./compressed/img/${liveryName}${file}`, (err, info) => {
                if (!err) {
                  console.log(`Compressed imgae for: ${liveryName}`, info);
                  result.push(dest);
                }
                console.log(err);
              });
          } catch (error) {}
        }
      }
    });
  });

  return result;
}

function addLiverytoDatabase(liveryObject) {
  LiveryModel.findOne(
    {
      fileName: liveryObject.filename,
    },
    function (err, result) {
      if (err) return res.send(err);
      if (result != null) {
        LiveryModel.updateOne(
          {
            fileName: liveryObject.filename,
          },
          {
            airplane: liveryObject.airplane,
            fileName: liveryObject.filename,
            generation: Math.round(new Date().getTime() / 1000),
            size: liveryObject.size,
            checkSum: liveryObject.checkSum,
            image: liveryObject.image,
            smallImage: liveryObject.smallImage,
          },
          {
            upsert: true,
          },
          function (err, result) {
            console.log(`Updated ${liveryObject.fileName}`, result);
          }
        );
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
          console.log(`Inserted ${liveryObject.fileName}`, result);
        });
      }
    }
  );
}

async function uploadFile(sourceDirectory, metadata, Destdirectory) {
  const filename = Destdirectory.toString();

  console.log('UPLOADING ' + sourceDirectory);
  await client.uploadFrom(sourceDirectory, Destdirectory);
  console.log('AFTER');

  if (!Destdirectory.toString().startsWith('img')) {
    await new Promise(resolve => {
      addLiverytoDatabase({
        airplane: filename.split('/')[0].trim(),
        filename: filename,
        size: fs.statSync(sourceDirectory).size,
        checkSum: metadata.checkSum,
        image: metadata.Image,
        smallImage: metadata.smallImage,
      });
      resolve();
    });
  }
}

async function getMetadata(filename) {
  // Gets the metadata for the file
  try {
    let metadata = AllLiveriesOnDB.filter(livery => livery.fileName == filename)[0];
    if (typeof metadata === 'undefined') {
      metadata = {
        checkSum: 0,
        fileExists: false,
      };
    }
    return metadata;
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

console.log('And we are live :)');
Main();
