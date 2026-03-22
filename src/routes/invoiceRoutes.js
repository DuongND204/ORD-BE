import express from 'express';
import {
  generateInvoice,
  getInvoiceByOrder,
  getInvoiceById,
  markAsPaid,
  updateQR,
} from '../controllers/invoiceController.js';

const router = express.Router();

// ⚠️ /order/:orderId phải đặt TRƯỚC /:id
router.post('/generate',        generateInvoice);
router.get('/order/:orderId',   getInvoiceByOrder);
router.get('/:id',              getInvoiceById);
router.put('/:id/pay',          markAsPaid);
router.put('/:id/qr',           updateQR);

export default router;