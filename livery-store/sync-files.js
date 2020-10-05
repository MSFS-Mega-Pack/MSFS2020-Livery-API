const fs = require('fs');
const fsPromises = require('fs').promises;
const Path = require('path');
const request = require('request');
const resolve = require('path').resolve;
fsPromises.mkdir('./liverypackDownloads', {
  recursive: true,
  mode: 0o755,
});
const ncp = require('ncp').ncp;
ncp.limit = 16;
const prefixes = [
  'Asobo_208B_GRAND_CARAVAN',
  'Asobo_A320_NEO',
  'Asobo_B747',
  'Asobo_b787',
  'Asobo_C152',
  'Asobo_C172sp',
  'Asobo_CJ4',
  'Asobo_DA40',
  'Asobo_DA62',
  'Asobo_E330',
  'Asobo_Icon',
  'Asobo_KingAir350',
  'Asobo_Pitts',
  'Asobo_Savage_Cub',
  'Asobo_TBM930',
  'Asobo_XCub',
];
const { readdir, stat, mkdir } = require('fs').promises;

async function Start() {
  await fs.rmdirSync(`./downloads`, { recursive: true });
  await fs.rmdirSync(`./compressed`, { recursive: true });
  await fs.rmdirSync(`./liverypackUnzip`, { recursive: true });
  await fs.rmdirSync(`./liverypackDownloads`, { recursive: true });
  const Directory = `./liverypackDownloads/`;
  const downloadURL = 'https://liveriesmegapack.b-cdn.net/LiveriesMegaPackVersionX.1.zip';
  const zipName = downloadURL.substr(downloadURL.lastIndexOf('/') + 1);
  const zipPath = Path.join(Directory, zipName);
  const extract = require('extract-zip');
  const extractDir = `./liverypackDownloads/`;
  const newDirName = 'liverypackDownloads';

  console.log(zipPath);
  console.log(`Finished downloading: ${zipName}`);
  // const zip = new admzip(zipPath);

  console.log(`Created folder \n${Directory}`);

  console.log(`mk temp path`);
  if (!fs.existsSync(Directory)) {
    await fsPromises.mkdir(Directory, {
      recursive: true,
    });
  }
  if (!fs.existsSync('./liverypackUnzip/')) {
    await fsPromises.mkdir('./liverypackUnzip/', {
      recursive: true,
    });
  }

  console.log(`check zip exists`);
  if (fs.existsSync(zipPath)) {
    await fsPromises.unlink(zipPath);
  }

  await new Promise((resolve, reject) => {
    console.log(`Making stream`);
    const stream = fs.createWriteStream(zipPath);

    console.log(`Starting DL`);
    request
      .get(downloadURL)
      .pipe(stream)
      .on('error', async err => {
        console.log(`Error`);
        ThrowError('E008', `${err} URL: ${downloadURL}`);
        console.log(err);
      })
      .on('finish', async () => {
        console.log(`Finished downloading: ${zipName}`);
        const zip = new admzip(zipPath);

        console.log(`Created folder \n${Directory}`);
        try {
          await extract(zipPath, {
            dir: resolve('./liverypackUnzip/'),
          });
          console.log('Extraction complete');
          fs.unlinkSync(zipPath);
          console.log(`Installed: ${zipName}`);
          moveFolders();
        } catch (err) {
          console.log(err);
        }
      });
  });
}

async function moveFolders() {
  const liveryPaths = await GetDirectories('./liverypackUnzip');
  await AsyncForEach(liveryPaths, async (livDir, i) => {
    const destFolder = getAircraftByPrefix(livDir);
    if (destFolder != undefined) {
      if (!fs.existsSync(`./downloads/${destFolder}/`)) {
        await fsPromises.mkdir(`./downloads/${destFolder}/`, {
          recursive: true,
        });
      }
      ncp(`./liverypackUnzip/${livDir}`, `./downloads/${destFolder}/${livDir}`, async function (err) {
        if (err) {
          return console.error(err);
        }
        console.log('done!');
        await fs.rmdirSync(`./liverypackUnzip/${livDir}`, { recursive: true });
      });
    }
  });
}

function getAircraftByPrefix(pathName) {
  for (let i = 0; i < prefixes.length; i++) {
    if (pathName.toString().startsWith(prefixes[i])) return prefixes[i];
  }
  return undefined;
}

const GetDirectories = async (path = '.') =>
  (await stat(path)).isDirectory() ? Promise.all(await readdir(path)).then(results => [].concat(...results)) : [];

async function AsyncForEach(array, callback) {
  let p = [];
  for (let index = 0; index < array.length; index++) {
    p.push(await callback(array[index], index, array));
  }
  await Promise.all(p);
}

Start();
