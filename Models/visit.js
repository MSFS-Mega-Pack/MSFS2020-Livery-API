const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const visitSchema = new Schema(
  {
    createdAt: Number,
    UUID: String,
  },
  {
    timestamps: {
      currentTime: () => Date.now(),
    },
  }
);

module.exports = mongoose.model('visit', visitSchema);
