import mongoose from 'mongoose';

const tableSchema = new mongoose.Schema(
  {
    tableNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    // Tài khoản customer dành riêng cho bàn này để login
    account: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    capacity: {
      type: Number,
      default: 4,
    },
    // available → trống | occupied → đang dùng | reserved → đã đặt
    status: {
      type: String,
      enum: ['available', 'occupied', 'reserved'],
      default: 'available',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

tableSchema.set('toJSON', {
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export default mongoose.model('Table', tableSchema);