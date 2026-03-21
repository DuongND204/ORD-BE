import MenuItem from '../models/MenuItem.js';

// ─── GET /api/menu ────────────────────────────────────────────────────────────
// Query params: ?category=Khai vị  &available=true
export const getAllMenuItems = async (req, res) => {
  try {
    const filter = {};
    if (req.query.category)   filter.category    = req.query.category;
    if (req.query.available !== undefined) {
      filter.isAvailable = req.query.available === 'true';
    }
    const items = await MenuItem.find(filter).sort({ category: 1, name: 1 });
    return res.json(items);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// ─── GET /api/menu/categories ─────────────────────────────────────────────────
export const getCategories = async (req, res) => {
  try {
    const categories = await MenuItem.distinct('category');
    return res.json(categories.sort());
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// ─── GET /api/menu/:id ────────────────────────────────────────────────────────
export const getMenuItemById = async (req, res) => {
  try {
    const item = await MenuItem.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Không tìm thấy món' });
    return res.json(item);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// ─── POST /api/menu ───────────────────────────────────────────────────────────
export const createMenuItem = async (req, res) => {
  try {
    const { name, price, category } = req.body;
    if (!name || !price || !category) {
      return res.status(400).json({ message: 'Thiếu name, price hoặc category' });
    }
    const item = new MenuItem(req.body);
    await item.save();
    return res.status(201).json(item);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// ─── PUT /api/menu/:id ────────────────────────────────────────────────────────
export const updateMenuItem = async (req, res) => {
  try {
    const item = await MenuItem.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!item) return res.status(404).json({ message: 'Không tìm thấy món' });
    return res.json(item);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// ─── DELETE /api/menu/:id ─────────────────────────────────────────────────────
// Soft delete — chỉ ẩn khỏi menu, không xoá thật để giữ lịch sử order
export const deleteMenuItem = async (req, res) => {
  try {
    const item = await MenuItem.findByIdAndUpdate(
      req.params.id,
      { isAvailable: false },
      { new: true }
    );
    if (!item) return res.status(404).json({ message: 'Không tìm thấy món' });
    return res.json({ message: 'Đã ẩn món khỏi thực đơn' });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};