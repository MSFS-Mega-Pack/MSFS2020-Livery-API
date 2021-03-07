const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const LiverySchema = new Schema(
  {
    airplane: String,
    fileName: String,
    generation: String,
    size: String,
    checkSum: String,
    image: String,
    smallImage: String,
  },
  {
    timestamps: {
      currentTime: () => Date.now(),
    },
  }
);

module.exports = mongoose.model('Livery', LiverySchema);
