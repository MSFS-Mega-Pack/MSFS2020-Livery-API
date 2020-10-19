module.exports = {
  AllFiles: require('./AllFiles'),
  Feed: require('./Feed').FeedRouter,
  GetArticle: require('./Feed/GetArticle'),
  IsUpdateAvailable: require('./IsUpdateAvailable'),
  verifyClient: require('./verify'),
};
