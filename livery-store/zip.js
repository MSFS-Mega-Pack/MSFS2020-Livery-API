const archiver = require('archiver');
const zip = require('deterministic-zip');

const { readdir, stat, mkdir } = require('fs').promises;
const { createWriteStream, existsSync, unlinkSync } = require('fs');

const chalk = require('chalk');

const GetDirectories = async (path = '.') =>
  (await stat(path)).isDirectory() ? Promise.all(await readdir(path)).then(results => [].concat(...results)) : [];

async function Main() {
  await mkdir('./downloads', {
    recursive: true,
    mode: 0o755,
  });
  await mkdir('./public', {
    recursive: true,
    mode: 0o755,
  });

  const liveryPaths = await GetDirectories('./downloads');

  await AsyncForEach(liveryPaths, async (livDir, i) => {
    await mkdir(`./public/${livDir}`, {
      recursive: true,
      mode: 0o755,
    });
    const liveryPathsRaw = await GetDirectories(`./downloads/${livDir}`);
    await AsyncForEach(liveryPathsRaw, async (livDirRaw, index) => {
      return new Promise(fulfil => {
        let archive = archiver('zip', {
          zlib: {
            level: 9,
            memLevel: 9,
          }, // Sets the compression level.
        });
        console.log(chalk.grey.bold('='.repeat(60)));
        console.log(chalk.blue.bold(CenterText(`Zipping livery (${index + 1} of ${liveryPathsRaw.length})`)));
        console.log(chalk.whiteBright(CenterText(`${livDirRaw}.zip`)));
        console.log();

        if (existsSync(`public/${livDir}/${livDirRaw}.zip`)) {
          console.log(chalk.red.bold(CenterText('Archive already exists! Deleting...')));
          unlinkSync(`public/${livDir}/${livDirRaw}.zip`);
          console.log(chalk.red.bold(CenterText('Deleted.')));
          console.log();
        }

        console.log(chalk.bold(CenterText('Creating file stream...')));
        const output = createWriteStream(`public/${livDir}/${livDirRaw}.zip`, {
          autoClose: true,
        });
        archive.pipe(output);

        console.log(chalk.bold(CenterText('Archiving...')));
        console.log(chalk.grey(CenterText('This might take a while...')));
        archive.directory(`downloads/${livDir}/${livDirRaw}`, false).finalize();
        output.on('finish', () => {
          fulfil();
        });



        // zip(
        //   `downloads/${livDir}/${livDirRaw}`,
        //   `public/${livDir}/${livDirRaw}.zip`,
        //   { includes: ['./**'], cwd: `downloads/${livDir}/${livDirRaw}` },
        //   err => {
        //     fulfil();
        //   }
        // );
      });
    });
  });

  console.log(chalk.grey.bold('='.repeat(60)));
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
async function AsyncForEach(array, callback) {
  let p = [];
  for (let index = 0; index < array.length; index++) {
    p.push(await callback(array[index], index, array));
  }
  await Promise.all(p);
}

function CenterText(text, width = 60) {
  const pad = (width - text.length) / 2;
  return `${' '.repeat(Math.floor(pad))}${text}${' '.repeat(Math.ceil(pad))}`;
}

Main();
