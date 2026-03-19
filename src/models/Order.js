import mongoose from 'mongoose';

// ─── OrderItem (nhúng trong Order) ───────────────────────────────────────────
// Mỗi món trong đơn có vòng đời riêng:
//   pending   → Bếp chưa nhận
//   confirmed → Bếp đã nhận, đang nấu
//   ready     → Nấu xong, chờ phục vụ ra đồ
//   served    → Phục vụ đã mang ra bàn
//   cancelled → Đã huỷ (chỉ khi còn pending)
const orderItemSchema = new mongoose.Schema(
  {
    menuItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MenuItem',
      required: true,
    },
    // Snapshot tên & giá tại thời điểm đặt — tránh sai nếu menu thay đổi sau
    name:  { type: String, required: true },
    price: { type: Number, required: true },

    quantity: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },
    note: {
      type: String,
      default: '',
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'ready', 'served', 'cancelled'],
      default: 'pending',
    },
    statusUpdatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true, _id: true }
);

orderItemSchema.set('toJSON', {
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

// ─── Order ────────────────────────────────────────────────────────────────────
// Mỗi lần khách ngồi vào bàn tạo 1 order, có thể thêm món nhiều lần
//   open   → Đang gọi món (khách vẫn thêm được)
//   closed → Đã khoá để xuất hoá đơn
//   paid   → Đã thanh toán xong
const orderSchema = new mongoose.Schema(
  {
    table: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Table',
      required: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    items: [orderItemSchema],

    status: {
      type: String,
      enum: ['open', 'closed', 'paid'],
      default: 'open',
    },
    // Tổng tiền tự tính lại mỗi lần save
    totalAmount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Tự tính totalAmount (bỏ qua các món đã cancelled)
orderSchema.pre('save', function (next) {
  this.totalAmount = this.items
    .filter((i) => i.status !== 'cancelled')
    .reduce((sum, i) => sum + i.price * i.quantity, 0);
  next();
});

orderSchema.set('toJSON', {
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export default mongoose.model('Order', orderSchema);