import express from 'express';
import {
  getAllActiveOrders,
  getOrderByTable,
  getOrderById,
  addItems,
  updateItemStatus,
  cancelItem,
  closeOrder,
} from '../controllers/orderController.js';

const router = express.Router();

// ⚠️ Route cụ thể phải đặt TRƯỚC route có tham số động (:id)
// để tránh Express match nhầm 'table' vào :id
router.get('/table/:tableId',       getOrderByTable);
router.get('/',                     getAllActiveOrders);
router.get('/:id',                  getOrderById);

router.post('/items',               addItems);
router.put('/items/:itemId/status', updateItemStatus);
router.delete('/items/:itemId',     cancelItem);
router.put('/:id/close',            closeOrder);

export default router;