const { default: fetch } = require('node-fetch');
const Log = require('../../logger');

module.exports = GetLatestVersion;

async function GetLatestVersion() {
  const res = await fetch(`https://api.github.com/repos/MSFS-Mega-Pack/MSFS2020-livery-manager/releases/latest`);

  let res1 = res.clone();

  if (res1.status !== 200) {
    Log('Failed to fetch latest version JSON', Log.SEVERITY.ERROR);
    return null;
  }

  const jsonRelease = await res1.json();

  return {
    latest: jsonRelease.tag_name.substr(1), // get version without "v" at the start
    downloadUrl: jsonRelease.assets.filter(asset => asset.name.endsWith('.exe'))[0].browser_download_url,
    date: jsonRelease.published_at,
  };
}
