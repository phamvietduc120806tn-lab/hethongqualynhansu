import { errorResponse } from '../utils/response.js';

/**
 * Middleware phân quyền người dùng (Role-based Authorization Middleware)
 * @param {...string|string[]} allowedRoles Danh sách các vai trò được phép truy cập (VD: 'ADMIN', 'HR')
 * @example
 * // Sử dụng cho 1 role:
 * router.get('/admin-dashboard', authMiddleware, roleMiddleware('ADMIN'), controller)
 * // Sử dụng cho nhiều role (Admin hoặc HR):
 * router.get('/employees', authMiddleware, roleMiddleware('ADMIN', 'HR'), controller)
 * // Hoặc truyền dạng mảng:
 * router.get('/employees', authMiddleware, roleMiddleware(['ADMIN', 'HR']), controller)
 */
export const roleMiddleware = (...allowedRoles) => {
  // Chuẩn hóa danh sách roles về mảng chữ hoa (UpperCase) để hỗ trợ linh hoạt 'admin', 'Admin', 'ADMIN'
  const flattenedRoles = allowedRoles.flat().map((r) => String(r).toUpperCase());

  return (req, res, next) => {
    // 1. Kiểm tra xem request đã qua authMiddleware chưa
    if (!req.user) {
      return errorResponse(
        res,
        'Yêu cầu chưa được xác thực. Hãy đảm bảo authMiddleware được gọi trước roleMiddleware.',
        401
      );
    }

    const userRole = String(req.user.role).toUpperCase();

    // 2. Kiểm tra vai trò của người dùng có nằm trong danh sách cho phép không
    if (!flattenedRoles.includes(userRole)) {
      return errorResponse(
        res,
        `Quyền truy cập bị từ chối: Tài khoản của bạn (${req.user.role}) không có quyền thực hiện hành động này. Yêu cầu một trong các vai trò: [${flattenedRoles.join(', ')}].`,
        403
      );
    }

    // 3. Hợp lệ, chuyển tiếp sang handler tiếp theo
    next();
  };
};

/**
 * Helper tiện ích: Chỉ cho phép Admin hoặc HR truy cập
 */
export const requireAdminOrHR = roleMiddleware('ADMIN', 'HR');

/**
 * Helper tiện ích: Chỉ cho phép Admin truy cập
 */
export const requireAdminOnly = roleMiddleware('ADMIN');
