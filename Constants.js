const env = process.env;

module.exports = Object.freeze({
  CACHE_TTL: 1000 * 60,
  GIT_RAW_URL: `https://raw.githubusercontent.com/${env.REPO_NAME}/master`,
  CACHE_ENABLED: true,
});
