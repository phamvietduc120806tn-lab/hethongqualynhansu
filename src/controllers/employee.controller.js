import bcrypt from 'bcrypt';
import prisma from '../config/db.js';
import { successResponse, errorResponse } from '../utils/response.js';

const DEFAULT_EMPLOYEE_PASSWORD = process.env.DEFAULT_PASSWORD || 'Employee@123';
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * 1. Lấy danh sách tất cả nhân viên (Phân trang, tìm kiếm & join với Departments)
 * GET /api/employees
 */
export const getEmployees = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const { search, departmentId, role, isActive, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    // Xây dựng điều kiện lọc (Where clause)
    const where = {};

    // Tìm kiếm tương đối theo Tên hoặc Email
    if (search && search.trim() !== '') {
      where.OR = [
        { name: { contains: search.trim(), mode: 'insensitive' } },
        { email: { contains: search.trim(), mode: 'insensitive' } },
      ];
    }

    // Lọc theo phòng ban
    if (departmentId && departmentId.trim() !== '') {
      where.departmentId = departmentId.trim();
    }

    // Lọc theo vai trò (Role)
    if (role && ['ADMIN', 'HR', 'EMPLOYEE'].includes(role.toUpperCase())) {
      where.role = role.toUpperCase();
    }

    // Lọc theo trạng thái hoạt động (isActive)
    if (isActive !== undefined && isActive !== '') {
      where.isActive = isActive === 'true' || isActive === true;
    }

    // Sắp xếp
    const validSortFields = ['name', 'email', 'createdAt', 'role'];
    const actualSortBy = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const actualSortOrder = sortOrder.toLowerCase() === 'asc' ? 'asc' : 'desc';

    // Thực hiện truy vấn song song: lấy danh sách & đếm tổng số bản ghi
    const [employees, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [actualSortBy]: actualSortOrder },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          department: {
            select: {
              id: true,
              name: true,
              description: true,
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return successResponse(
      res,
      'Lấy danh sách nhân viên thành công.',
      {
        employees,
        pagination: {
          total,
          page,
          limit,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      },
      200
    );
  } catch (error) {
    next(error);
  }
};

/**
 * 2. Thêm mới một nhân viên (Admin / HR)
 * POST /api/employees
 */
export const createEmployee = async (req, res, next) => {
  try {
    const { name, email, password, phone, role, departmentId } = req.body;

    const trimmedEmail = email.toLowerCase().trim();

    // 1. Kiểm tra xem email đã tồn tại hay chưa
    const existingUser = await prisma.user.findUnique({
      where: { email: trimmedEmail },
    });
    if (existingUser) {
      return errorResponse(res, `Email '${trimmedEmail}' đã tồn tại trong hệ thống. Vui lòng chọn email khác.`, 409);
    }

    // 2. Kiểm tra xem Department ID có tồn tại trong cơ sở dữ liệu không
    let validDepartmentId = null;
    if (departmentId && departmentId.trim() !== '') {
      const deptExists = await prisma.department.findUnique({
        where: { id: departmentId.trim() },
      });
      if (!deptExists) {
        return errorResponse(res, `Phòng ban với ID '${departmentId}' không tồn tại trong hệ thống.`, 400);
      }
      validDepartmentId = deptExists.id;
    }

    // 3. Tự động băm mật khẩu mặc định (nếu client không chỉ định mật khẩu)
    const rawPassword = password && password.trim().length >= 6 ? password.trim() : DEFAULT_EMPLOYEE_PASSWORD;
    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    // 4. Tạo nhân viên mới trong PostgreSQL
    const newEmployee = await prisma.user.create({
      data: {
        name: name.trim(),
        email: trimmedEmail,
        password: hashedPassword,
        phone: phone && phone.trim() !== '' ? phone.trim() : null,
        role: role ? role.toUpperCase() : 'EMPLOYEE',
        departmentId: validDepartmentId,
        isActive: true,
      },
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
            description: true,
          },
        },
      },
    });

    return successResponse(
      res,
      `Thêm mới nhân viên thành công! Mật khẩu mặc định: '${rawPassword}'.`,
      newEmployee,
      201
    );
  } catch (error) {
    next(error);
  }
};

/**
 * 3. Xem chi tiết thông tin 1 nhân viên theo ID
 * GET /api/employees/:id
 */
