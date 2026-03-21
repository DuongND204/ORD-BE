import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const signToken = (user) =>
  jwt.sign(
    { id: user._id.toString(), role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

// ─── POST /api/auth/register ──────────────────────────────────────────────────
export const register = async (req, res) => {
  try {
    const { email, fullName, password, role } = req.body;

    if (!email || !fullName || !password) {
      return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin' });
    }

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(409).json({ message: 'Email đã được sử dụng' });
    }

    const user = new User({ email, fullName, password, role: role || 'customer' });
    await user.save();

    const token = signToken(user);
    return res.status(201).json({ token, user });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Vui lòng nhập email và mật khẩu' });
    }

    const user = await User.findOne({ email });
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng' });
    }

    const token = signToken(user);
    return res.json({ token, user });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────
// Client tự gửi token, decode lấy id rồi trả về thông tin user
export const getMe = async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Không có token' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng' });

    return res.json(user);
  } catch {
    return res.status(403).json({ message: 'Token không hợp lệ' });
  }
};