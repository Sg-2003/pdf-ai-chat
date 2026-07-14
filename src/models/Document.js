import mongoose from 'mongoose';

const DocumentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    filename: {
      type: String,
      required: true,
    },
    filePath: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
    },
    chunkCount: {
      type: Number,
      default: 0,
    },
    pdfData: {
      type: Buffer,
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.models.Document || mongoose.model('Document', DocumentSchema);
