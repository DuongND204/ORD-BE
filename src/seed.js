/**
 * Seed dữ liệu mẫu để test
 * Chạy: npm run seed
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from './config/db.js';
import User     from './models/User.js';
import Table    from './models/Table.js';
import MenuItem from './models/MenuItem.js';

await connectDB();

// ── Xoá sạch dữ liệu cũ ──────────────────────────────────────────────────────
await Promise.all([
  User.deleteMany({}),
  Table.deleteMany({}),
  MenuItem.deleteMany({}),
]);
console.log('🗑  Đã xoá dữ liệu cũ\n');

// ── Tài khoản nhân viên ───────────────────────────────────────────────────────
await User.create([
  { email: 'admin@restaurant.com',    fullName: 'Quản lý',     password: 'admin123',   role: 'admin'   },
  { email: 'bep1@restaurant.com',     fullName: 'Bếp trưởng',  password: 'kitchen123', role: 'kitchen' },
  { email: 'bep2@restaurant.com',     fullName: 'Bếp phó',     password: 'kitchen123', role: 'kitchen' },
  { email: 'phucvu1@restaurant.com',  fullName: 'Phục vụ A',   password: 'waiter123',  role: 'waiter'  },
  { email: 'phucvu2@restaurant.com',  fullName: 'Phục vụ B',   password: 'waiter123',  role: 'waiter'  },
]);
console.log('👥 Đã tạo 5 tài khoản nhân viên');

// ── Tài khoản bàn + bàn ──────────────────────────────────────────────────────
const tableData = [
  { number: 'B01', capacity: 2 },
  { number: 'B02', capacity: 2 },
  { number: 'B03', capacity: 4 },
  { number: 'B04', capacity: 4 },
  { number: 'B05', capacity: 4 },
  { number: 'B06', capacity: 4 },
  { number: 'B07', capacity: 6 },
  { number: 'B08', capacity: 6 },
  { number: 'B09', capacity: 8 },
  { number: 'B10', capacity: 8 },
];

for (const t of tableData) {
  const idx = t.number.slice(1); // '01', '02', ...
  const account = await User.create({
    email:    `ban${idx}@restaurant.com`,
    fullName: `Bàn ${t.number}`,
    password: `ban${idx}pass`,
    role:     'customer',
  });
  await Table.create({
    tableNumber: t.number,
    capacity:    t.capacity,
    account:     account._id,
    status:      'available',
  });
}
console.log('🪑 Đã tạo 10 bàn (B01 – B10)');

// ── Thực đơn ─────────────────────────────────────────────────────────────────
await MenuItem.create([
  // Khai vị
  { name: 'Gỏi cuốn tôm thịt',    description: 'Gỏi cuốn tươi, chấm tương hoisin',      price:  45000, category: 'Khai vị',      prepTimeMinutes: 10 },
  { name: 'Chả giò chiên',         description: 'Nhân thịt heo nấm, chiên giòn',          price:  55000, category: 'Khai vị',      prepTimeMinutes: 15 },
  { name: 'Súp cua bắp',           description: 'Súp cua nóng, béo ngậy',                 price:  40000, category: 'Khai vị',      prepTimeMinutes: 12 },
  { name: 'Bánh mì nướng phô mai', description: 'Bánh mì giòn, phô mai tan chảy',         price:  35000, category: 'Khai vị',      prepTimeMinutes:  8 },

  // Món chính
  { name: 'Bò lúc lắc',           description: 'Bò Mỹ xào lúc lắc, ăn kèm cơm trắng',   price: 185000, category: 'Món chính',    prepTimeMinutes: 20 },
  { name: 'Đậu tẩm hành',    description: 'Cá lóc nướng rơm, bánh tráng rau sống',  price: 165000, category: 'Món chính',    prepTimeMinutes: 25 },
  { name: 'Cá chỉ vàng',     description: 'Gà ta nướng mật ong, da giòn thơm',      price: 145000, category: 'Món chính',    prepTimeMinutes: 30 },
  { name: 'Bò cuốn cải',     description: 'Lẩu chua cay, tôm mực nghêu sò',         price: 350000, category: 'Món chính',    prepTimeMinutes: 20 },
  { name: 'Tóp mỡ', description: 'Cơm chiên trứng, tôm, xúc xích',         price:  65000, category: 'Món chính',    prepTimeMinutes: 15 },
  { name: 'Lợn quay',       description: 'Mì vàng xào tôm mực rau cải',            price:  85000, category: 'Món chính',    prepTimeMinutes: 15 },
  { name: 'Mực khô nướng',       description: 'Sườn heo ướp BBQ, nướng than hoa',        price: 175000, category: 'Món chính',    prepTimeMinutes: 35 },
  { name: 'Cơm tấm sườn bì chả', description: 'Cơm tấm đặc biệt đầy đủ topping',        price:  75000, category: 'Món chính',    prepTimeMinutes: 15 },

  // Tráng miệng
  { name: 'Chè đậu đỏ bánh lọt', description: 'Chè mát lạnh, nước cốt dừa thơm',        price:  35000, category: 'Tráng miệng',  prepTimeMinutes:  5 },
  { name: 'Bánh flan caramel',    description: 'Flan mềm mịn, caramel đắng nhẹ',         price:  30000, category: 'Tráng miệng',  prepTimeMinutes:  5 },
  { name: 'Kem dừa trái dừa',    description: 'Kem dừa tươi nguyên trái',                price:  55000, category: 'Tráng miệng',  prepTimeMinutes:  5 },
  { name: 'Chè 3 màu',           description: 'Chè ba màu đá bào nước cốt dừa',          price:  30000, category: 'Tráng miệng',  prepTimeMinutes:  5 },

  // Đồ uống
  { name: 'Bia hơi Hà Nội',      description: 'Chanh muối đá, thanh mát',                price:  25000, category: 'Đồ uống',      prepTimeMinutes:  3 },
  { name: 'Rượu men lá',           description: 'Bơ sáp + sữa đặc + đá xay',              price:  45000, category: 'Đồ uống',      prepTimeMinutes:  5 },
  { name: 'Bia lon Tiger',        description: 'Lon 330ml ướp lạnh',                      price:  35000, category: 'Đồ uống',      prepTimeMinutes:  1 },
  { name: 'Trà đào cam sả',       description: 'Trà hoa đào thanh mát có đá',             price:  35000, category: 'Đồ uống',      prepTimeMinutes:  5 },
  { name: 'Coca Cola',            description: 'Lon 330ml lạnh',                          price:  20000, category: 'Đồ uống',      prepTimeMinutes:  1 },
  { name: 'Nước suối Aquafina',   description: 'Chai 500ml',                              price:  15000, category: 'Đồ uống',      prepTimeMinutes:  1 },
  { name: 'Rượu tây',        description: 'Phin pha sẵn, sữa đặc đá',               price:  30000, category: 'Đồ uống',      prepTimeMinutes:  7 },
]);
console.log('🍽  Đã tạo 23 món ăn\n');

// ── Tóm tắt ───────────────────────────────────────────────────────────────────
console.log('══════════════════════════════════════════════');
console.log('✅  SEED HOÀN TẤT');
console.log('══════════════════════════════════════════════');
console.log('Tài khoản nhân viên:');
console.log('  👑 Admin     : admin@restaurant.com    / admin123');
console.log('  🍳 Bếp 1     : bep1@restaurant.com     / kitchen123');
console.log('  🍳 Bếp 2     : bep2@restaurant.com     / kitchen123');
console.log('  🛎  Phục vụ 1 : phucvu1@restaurant.com  / waiter123');
console.log('  🛎  Phục vụ 2 : phucvu2@restaurant.com  / waiter123');
console.log('──────────────────────────────────────────────');
console.log('Tài khoản bàn (B01–B10):');
console.log('  🪑 Bàn 01    : ban01@restaurant.com    / ban01pass');
console.log('  🪑 Bàn 02    : ban02@restaurant.com    / ban02pass');
console.log('  🪑 ...        (tương tự đến ban10)');
console.log('══════════════════════════════════════════════\n');

await mongoose.disconnect();
process.exit(0);