const { default: fetch } = require('node-fetch');
const Log = require('../../logger');

module.exports = GetLatestVersion;

async function GetLatestVersion() {
  const maxVersionRes = await fetch('https://liveriesmegapack.b-cdn.net/current_version.txt', {
    headers: {
      'Cache-Control': 'no-cache'
    }
  });
  const res = await fetch('https://api.github.com/repos/MSFS-Mega-Pack/MSFS2020-livery-manager/releases/latest');

  let res1 = res.clone();

  if (!res1.ok) {
    Log('Failed to fetch latest version JSON', Log.SEVERITY.ERROR);
    return null;
  }

  let maxVersion = '9999.0.0';

  if (!maxVersionRes.ok) {
    Log(
      "Failed to fetch latest allowed version from Clink's CDN. We will assume that we can update to the latest version.",
      Log.SEVERITY.WARNING
    );
  } else {
    maxVersion = await maxVersionRes.text();
  }

  const jsonRelease = await res1.json();

  return {
    latestAllowed: maxVersion,
    latestAllowedStatusCode: res1.status,
    latest: jsonRelease.tag_name.substr(1), // get version without "v" at the start
    downloadUrl: jsonRelease.assets.filter(asset => asset.name.endsWith('.exe'))[0].browser_download_url,
    date: jsonRelease.published_at,
    size: jsonRelease.assets.filter(asset => asset.name.endsWith('.exe'))[0].size,
  };
}
