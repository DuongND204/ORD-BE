import Order from '../models/Order.js';
import MenuItem from '../models/MenuItem.js';
import Table from '../models/Table.js';

// ─── GET /api/orders ──────────────────────────────────────────────────────────
// Bếp & phục vụ dùng — lấy tất cả orders đang open/closed
export const getAllActiveOrders = async (req, res) => {
  try {
    const orders = await Order.find({ status: { $in: ['open', 'closed'] } })
      .populate('table', 'tableNumber status')
      .populate('customer', 'fullName')
      .sort({ createdAt: -1 });
    return res.json(orders);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// ─── GET /api/orders/table/:tableId ──────────────────────────────────────────
// Khách xem order đang mở của bàn mình
export const getOrderByTable = async (req, res) => {
  try {
    const order = await Order.findOne({
      table: req.params.tableId,
      status: 'open',
    })
      .populate('table', 'tableNumber')
      .populate('items.menuItem', 'name price imageUrl');

    if (!order) return res.status(404).json({ message: 'Chưa có đơn hàng nào' });
    return res.json(order);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// ─── GET /api/orders/:id ──────────────────────────────────────────────────────
export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('table', 'tableNumber status')
      .populate('items.menuItem', 'name price');
    if (!order) return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    return res.json(order);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// ─── POST /api/orders/items ───────────────────────────────────────────────────
// Khách thêm món — nếu bàn chưa có order open thì tự tạo mới
// Body: { tableId, customerId, items: [{ menuItemId, quantity, note }] }
export const addItems = async (req, res) => {
  try {
    const { tableId, customerId, items } = req.body;

    if (!tableId || !items || items.length === 0) {
      return res.status(400).json({ message: 'Thiếu tableId hoặc danh sách món' });
    }

    // Kiểm tra bàn tồn tại
    const table = await Table.findById(tableId);
    if (!table || !table.isActive) {
      return res.status(404).json({ message: 'Không tìm thấy bàn' });
    }

    // Lấy thông tin & validate từng món từ DB
    const resolvedItems = await Promise.all(
      items.map(async (i) => {
        const mi = await MenuItem.findById(i.menuItemId);
        if (!mi)            throw new Error(`Không tìm thấy món: ${i.menuItemId}`);
        if (!mi.isAvailable) throw new Error(`Món "${mi.name}" tạm hết`);
        return {
          menuItem: mi._id,
          name:     mi.name,
          price:    mi.price,
          quantity: i.quantity || 1,
          note:     i.note || '',
          status:   'pending',
        };
      })
    );

    // Tìm order đang mở của bàn hoặc tạo mới
    let order = await Order.findOne({ table: tableId, status: 'open' });
    if (!order) {
      order = new Order({
        table:    tableId,
        customer: customerId || tableId, // fallback nếu không truyền customerId
        items:    [],
      });
      // Đánh dấu bàn occupied
      await Table.findByIdAndUpdate(tableId, { status: 'occupied' });
    }

    // Thêm các món vào order
    order.items.push(...resolvedItems);
    await order.save();

    await order.populate('table', 'tableNumber');

    // Emit Socket.IO thông báo bếp có món mới
    req.io.to('kitchen').emit('order:newItems', {
      orderId:     order.id,
      tableNumber: order.table.tableNumber,
      newItems:    resolvedItems.map((i) => ({
        name:     i.name,
        quantity: i.quantity,
        note:     i.note,
      })),
    });

    return res.status(201).json(order);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
};

// ─── PUT /api/orders/items/:itemId/status ────────────────────────────────────
// Bếp:     pending   → confirmed → ready
// Phục vụ: ready     → served
// Body: { orderId, status }
export const updateItemStatus = async (req, res) => {
  try {
    const { itemId }          = req.params;
    const { orderId, status } = req.body;

    const validStatuses = ['confirmed', 'ready', 'served', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        message: `Trạng thái không hợp lệ. Dùng: ${validStatuses.join(', ')}`,
      });
    }

    const order = await Order.findById(orderId).populate('table', 'tableNumber');
    if (!order) return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });

    const item = order.items.id(itemId);
    if (!item) return res.status(404).json({ message: 'Không tìm thấy món trong đơn' });

    item.status          = status;
    item.statusUpdatedAt = new Date();
    await order.save();

    const payload = {
      orderId:     order.id,
      tableNumber: order.table.tableNumber,
      tableId:     order.table.id,
      itemId,
      itemName:    item.name,
      status,
    };

    // Emit đúng room tuỳ trạng thái
    if (status === 'ready') {
      // Bếp xong → báo phục vụ + báo khách
      req.io.to('waiter').emit('order:itemReady', payload);
      req.io.to(`table_${order.table.id}`).emit('order:itemStatusChanged', payload);
    } else if (status === 'served') {
      // Phục vụ ra đồ → báo khách + báo bếp
      req.io.to(`table_${order.table.id}`).emit('order:itemStatusChanged', payload);
      req.io.to('kitchen').emit('order:itemStatusChanged', payload);
    } else {
      // confirmed / cancelled → báo khách
      req.io.to(`table_${order.table.id}`).emit('order:itemStatusChanged', payload);
    }

    return res.json({ item, order });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// ─── DELETE /api/orders/items/:itemId ────────────────────────────────────────
// Khách huỷ món — chỉ được huỷ khi còn pending
// Body: { orderId }
export const cancelItem = async (req, res) => {
  try {
    const { orderId } = req.body;
    const order = await Order.findById(orderId).populate('table', 'tableNumber');
    if (!order) return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });

    const item = order.items.id(req.params.itemId);
    if (!item) return res.status(404).json({ message: 'Không tìm thấy món' });

    if (item.status !== 'pending') {
      return res.status(400).json({ message: 'Chỉ có thể huỷ món khi bếp chưa nhận (pending)' });
    }

    item.status          = 'cancelled';
    item.statusUpdatedAt = new Date();
    await order.save();

    req.io.to('kitchen').emit('order:itemCancelled', {
      orderId:     order.id,
      tableNumber: order.table.tableNumber,
      itemId:      item.id,
      itemName:    item.name,
    });

    return res.json({ message: 'Đã huỷ món', order });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// ─── PUT /api/orders/:id/close ────────────────────────────────────────────────
// Khoá đơn để chuẩn bị xuất hoá đơn (phục vụ hoặc khách yêu cầu)
export const closeOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });

    if (order.status !== 'open') {
      return res.status(400).json({ message: `Đơn đang ở trạng thái "${order.status}", không thể khoá` });
    }

    order.status = 'closed';
    await order.save();

    return res.json(order);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};