import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

import connectDB from './config/db.js';
import initSocket from './socket/index.js';

import authRoutes    from './routes/authRoutes.js';
import tableRoutes   from './routes/tableRoutes.js';
import menuRoutes    from './routes/menuRoutes.js';
import orderRoutes   from './routes/orderRoutes.js';
import invoiceRoutes from './routes/invoiceRoutes.js';

// ── Kết nối MongoDB ───────────────────────────────────────────────────────────
await connectDB();

// ── Express ───────────────────────────────────────────────────────────────────
const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── HTTP Server + Socket.IO ───────────────────────────────────────────────────
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*' },
  transports: ['websocket', 'polling'],
});

initSocket(io);

// ── Gắn io vào req để tất cả controllers dùng req.io.emit(...) ───────────────
app.use((_req, _res, next) => {
  _req.io = io;
  next();
});

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth',     authRoutes);
app.use('/api/tables',   tableRoutes);
app.use('/api/menu',     menuRoutes);
app.use('/api/orders',   orderRoutes);
app.use('/api/invoices', invoiceRoutes);

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (_req, res) =>
  res.json({ status: 'ok', time: new Date().toISOString() })
);

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((_req, res) =>
  res.status(404).json({ message: 'Route không tồn tại' })
);

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('❌ Unhandled error:', err);
  res.status(500).json({ message: 'Lỗi server', error: err.message });
});

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`🚀 Server running  → http://localhost:${PORT}`);
  console.log(`📡 Socket.IO ready → ws://localhost:${PORT}`);
  console.log(`❤️  Health check   → http://localhost:${PORT}/health`);
});