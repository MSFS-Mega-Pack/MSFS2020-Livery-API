const { default: fetch } = require('node-fetch');
const Log = require('../../logger');
const { GIT_RAW_URL } = require('../../Constants');

module.exports = FetchLatestFeed;

async function FetchLatestFeed() {
  const res = await fetch(`${GIT_RAW_URL}/home-feed/feed.json`);

  let res1 = res.clone();

  if (res1.status !== 200) {
    Log('Failed to fetch feed', Log.SEVERITY.ERROR);
    return null;
  }

  return await res1.json();
}
