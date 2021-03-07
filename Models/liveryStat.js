const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const liveryStatSchema = new Schema(
  {
    createdAt: Number,
    Livery: String,
    Date: Date,
  },
  {
    timestamps: {
      currentTime: () => Date.now(),
    },
  }
);

module.exports = mongoose.model('liverystat', liveryStatSchema);
