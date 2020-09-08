const archiver = require('archiver');

const { readdir, stat, mkdir, unlink } = require('fs').promises;
const { createWriteStream, existsSync, unlinkSync } = require('fs');

const chalk = require('chalk');

const GetDirectories = async (path = '.') =>
  (await stat(path)).isDirectory() ? Promise.all(await readdir(path)).then(results => [].concat(...results)) : [];

async function Main() {
  await mkdir('./downloads', { recursive: true, mode: 0o755 });
  await mkdir('./public', { recursive: true, mode: 0o755 });

  const liveryPaths = await GetDirectories('./downloads');

  await AsyncForEach(liveryPaths, async (livDir, i) => {
    return new Promise(fulfil => {
      let archive = archiver('zip', {
        zlib: { level: 9 }, // Sets the compression level.
      });

      console.log(chalk.grey.bold('='.repeat(60)));
      console.log(chalk.blue.bold(CenterText(`Zipping livery (${i + 1} of ${liveryPaths.length})`)));
      console.log(chalk.whiteBright(CenterText(`${livDir}.zip`)));
      console.log();

      if (existsSync(`public/${livDir}.zip`)) {
        console.log(chalk.red.bold(CenterText('Archive already exists! Deleting...')));
        unlinkSync(`public/${livDir}.zip`);
        console.log(chalk.red.bold(CenterText('Deleted.')));
        console.log();
      }

      console.log(chalk.bold(CenterText('Creating file stream...')));

      const output = createWriteStream(`public/${livDir}.zip`, { autoClose: true });
      archive.pipe(output);

      console.log(chalk.bold(CenterText('Archiving...')));
      console.log(chalk.grey(CenterText('This might take a while...')));

      archive.directory(`downloads/${livDir}`, false).finalize();

      output.on('finish', () => {
        fulfil();
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
