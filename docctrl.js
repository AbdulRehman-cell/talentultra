const Document = require("./docs");

const getDocuments = async (req, res) => {
  try {
    const documents = await Document.find().sort({
      createdAt: -1,
    });

    res.json(documents);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch documents",
    });
  }
};

const uploadDocument = async (req, res) => {
  try {
    const file = req.file;

    const { title, userId } = req.body;

    if (!file) {
      return res.status(400).json({
        message: "No file uploaded",
      });
    }

    const document = await Document.create({
      title,

      fileUrl: file.path,

      userId,

      progress: 100,

      status: "COMPLETED",
    });

    res.status(201).json(document);
  } catch (error) {
    res.status(500).json({
      message: "Upload failed",
    });
  }
};

const updateDocumentProgress = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    const { progress } = req.body;

    const updated =
      await Document.findByIdAndUpdate(
        id,
        {
          progress,
        },
        {
          new: true,
        }
      );

    res.json(updated);
  } catch (error) {
    res.status(500).json({
      message: "Update failed",
    });
  }
};

module.exports = {
  getDocuments,
  uploadDocument,
  updateDocumentProgress,
};