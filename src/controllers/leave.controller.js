import prisma from '../config/db.js';
import { successResponse, errorResponse } from '../utils/response.js';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * 1. Nhân viên nộp đơn xin nghỉ phép
 * POST /api/leaves
 * Tự động lấy userId từ JWT token, trạng thái mặc định là 'PENDING'
 */
export const createLeaveRequest = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { leaveType = 'ANNUAL', startDate, endDate, reason } = req.body;

    // Chuyển chuỗi YYYY-MM-DD sang Date UTC
    const parsedStartDate = new Date(`${startDate}T00:00:00.000Z`);
    const parsedEndDate = new Date(`${endDate}T00:00:00.000Z`);

    // Kiểm tra xem nhân viên đã có đơn nào trùng khoảng thời gian này chưa (trạng thái PENDING hoặc APPROVED)
    const overlappingLeave = await prisma.leaveRequest.findFirst({
      where: {
        userId,
        status: { in: ['PENDING', 'APPROVED'] },
        AND: [
          { startDate: { lte: parsedEndDate } },
          { endDate: { gte: parsedStartDate } },
        ],
      },
    });

    if (overlappingLeave) {
      return errorResponse(
        res,
        'Bạn đã có một đơn nghỉ phép khác trong khoảng thời gian này đang chờ duyệt hoặc đã được phê duyệt.',
        409
      );
    }

    // Tạo đơn xin nghỉ phép mới (Trạng thái mặc định: PENDING)
    const newLeaveRequest = await prisma.leaveRequest.create({
      data: {
        userId,
        leaveType: leaveType.toUpperCase(),
        startDate: parsedStartDate,
        endDate: parsedEndDate,
        reason: reason && reason.trim() !== '' ? reason.trim() : null,
        status: 'PENDING',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            department: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    return successResponse(
      res,
      'Tạo đơn xin nghỉ phép thành công! Đơn của bạn đang ở trạng thái chờ duyệt (Pending).',
      newLeaveRequest,
      201
    );
  } catch (error) {
    next(error);
  }
};

/**
 * 2. Nhân viên xem lịch sử xin nghỉ phép của chính mình
 * GET /api/leaves/my-leaves
 */
export const getMyLeaves = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const { status } = req.query;

    const where = { userId };
    if (status && status.trim() !== '') {
      where.status = status.trim().toUpperCase();
    }

    const [leaves, total] = await Promise.all([
      prisma.leaveRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          approver: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
      }),
      prisma.leaveRequest.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return successResponse(
      res,
      'Lấy danh sách đơn xin nghỉ của bạn thành công.',
      {
        leaves,
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
 * 3. HR/Quản lý xem danh sách tất cả các đơn xin nghỉ phép
 * GET /api/leaves
 * Quyền: Chỉ dành cho Admin và HR
 */
export const getAllLeaves = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const { status, leaveType, departmentId, search } = req.query;

    const where = {};

    // Lọc theo trạng thái
    if (status && status.trim() !== '') {
      where.status = status.trim().toUpperCase();
    }

    // Lọc theo loại nghỉ
    if (leaveType && leaveType.trim() !== '') {
      where.leaveType = leaveType.trim().toUpperCase();
    }

    // Lọc theo phòng ban hoặc tìm kiếm tên/email nhân viên
    if (departmentId || search) {
      where.user = {};
      if (departmentId && departmentId.trim() !== '') {
        where.user.departmentId = departmentId.trim();
      }
      if (search && search.trim() !== '') {
        where.user.OR = [
          { name: { contains: search.trim(), mode: 'insensitive' } },
          { email: { contains: search.trim(), mode: 'insensitive' } },
        ];
      }
    }

    const [leaves, total] = await Promise.all([
      prisma.leaveRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              department: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          approver: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
      }),
      prisma.leaveRequest.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return successResponse(
      res,
      'Lấy toàn bộ danh sách đơn xin nghỉ phép thành công.',
      {
        leaves,
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
 * 4. HR/Quản lý cập nhật trạng thái đơn nghỉ (Approved hoặc Rejected)
 * PUT /api/leaves/:id/status
 * Quyền: Chỉ dành cho Admin và HR
 */
export const updateLeaveStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const approverId = req.user.id; // Lấy ID người duyệt từ JWT Token

    // 1. Kiểm tra định dạng UUID của ID đơn
    if (!UUID_REGEX.test(id)) {
      return errorResponse(res, 'Mã đơn nghỉ phép (ID) không đúng định dạng UUID.', 400);
    }

    // 2. Tìm kiếm đơn xin nghỉ phép trong cơ sở dữ liệu
    const leaveRequest = await prisma.leaveRequest.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!leaveRequest) {
      return errorResponse(res, `Không tìm thấy đơn xin nghỉ phép với ID '${id}'.`, 404);
    }

    const { status, approverNotes } = req.body;
    const normalizedStatus = status.trim().toUpperCase();

    // 3. Thực hiện cập nhật trạng thái đơn và ghi nhận người duyệt
    const updatedLeave = await prisma.leaveRequest.update({
      where: { id },
      data: {
        status: normalizedStatus,
        approverId,
        approverNotes: approverNotes && approverNotes.trim() !== '' ? approverNotes.trim() : null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            department: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        approver: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    const actionText = normalizedStatus === 'APPROVED' ? 'phê duyệt' : 'từ chối';

    return successResponse(
      res,
      `Đã ${actionText} thành công đơn xin nghỉ phép của nhân viên '${updatedLeave.user.name}'.`,
      updatedLeave,
      200
    );
  } catch (error) {
    next(error);
  }
};
