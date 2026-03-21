import Table from '../models/Table.js';
import User from '../models/User.js';

// ─── GET /api/tables ──────────────────────────────────────────────────────────
export const getAllTables = async (req, res) => {
  try {
    const tables = await Table.find({ isActive: true })
      .populate('account', 'email fullName role')
      .sort({ tableNumber: 1 });
    return res.json(tables);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// ─── GET /api/tables/:id ──────────────────────────────────────────────────────
export const getTableById = async (req, res) => {
  try {
    const table = await Table.findById(req.params.id)
      .populate('account', 'email fullName');
    if (!table) return res.status(404).json({ message: 'Không tìm thấy bàn' });
    return res.json(table);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// ─── POST /api/tables ─────────────────────────────────────────────────────────
// Tạo bàn đồng thời tạo tài khoản customer cho bàn đó
export const createTable = async (req, res) => {
  try {
    const { tableNumber, capacity, email, password } = req.body;

    if (!tableNumber || !email || !password) {
      return res.status(400).json({ message: 'Thiếu tableNumber, email hoặc password' });
    }

    // Tạo tài khoản bàn
    const account = new User({
      email,
      fullName: `Bàn ${tableNumber}`,
      password,
      role: 'customer',
    });
    await account.save();

    const table = new Table({
      tableNumber,
      capacity: capacity || 4,
      account: account._id,
    });
    await table.save();

    await table.populate('account', 'email fullName');
    return res.status(201).json(table);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'Số bàn hoặc email đã tồn tại' });
    }
    return res.status(500).json({ message: err.message });
  }
};

// ─── PUT /api/tables/:id ──────────────────────────────────────────────────────
export const updateTable = async (req, res) => {
  try {
    const table = await Table.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('account', 'email fullName');
    if (!table) return res.status(404).json({ message: 'Không tìm thấy bàn' });
    return res.json(table);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// ─── PUT /api/tables/:id/status ───────────────────────────────────────────────
export const updateTableStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['available', 'occupied', 'reserved'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: `Trạng thái không hợp lệ. Dùng: ${validStatuses.join(', ')}` });
    }

    const table = await Table.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate('account', 'email fullName');
    if (!table) return res.status(404).json({ message: 'Không tìm thấy bàn' });

    // Thông báo real-time cho tất cả client
    req.io.emit('table:statusUpdated', { tableId: table.id, status: table.status });
    return res.json(table);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// ─── DELETE /api/tables/:id ───────────────────────────────────────────────────
// Soft delete — chỉ ẩn, không xoá thật
export const deleteTable = async (req, res) => {
  try {
    const table = await Table.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!table) return res.status(404).json({ message: 'Không tìm thấy bàn' });
    return res.json({ message: 'Đã xoá bàn thành công' });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};