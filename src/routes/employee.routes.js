import { Router } from 'express';
import {
  getEmployees,
  createEmployee,
  getEmployeeById,
  updateEmployee,
  deleteEmployee,
} from '../controllers/employee.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { roleMiddleware } from '../middlewares/role.middleware.js';
import {
  createEmployeeSchema,
  updateEmployeeSchema,
  validateRequest,
} from '../validators/employee.validator.js';

const router = Router();

// Tất cả các API quản lý nhân viên đều yêu cầu người dùng phải đăng nhập
router.use(authMiddleware);

/**
 * @route   GET /api/employees
 * @desc    Lấy danh sách tất cả nhân viên (Hỗ trợ phân trang & join Department)
 * @access  Private (Mọi người dùng đã đăng nhập)
 */
router.get('/', getEmployees);

/**
 * @route   POST /api/employees
 * @desc    Thêm một nhân viên mới (Tự động hash mật khẩu mặc định)
 * @access  Private (Chỉ dành cho Admin và HR)
 */
router.post(
  '/',
  roleMiddleware('ADMIN', 'HR'),
  validateRequest(createEmployeeSchema),
  createEmployee
);

/**
 * @route   GET /api/employees/:id
 * @desc    Xem chi tiết 1 nhân viên
 * @access  Private
 */
router.get('/:id', getEmployeeById);

/**
 * @route   PUT /api/employees/:id
 * @desc    Cập nhật thông tin nhân viên (Validation dữ liệu đầu vào)
 * @access  Private (Chỉ dành cho Admin và HR)
 */
router.put(
  '/:id',
  roleMiddleware('ADMIN', 'HR'),
  validateRequest(updateEmployeeSchema),
  updateEmployee
);

/**
 * @route   DELETE /api/employees/:id
 * @desc    Vô hiệu hóa tài khoản nhân viên
 * @access  Private (Chỉ dành cho Admin)
 */
router.delete('/:id', roleMiddleware('ADMIN'), deleteEmployee);

export default router;
