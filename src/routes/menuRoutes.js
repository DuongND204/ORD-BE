import express from 'express';
import {
  getAllMenuItems,
  getCategories,
  getMenuItemById,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
} from '../controllers/menuController.js';

const router = express.Router();

router.get('/',            getAllMenuItems);
router.get('/categories',  getCategories);
router.get('/:id',         getMenuItemById);
router.post('/',           createMenuItem);
router.put('/:id',         updateMenuItem);
router.delete('/:id',      deleteMenuItem);

export default router;