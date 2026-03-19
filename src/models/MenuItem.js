import mongoose from 'mongoose';

const menuItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    // VD: 'Khai vị', 'Món chính', 'Tráng miệng', 'Đồ uống'
    category: {
      type: String,
      required: true,
      trim: true,
    },
    imageUrl: {
      type: String,
      default: null,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    // Thời gian chuẩn bị ước tính (phút) — hiển thị cho khách
    prepTimeMinutes: {
      type: Number,
      default: 15,
    },
  },
  { timestamps: true }
);

menuItemSchema.set('toJSON', {
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export default mongoose.model('MenuItem', menuItemSchema);