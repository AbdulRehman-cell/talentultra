const mongoose = require("mongoose");

const dns = require("dns");

dns.setServers([
  "8.8.8.8",
  "8.8.4.4",
]);

mongoose.connect(
  "mongodb+srv://abdulrehmanishaque32_db_user:jb@cluster0.awr5zei.mongodb.net/chatdb?retryWrites=true&w=majority"
);

const MessageSchema = new mongoose.Schema(
  {
    chatId: {
      type: String,
      required: true,
    },

    companyId: {
      type: String,
      required: true,
    },

    sender: {
      type: String,
      required: true,
    },

    text: {
      type: String,
      required: true,
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },
  }
);

module.exports = mongoose.model(
  "Message",
  MessageSchema
);