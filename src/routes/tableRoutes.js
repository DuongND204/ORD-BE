import express from 'express';
import {
  getAllTables,
  getTableById,
  createTable,
  updateTable,
  updateTableStatus,
  deleteTable,
} from '../controllers/tableController.js';

const router = express.Router();

router.get('/',            getAllTables);
router.get('/:id',         getTableById);
router.post('/',           createTable);
router.put('/:id',         updateTable);
router.put('/:id/status',  updateTableStatus);
router.delete('/:id',      deleteTable);

export default router;