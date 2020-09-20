const simpleGit = require('simple-git');
const git = simpleGit('./liverypackDownloads');
const fs = require('fs').promises;

fs.mkdir('./liverypackDownloads', {
  recursive: true,
  mode: 0o755,
});
git.init()
  .then(function onInit(initResult) {
    console.log(initResult)
    if (!initResult.existing) {
      git.addRemote('master', 'https://github.com/MSFS-Mega-Pack/MSFS2020-livery-megapack.git', '--depth 1');
    }
  })
  .then(() => git.fetch())
  .then(() => git.pull('master', 'master', '--depth 1', function (err, update) {
    if (update && update.summary.changes) {
      console.log(update)
    }
  }))
  .catch(err => console.error(err));