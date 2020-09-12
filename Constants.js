const env = process.env;

module.exports = Object.freeze({
  API_VERSION: 'preview',
  CACHE_TTL: 1000 * 60 * 5,
  GIT_RAW_URL: `https://raw.githubusercontent.com/MSFS-Mega-Pack/MSFS2020-livery-sources/master`,
  CACHE_ENABLED: true,
  CDN_URL: `https://msfs-liverypack-cdn.mrproper.dev`,
});
