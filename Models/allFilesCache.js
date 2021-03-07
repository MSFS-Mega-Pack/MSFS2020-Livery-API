const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const AllFilesCacheSchema = new Schema(
  {
    createdAt: Number,
    validTill: Number,
    Data: Object,
  },
  {
    timestamps: {
      currentTime: () => Date.now(),
    },
  }
);

module.exports = mongoose.model('allFilesCache', AllFilesCacheSchema);
