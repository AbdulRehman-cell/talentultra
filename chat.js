const express = require("express");

const cors = require("cors");

const cloudinary = require("./cloudinary");

const Shift = require("./Shift");


const { nanoid } = require("nanoid");




const app = express();

const jwt = require("jsonwebtoken");

const JWT_SECRET = "super-secret-jwt-key";


// ======================
// DATABASE
// ======================



// ======================
// MODELS
// ======================

const User = require("./user");

const Message = require("./chats");

const Document = require("./docs");

const upload = require("./multer");


// ======================
// MIDDLEWARE
// =====
  app.use(
  cors({
    origin: "https://jobpal--ho4qyappsi.expo.app",
    credentials: true,
  })
);

app.use(express.json());






// ======================
// AUTH MIDDLEWARE
// ======================
function isAuthenticated(
  req,
  res,
  next
) {
  const authHeader =
    req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      error: "No token provided",
    });
  }

  const token =
    authHeader.split(" ")[1];

  try {
    const decoded =
      jwt.verify(
        token,
        JWT_SECRET
      );

    req.user = decoded;

    next();
  } catch (err) {
    return res.status(401).json({
      error: "Invalid token",
    });
  }
}


app.get(
  "/shifts",
  isAuthenticated,
  async (req, res) => {
    try {
      const shifts =
        await Shift.find({
          userId: req.user.id,
        }).sort({
          date: 1,
        });

      res.json(shifts);
    } catch (err) {
      console.log(err);

      res.status(500).json({
        error:
          "Failed to fetch shifts",
      });
    }
  }
);

app.post(
  "/shifts",
  isAuthenticated,
  async (req, res) => {
    try {
      const {
        userId,
        company,
        jobTitle,
        location,
        date,
        startTime,
        endTime,
      } = req.body;

      const shift =
        await Shift.create({
          userId,
          company,
          jobTitle,
          location,
          date,
          startTime,
          endTime,
        });

      res.json(shift);
    } catch (err) {
      console.log(err);

      res.status(500).json({
        error:
          "Failed to create shift",
      });
    }
  }
);

// ======================
// HEALTH CHECK
// ======================

app.get("/", (req, res) => {
  res.json({
    message: "Chat Server Running",
  });
});



// ======================
// SIGNUP
// ======================
app.post("/signup", async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      referralCode,
    } = req.body;

    const existing =
      await User.findOne({ email });

    if (existing) {
      return res.status(400).json({
        error: "User already exists",
      });
    }

    let referrer = null;

    if (referralCode) {
      referrer = await User.findOne({
        referralCode,
      });

      if (!referrer) {
        return res.status(400).json({
          error: "Invalid referral code",
        });
      }
    }

    const hashed =
      await bcrypt.hash(password, 10);

    const myReferralCode =
      nanoid(8).toUpperCase();

    const user = await User.create({
      name,
      email,
      password: hashed,
      referralCode: myReferralCode,
      referredBy: referrer?._id || null,
    });

    if (referrer) {
      await User.findByIdAndUpdate(
        referrer._id,
        {
          $push: {
            referrals: user._id,
          },
        }
      );
    }

    res.json({
      message: "Signup successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        referralCode:
          user.referralCode,
      },
    });
  } catch (err) {
    console.log(err);

    res.status(500).json({
      error: "Signup failed",
    });
  }
});

// ======================
// LOGIN
// ======================
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        error: "Invalid credentials",
      });
    }

    const isMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!isMatch) {
      return res.status(400).json({
        error: "Invalid credentials",
      });
    }

    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
      },
      JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (err) {
    console.log(err);

    res.status(500).json({
      error: "Login failed",
    });
  }
});
// ======================
// LOGOUT
// ======================

app.get("/logout", (req, res) => {
  req.logout(() => {
    res.json({
      message: "Logged out",
    });
  });
});


// ======================
// GET MESSAGES
// ======================

