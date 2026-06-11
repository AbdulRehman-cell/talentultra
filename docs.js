const mongoose = require("mongoose");

const DocumentSchema =
  new mongoose.Schema({
    title: {
      type: String,
      required: true,
    },

    fileUrl: {
      type: String,
      required: true,
    },

    progress: {
      type: Number,
      default: 0,
    },

    status: {
      type: String,

      enum: [
        "PENDING",
        "IN_PROGRESS",
        "COMPLETED",
        "REJECTED",
      ],

      default: "PENDING",
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,

      ref: "User",

      required: true,
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },
  });

module.exports = mongoose.model(
  "Document",
  DocumentSchema
);

