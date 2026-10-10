import { Router } from 'express';
import {
  createLeaveRequest,
  getMyLeaves,
  getAllLeaves,
  updateLeaveStatus,
} from '../controllers/leave.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { roleMiddleware } from '../middlewares/role.middleware.js';
import {
  createLeaveSchema,
  updateLeaveStatusSchema,
  validateRequest,
} from '../validators/leave.validator.js';

const router = Router();

// Tất cả các route quản lý nghỉ phép đều yêu cầu phải đăng nhập
router.use(authMiddleware);

/**
 * 1. POST /api/leaves
 * Dành cho nhân viên tạo đơn xin nghỉ phép.
 * Tự động lấy userId từ JWT token, trạng thái mặc định là 'PENDING'.
 */
router.post('/', validateRequest(createLeaveSchema), createLeaveRequest);

/**
 * 2. GET /api/leaves/my-leaves
 * Dành cho nhân viên xem lịch sử xin nghỉ của chính họ.
 */
router.get('/my-leaves', getMyLeaves);

/**
 * 3. GET /api/leaves
 * Dành cho HR / Quản lý (Admin) xem danh sách tất cả các đơn xin nghỉ.
 * Yêu cầu quyền: Chỉ Admin và HR mới được truy cập.
 */
router.get('/', roleMiddleware('ADMIN', 'HR'), getAllLeaves);

/**
 * 4. PUT /api/leaves/:id/status
 * Dành cho HR / Quản lý cập nhật trạng thái đơn nghỉ (Approved hoặc Rejected).
 * Yêu cầu quyền: Chỉ Admin và HR mới được truy cập.
 */
router.put(
  '/:id/status',
  roleMiddleware('ADMIN', 'HR'),
  validateRequest(updateLeaveStatusSchema),
  updateLeaveStatus
);

export default router;