export const getEmployeeById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Kiểm tra định dạng UUID
    if (!UUID_REGEX.test(id)) {
      return errorResponse(res, 'Mã nhân viên (ID) không đúng định dạng UUID.', 400);
    }

    const employee = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        department: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        _count: {
          select: {
            attendances: true,
            leaveRequests: true,
          },
        },
      },
    });

    if (!employee) {
      return errorResponse(res, `Không tìm thấy nhân viên nào với mã ID '${id}'.`, 404);
    }

    return successResponse(res, 'Lấy thông tin chi tiết nhân viên thành công.', employee, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * 4. Cập nhật thông tin nhân viên
 * PUT /api/employees/:id
 */
export const updateEmployee = async (req, res, next) => {
  try {
    const { id } = req.params;

    // 1. Kiểm tra định dạng ID
    if (!UUID_REGEX.test(id)) {
      return errorResponse(res, 'Mã nhân viên (ID) không đúng định dạng UUID.', 400);
    }

    // 2. Kiểm tra sự tồn tại của nhân viên trong cơ sở dữ liệu
    const currentEmployee = await prisma.user.findUnique({
      where: { id },
    });
    if (!currentEmployee) {
      return errorResponse(res, `Không tìm thấy nhân viên với mã ID '${id}' để cập nhật.`, 404);
    }

    const { name, email, phone, role, departmentId, isActive } = req.body;
    const updateData = {};

    // 3. Kiểm tra và cập nhật Tên
    if (name !== undefined) {
      updateData.name = name.trim();
    }

    // 4. Kiểm tra Email mới (nếu có thay đổi, phải đảm bảo không trùng với tài khoản khác)
    if (email !== undefined) {
      const trimmedEmail = email.toLowerCase().trim();
      if (trimmedEmail !== currentEmployee.email) {
        const emailConflict = await prisma.user.findUnique({
          where: { email: trimmedEmail },
        });
        if (emailConflict) {
          return errorResponse(res, `Email '${trimmedEmail}' đã được sử dụng bởi một nhân viên khác.`, 409);
        }
        updateData.email = trimmedEmail;
      }
    }

    // 5. Cập nhật số điện thoại
    if (phone !== undefined) {
      updateData.phone = phone && phone.trim() !== '' ? phone.trim() : null;
    }

    // 6. Cập nhật vai trò (Role)
    if (role !== undefined) {
      updateData.role = role.toUpperCase();
    }

    // 7. Cập nhật trạng thái làm việc (isActive)
    if (isActive !== undefined) {
      updateData.isActive = Boolean(isActive);
    }

    // 8. Cập nhật Phòng ban
    if (departmentId !== undefined) {
      if (departmentId === null || departmentId === '') {
        updateData.departmentId = null;
      } else {
        const deptExists = await prisma.department.findUnique({
          where: { id: departmentId.trim() },
        });
        if (!deptExists) {
          return errorResponse(res, `Phòng ban với ID '${departmentId}' không tồn tại trong hệ thống.`, 400);
        }
        updateData.departmentId = deptExists.id;
      }
    }

    // 9. Thực hiện cập nhật trong DB
    const updatedEmployee = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        department: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
    });

    return successResponse(res, 'Cập nhật thông tin nhân viên thành công!', updatedEmployee, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * 5. Xóa / Vô hiệu hóa tài khoản nhân viên (Admin)
 * DELETE /api/employees/:id
 */
export const deleteEmployee = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!UUID_REGEX.test(id)) {
      return errorResponse(res, 'Mã nhân viên (ID) không đúng định dạng UUID.', 400);
    }

    // Không cho phép tự xóa tài khoản của chính mình
    if (req.user && req.user.id === id) {
      return errorResponse(res, 'Bạn không thể tự xóa hoặc vô hiệu hóa tài khoản của chính mình.', 400);
    }

    const employee = await prisma.user.findUnique({ where: { id } });
    if (!employee) {
      return errorResponse(res, 'Không tìm thấy nhân viên cần xóa.', 404);
    }

    // Thực hiện vô hiệu hóa (Soft Delete) để bảo tồn dữ liệu chấm công & lịch sử nghỉ phép
    const deactivated = await prisma.user.update({
      where: { id },
      data: { isActive: false },
      select: { id: true, name: true, email: true, isActive: true },
    });

    return successResponse(res, `Đã vô hiệu hóa thành công tài khoản của nhân viên '${deactivated.name}'.`, deactivated);
  } catch (error) {
    next(error);
  }
};
