const { default: fetch } = require('node-fetch');
const Log = require('../../logger');
const { GIT_RAW_URL } = require('../../Constants');

module.exports = RefetchPack;

async function RefetchPack(name) {
  const res = await fetch(`${GIT_RAW_URL}/sub-packs/packs/${encodeURI(name)}.json`);

  let res1 = res.clone();

  if (res1.status !== 200) {
    Log('Failed to fetch pack', Log.SEVERITY.ERROR);
    return null;
  }

  return await res1.text();
}
