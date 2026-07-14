import mongoose from 'mongoose';

const ChunkSchema = new mongoose.Schema(
  {
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document',
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
    pageNumber: {
      type: Number,
      required: true,
    },
    embedding: {
      type: [Number], // Vector embeddings array
      required: true,
    },
  },
  { timestamps: true }
);

ChunkSchema.index({ documentId: 1 });

export default mongoose.models.Chunk || mongoose.model('Chunk', ChunkSchema);
