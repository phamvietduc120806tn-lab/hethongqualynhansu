import { Router } from 'express';
import { login, getMe } from '../controllers/auth.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = Router();

// Route công khai: Đăng nhập
router.post('/login', login);

// Route bảo vệ: Xem thông tin tài khoản hiện tại (Yêu cầu JWT Token)
router.get('/me', authMiddleware, getMe);

export default router;
