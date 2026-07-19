/**
 * models/Message.model.js
 * Direct-message schema for 1-to-1 conversations.
 * Media URLs are stored from Cloudinary.
 */

const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
      index:    true,
    },

    receiver: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
      index:    true,
    },

    message: {
      type:      String,
      trim:      true,
      maxlength: [2000, 'Message must be at most 2000 characters.'],
      default:   '',
    },

    media: {
      url:          { type: String, default: '' },
      publicId:     { type: String, default: '' },
      resourceType: { type: String, enum: ['image', 'video', 'raw'], default: 'image' },
    },

    // Delivery / read receipts
    delivered: { type: Boolean, default: false },
    read:      { type: Boolean, default: false },
    readAt:    { type: Date },

    // E2E Encryption fields
    isEncrypted: { type: Boolean, default: false },
    encryptedEnvelope: {
      header: {
        ephemeralPubKey: { type: String, default: '' },
        prevChainLength: { type: Number, default: 0 },
        messageNum:      { type: Number, default: 0 },
      },
      ciphertext:   { type: String, default: '' },
      nonce:        { type: String, default: '' },
      mac:          { type: String, default: '' },
      isEncrypted:  { type: Boolean, default: false },
    },

    // Soft delete per-side
    deletedBySender:   { type: Boolean, default: false },
    deletedByReceiver: { type: Boolean, default: false },
  },
  {
    timestamps: true, // createdAt = sent time
  }
);

// ── Compound indexes ──────────────────────────────────────────────────
// Fetch conversation between two users (either direction), newest last
messageSchema.index({ sender: 1, receiver: 1, createdAt: 1 });
messageSchema.index({ receiver: 1, sender: 1, createdAt: 1 });
// Unread count for a receiver
messageSchema.index({ receiver: 1, read: 1 });

const Message = mongoose.model('Message', messageSchema);
module.exports = Message;