app.get(
  "/messages/:chatId",
  isAuthenticated,


  async (req, res) => {
    try {
      const messages =
        await Message.find({
          chatId: req.params.chatId,
        }).sort({ createdAt: 1 });

      res.json(messages);
    } catch (err) {
      console.log(err);

      res.status(500).json({
        error:
          "Failed to fetch messages",
      });
    }
  }
);


// ======================
// COMPANY CHATS
// ======================

app.get(
  "/company-chats/:id",

isAuthenticated,

  async (req, res) => {
    try {
      const chats =
        await Message.aggregate([
          {
            $match: {
              chatId: req.params.id,
            },
          },

          {
            $sort: {
              createdAt: -1,
            },
          },

          {
            $group: {
              _id: "$chatId",

              lastMessage: {
                $first: "$text",
              },

              createdAt: {
                $first: "$createdAt",
              },

              userId: {
                $first: "$userId",
              },
            },
          },
        ]);

      res.json(chats);
    } catch (err) {
      console.log(err);

      res.status(500).json({
        error:
          "Failed to fetch chats",
      });
    }
  }
);


// ======================
// SEND MESSAGE
// ======================

app.post(
  "/messages",

    isAuthenticated,

  async (req, res) => {
    try {
      const {
        companyId,
        sender,
        text,
      } = req.body;

      let chatId = companyId;

      

      
      if (
        !companyId ||
        !sender ||
        !text
      ) {
        return res.status(400).json({
          error: "Missing fields",
        });
      }

      const newMessage =
        await Message.create({
          chatId,
          companyId,
          sender,
          text,
        });

      res.json(newMessage);
    } catch (err) {
      console.log(err);

      res.status(500).json({
        error:
          "Failed to send message",
      });
    }
  }
);


// ======================
// GET DOCUMENTS
// ======================
app.get("/documents", isAuthenticated, async (req, res) => {
  
  try {

    const user = await User.findById(req.user.id).select("documents");

    if (!user) {
      return res.status(404).json({

        error: "User not found",

      });

    }

    console.log(user.documents);

    // return ONLY documents array (frontend expects this)
    res.json(user.documents);
  } catch (err) {
    console.log(err);
    res.status(500).json({
      error: "Failed to fetch documents",
    });
  }
});

// ======================

// UPLOAD DOCUMENT

// ======================
app.post(
  "/documents",
  isAuthenticated,
  upload.single("document"),
  async (req, res) => {
    try {
      const file = req.file;
      const { title, id } = req.body;

      if (!file) {
        return res.status(400).json({
          error: "No file uploaded",
        });
      }

      // 🔥 1. Upload file to Cloudinary FIRST
      const result = await cloudinary.uploader.upload(file.path, {
        folder: "jobpal_docs",
        resource_type: "auto",
      });

      // 🔥 2. Delete local temp file (important)
      const fs = require("fs");
      fs.unlinkSync(file.path);

      const fileUrl = result.secure_url; // ✅ real Cloudinary URL

      // 🔥 3. Keep your original update logic
      const updatedUser = await User.findOneAndUpdate(
        {
          _id: req.user.id,
          "documents._id": id,
        },
        {
          $set: {
            "documents.$.title": title,
            "documents.$.filePath": fileUrl,
            "documents.$.status": "completed",
            "documents.$.progress": 100,
          },
        },
        { new: true }
      );

      res.json(updatedUser);
    } catch (err) {
      console.log(err);
      res.status(500).json({ error: "Upload failed" });
    }
  }
);// UPDATE DOCUMENT PROGRESS

// ======================

app.patch(
  "/documents/:id/progress",

  isAuthenticated,

  async (req, res) => {
    try {
      
      const { progress } = req.body;

      const updated =
        await Document.findByIdAndUpdate(
          req.params.id,
          {
            progress,

            status:
              progress === 100
                ? "COMPLETED"
                : "PENDING",
          },

          {
            new: true,
          }
        );

      res.json(updated);
    } catch (err) {
      console.log(err);

      res.status(500).json({
        error:
          "Failed to update progress",
      });
    }
  }
);


// ======================
// START SERVER
// ======================

const PORT = 3000;

app.listen(PORT, () => {
  console.log(
    `Server running on port ${PORT}`
  );
});

