const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },

  email: {
    type: String,
    required: true,
    unique: true,
  },

  password: {
    type: String,
    required: true,
  },

  referralCode: {
    type: String,
    unique: true,
  },

  referredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },

  referrals: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],

  createdAt: {
    type: Date,
    default: Date.now,
  },

  documents: {
  type: [
    {
      progress: {
        type: Number,
        default: 0,
      },

      title: {
        type: String,
        required: true,
      },

      filePath: {
        type: String,
        default: "",
      },

      status: {
        type: String,
        enum: ["pending", "processing", "completed"],
        default: "pending",
      },
    },
  ],

  default: [
    {
      title: "Passport",
      progress: 0,
      filePath: "",
      status: "pending",
    },
    {
      title: "NI Number",
      progress: 0,
      filePath: "",
      status: "pending",
    },
    {
      title: "Proof of Address",
      progress: 0,
      filePath: "",
      status: "pending",
    },
    {
      title:"Driving License",
      progress: 0,
      filePath: "",
      status: "pending",
    },
    {
      title: "Bank Statements",
      progress: 0,
      filePath: "",
      status: "pending",
    },
  ],
},
});

module.exports = mongoose.model(
  "User",
  UserSchema
);