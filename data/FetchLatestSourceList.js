const { default: fetch } = require('node-fetch');
const Log = require('../logger');
const { GIT_RAW_URL } = require('../Constants');

module.exports = FetchLatestSourceList;

async function FetchLatestSourceList() {
  console.log(`${GIT_RAW_URL}/sources.json`);

  const res = await fetch(`${GIT_RAW_URL}/sources.json`);

  let res1 = res.clone();

  if (res1.status !== 200) {
    Log('Failed to fetch source list', Log.SEVERITY.ERROR);
    return null;
  }

  return await res1.json();
}
