import Invoice from '../models/Invoice.js';
import Order from '../models/Order.js';
import Table from '../models/Table.js';

// ─── POST /api/invoices/generate ─────────────────────────────────────────────
// Tạo hoá đơn từ 1 order. Nếu hoá đơn đã tồn tại thì trả về cái cũ.
// Body: { orderId, taxRate?, discountAmount?, qrImageUrl?, note? }
export const generateInvoice = async (req, res) => {
  try {
    const { orderId, taxRate = 0, discountAmount = 0, qrImageUrl = null, note = '' } = req.body;

    if (!orderId) return res.status(400).json({ message: 'Thiếu orderId' });

    const order = await Order.findById(orderId).populate('table');
    if (!order) return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    if (order.status === 'paid') {
      return res.status(400).json({ message: 'Đơn hàng đã thanh toán rồi' });
    }

    // Khoá đơn nếu vẫn còn open
    if (order.status === 'open') {
      order.status = 'closed';
      await order.save();
    }

    // Nếu hoá đơn đã tồn tại thì trả về luôn
    const existing = await Invoice.findOne({ order: orderId })
      .populate('table', 'tableNumber');
    if (existing) return res.json(existing);

    // Snapshot các món (bỏ cancelled)
    const snapshotItems = order.items
      .filter((i) => i.status !== 'cancelled')
      .map((i) => ({
        name:     i.name,
        quantity: i.quantity,
        price:    i.price,
        subtotal: i.price * i.quantity,
      }));

    const subtotal    = snapshotItems.reduce((s, i) => s + i.subtotal, 0);
    const taxAmount   = Math.round(subtotal * taxRate);
    const totalAmount = subtotal + taxAmount - discountAmount;

    const invoice = new Invoice({
      order:          order._id,
      table:          order.table._id,
      items:          snapshotItems,
      subtotal,
      discountAmount,
      taxRate,
      taxAmount,
      totalAmount,
      qrImageUrl,
      note,
    });
    await invoice.save();
    await invoice.populate('table', 'tableNumber');

    // Báo khách có hoá đơn
    req.io.to(`table_${order.table._id}`).emit('invoice:generated', {
      invoiceId:   invoice.id,
      totalAmount: invoice.totalAmount,
    });

    return res.status(201).json(invoice);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// ─── GET /api/invoices/order/:orderId ─────────────────────────────────────────
export const getInvoiceByOrder = async (req, res) => {
  try {
    const invoice = await Invoice.findOne({ order: req.params.orderId })
      .populate('table', 'tableNumber')
      .populate('order', 'createdAt status');
    if (!invoice) return res.status(404).json({ message: 'Chưa có hoá đơn cho đơn này' });
    return res.json(invoice);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// ─── GET /api/invoices/:id ────────────────────────────────────────────────────
export const getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('table', 'tableNumber')
      .populate('order', 'createdAt status');
    if (!invoice) return res.status(404).json({ message: 'Không tìm thấy hoá đơn' });
    return res.json(invoice);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// ─── PUT /api/invoices/:id/pay ────────────────────────────────────────────────
// Xác nhận thanh toán → cập nhật order & giải phóng bàn
export const markAsPaid = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ message: 'Không tìm thấy hoá đơn' });
    if (invoice.status === 'paid') {
      return res.status(400).json({ message: 'Hoá đơn đã được thanh toán rồi' });
    }

    invoice.status = 'paid';
    invoice.paidAt = new Date();
    await invoice.save();

    // Cập nhật order → paid
    await Order.findByIdAndUpdate(invoice.order, { status: 'paid' });

    // Giải phóng bàn → available
    await Table.findByIdAndUpdate(invoice.table, { status: 'available' });

    // Thông báo real-time
    req.io.to(`table_${invoice.table}`).emit('invoice:paid', { invoiceId: invoice.id });
    req.io.emit('table:statusUpdated', {
      tableId: invoice.table.toString(),
      status:  'available',
    });

    await invoice.populate('table', 'tableNumber');
    return res.json(invoice);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// ─── PUT /api/invoices/:id/qr ─────────────────────────────────────────────────
// Admin đẩy ảnh QR thanh toán lên sau
// Body: { qrImageUrl }
export const updateQR = async (req, res) => {
  try {
    const { qrImageUrl } = req.body;
    if (!qrImageUrl) return res.status(400).json({ message: 'Thiếu qrImageUrl' });

    const invoice = await Invoice.findByIdAndUpdate(
      req.params.id,
      { qrImageUrl },
      { new: true }
    ).populate('table', 'tableNumber');
    if (!invoice) return res.status(404).json({ message: 'Không tìm thấy hoá đơn' });

    // Báo khách QR đã có
    req.io.to(`table_${invoice.table.id}`).emit('invoice:qrUpdated', {
      invoiceId:  invoice.id,
      qrImageUrl: invoice.qrImageUrl,
    });

    return res.json(invoice);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};