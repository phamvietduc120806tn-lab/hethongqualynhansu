import prisma from '../config/db.js';
import { verifyToken } from '../utils/jwt.js';
import { errorResponse } from '../utils/response.js';

/**
 * Middleware xác thực người dùng qua JWT token
 * Kiểm tra header Authorization: Bearer <token>
 */
export const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // 1. Kiểm tra sự tồn tại của header Authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse(
        res,
        'Yêu cầu xác thực: Vui lòng cung cấp JWT token hợp lệ trong header (Bearer <token>).',
        401
      );
    }

    // 2. Tách lấy chuỗi token
    const token = authHeader.split(' ')[1];
    if (!token) {
      return errorResponse(res, 'Token không hợp lệ hoặc bị thiếu.', 401);
    }

    // 3. Giải mã và xác thực chữ ký token
    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return errorResponse(res, 'Token đã hết hạn. Vui lòng đăng nhập lại.', 401);
      }
      return errorResponse(res, 'Token không hợp lệ hoặc đã bị chỉnh sửa.', 401);
    }

    // 4. Kiểm tra user trong cơ sở dữ liệu
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        departmentId: true,
        isActive: true,
        department: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!user) {
      return errorResponse(res, 'Người dùng sở hữu token này không tồn tại trong hệ thống.', 401);
    }

    // 5. Kiểm tra trạng thái hoạt động của tài khoản
    if (!user.isActive) {
      return errorResponse(res, 'Tài khoản của bạn đã bị khóa hoặc ngừng hoạt động.', 403);
    }

    // 6. Gán thông tin user vào request object để các middleware/controller tiếp theo sử dụng
    req.user = user;
    next();
  } catch (error) {
    console.error('Lỗi trong authMiddleware:', error);
    return errorResponse(res, 'Lỗi hệ thống khi xác thực token.', 500);
  }
};
