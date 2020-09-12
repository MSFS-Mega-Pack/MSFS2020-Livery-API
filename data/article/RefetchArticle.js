const { default: fetch } = require('node-fetch');
const Log = require('../../logger');
const { GIT_RAW_URL } = require('../../Constants');

module.exports = RefetchArticle;

async function RefetchArticle(name) {
  const res = await fetch(`${GIT_RAW_URL}/home-feed/updates/${encodeURI(name)}.md`);

  let res1 = res.clone();

  if (res1.status !== 200) {
    Log('Failed to fetch article', Log.SEVERITY.ERROR);
    return null;
  }

  return await res1.text();
}
