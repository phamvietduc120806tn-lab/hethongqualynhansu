import { Router } from 'express';
import { getAllUsers, getUserById, createUser } from '../controllers/user.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { roleMiddleware } from '../middlewares/role.middleware.js';

const router = Router();

// Tất cả các routes trong user.routes đều yêu cầu xác thực JWT Token
router.use(authMiddleware);

/**
 * Route: GET /api/users
 * Mục đích: Lấy danh sách nhân viên
 * Phân quyền: CHỈ cho phép 'ADMIN' hoặc 'HR'
 */
router.get('/', roleMiddleware('ADMIN', 'HR'), getAllUsers);

/**
 * Route: POST /api/users
 * Mục đích: Tạo mới tài khoản nhân viên
 * Phân quyền: CHỈ cho phép 'ADMIN' hoặc 'HR'
 */
router.post('/', roleMiddleware('ADMIN', 'HR'), createUser);

/**
 * Route: GET /api/users/:id
 * Mục đích: Xem chi tiết nhân viên
 * Phân quyền: CHỈ cho phép 'ADMIN' hoặc 'HR'
 */
router.get('/:id', roleMiddleware('ADMIN', 'HR'), getUserById);

export default router;
