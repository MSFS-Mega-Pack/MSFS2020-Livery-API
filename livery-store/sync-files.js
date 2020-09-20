const simpleGit = require('simple-git');
const git = simpleGit('./liverypackDownloads');

git.init()
  .then(function onInit(initResult) {
    console.log(initResult)
    if (!initResult.existing) {
      git.addRemote('master', 'https://github.com/MSFS-Mega-Pack/MSFS2020-livery-templates.git', '--depth 1');
    }
  })
  .then(() => git.fetch())
  .then(() => git.pull('master', 'master', '--depth 1', function (err, update) {
    if (update && update.summary.changes) {
      console.log(update)
    }
  }))
  .catch(err => console.error(err));
  