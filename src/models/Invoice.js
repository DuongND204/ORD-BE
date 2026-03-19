import mongoose from 'mongoose';

const invoiceSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      unique: true, // 1 order chỉ có 1 hoá đơn
    },
    table: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Table',
      required: true,
    },
    // Snapshot danh sách món tại thời điểm xuất hoá đơn
    items: [
      {
        name:     { type: String },
        quantity: { type: Number },
        price:    { type: Number },
        subtotal: { type: Number },
      },
    ],
    subtotal:       { type: Number, required: true },  // tổng trước giảm giá/thuế
    discountAmount: { type: Number, default: 0 },
    taxRate:        { type: Number, default: 0 },       // VD: 0.08 = 8%
    taxAmount:      { type: Number, default: 0 },
    totalAmount:    { type: Number, required: true },   // tổng cuối cùng

    // pending → chưa thanh toán | paid → đã thanh toán
    status: {
      type: String,
      enum: ['pending', 'paid'],
      default: 'pending',
    },
    paidAt: {
      type: Date,
      default: null,
    },
    // URL ảnh QR thanh toán — admin đẩy lên sau qua PUT /api/invoices/:id/qr
    qrImageUrl: {
      type: String,
      default: null,
    },
    note: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

invoiceSchema.set('toJSON', {
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export default mongoose.model('Invoice', invoiceSchema);