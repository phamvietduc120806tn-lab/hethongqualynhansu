import bcrypt from 'bcrypt';
import prisma from '../config/db.js';
import { generateToken } from '../utils/jwt.js';
import { successResponse, errorResponse } from '../utils/response.js';

/**
 * Controller xử lý đăng nhập
 * POST /api/auth/login
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // 1. Kiểm tra dữ liệu đầu vào
    if (!email || !password) {
      return errorResponse(res, 'Vui lòng cung cấp đầy đủ email và mật khẩu.', 400);
    }

    const trimmedEmail = String(email).trim().toLowerCase();

    // 2. Tìm người dùng theo email trong cơ sở dữ liệu
    const user = await prisma.user.findUnique({
      where: { email: trimmedEmail },
      include: {
        department: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!user) {
      return errorResponse(res, 'Email hoặc mật khẩu không chính xác.', 401);
    }

    // 3. Kiểm tra trạng thái tài khoản
    if (!user.isActive) {
      return errorResponse(res, 'Tài khoản của bạn đã bị vô hiệu hóa. Vui lòng liên hệ quản trị viên.', 403);
    }

    // 4. So sánh mật khẩu dạng text với chuỗi hash bcrypt trong DB
    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      return errorResponse(res, 'Email hoặc mật khẩu không chính xác.', 401);
    }

    // 5. Tạo payload và ký mã JWT Token
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };
    const token = generateToken(tokenPayload);

    // 6. Loại bỏ trường mật khẩu trước khi trả về client
    const { password: _, ...userWithoutPassword } = user;

    return successResponse(
      res,
      'Đăng nhập thành công!',
      {
        token,
        tokenType: 'Bearer',
        user: userWithoutPassword,
      },
      200
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Controller lấy thông tin tài khoản hiện tại từ Token
 * GET /api/auth/me (Yêu cầu qua authMiddleware)
 */
export const getMe = async (req, res, next) => {
  try {
    return successResponse(
      res,
      'Lấy thông tin tài khoản thành công.',
      {
        user: req.user,
      },
      200
    );
  } catch (error) {
    next(error);
  }
};
