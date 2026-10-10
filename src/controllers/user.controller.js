import bcrypt from 'bcrypt';
import prisma from '../config/db.js';
import { successResponse, errorResponse } from '../utils/response.js';

/**
 * Lấy danh sách toàn bộ nhân viên (Dành cho Admin và HR)
 * GET /api/users
 */
export const getAllUsers = async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        department: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return successResponse(res, 'Lấy danh sách nhân viên thành công.', users);
  } catch (error) {
    next(error);
  }
};

/**
 * Lấy thông tin chi tiết 1 nhân viên theo ID
 * GET /api/users/:id
 */
export const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        department: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!user) {
      return errorResponse(res, 'Không tìm thấy thông tin nhân viên.', 404);
    }

    return successResponse(res, 'Lấy chi tiết nhân viên thành công.', user);
  } catch (error) {
    next(error);
  }
};

/**
 * Thêm mới nhân viên (Dành cho Admin và HR)
 * POST /api/users
 */
export const createUser = async (req, res, next) => {
  try {
    const { name, email, password, phone, role, departmentId } = req.body;

    if (!name || !email || !password) {
      return errorResponse(res, 'Họ tên, email và mật khẩu là bắt buộc.', 400);
    }

    // Kiểm tra email trùng
    const existing = await prisma.user.findUnique({
      where: { email: String(email).trim().toLowerCase() },
    });
    if (existing) {
      return errorResponse(res, 'Email này đã tồn tại trong hệ thống.', 409);
    }

    // Băm mật khẩu bằng bcrypt
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        name,
        email: String(email).trim().toLowerCase(),
        password: hashedPassword,
        phone: phone || null,
        role: role ? String(role).toUpperCase() : 'EMPLOYEE',
        departmentId: departmentId || null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        departmentId: true,
        isActive: true,
        createdAt: true,
      },
    });

    return successResponse(res, 'Tạo nhân viên mới thành công!', newUser, 201);
  } catch (error) {
    next(error);
  }
};
