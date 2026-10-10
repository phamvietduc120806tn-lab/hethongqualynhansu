import { z } from 'zod';
import { errorResponse } from '../utils/response.js';

// Danh sách các loại nghỉ phép hợp lệ
const LEAVE_TYPES = ['ANNUAL', 'SICK', 'UNPAID', 'MATERNITY', 'BEREAVEMENT', 'OTHER'];
// Danh sách trạng thái được phép cập nhật bởi Quản lý
const ALLOWED_STATUSES = ['APPROVED', 'REJECTED'];

/**
 * Schema xác thực dữ liệu tạo đơn xin nghỉ phép (POST /api/leaves)
 */
export const createLeaveSchema = z
  .object({
    leaveType: z
      .string()
      .optional()
      .default('ANNUAL')
      .transform((val) => (val ? val.toUpperCase() : 'ANNUAL'))
      .refine((val) => LEAVE_TYPES.includes(val), {
        message: `Loại nghỉ phép không hợp lệ. Phải là một trong: [${LEAVE_TYPES.join(', ')}].`,
      }),

    startDate: z
      .string({ required_error: 'Ngày bắt đầu nghỉ (startDate) là bắt buộc (định dạng YYYY-MM-DD).' })
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Ngày bắt đầu phải đúng định dạng YYYY-MM-DD (VD: 2026-10-15).'),

    endDate: z
      .string({ required_error: 'Ngày kết thúc nghỉ (endDate) là bắt buộc (định dạng YYYY-MM-DD).' })
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Ngày kết thúc phải đúng định dạng YYYY-MM-DD (VD: 2026-10-16).'),

    reason: z
      .string()
      .trim()
      .max(500, 'Lý do nghỉ phép không được vượt quá 500 ký tự.')
      .optional()
      .nullable()
      .or(z.literal('')),
  })
  .refine(
    (data) => {
      const start = new Date(data.startDate);
      const end = new Date(data.endDate);
      return !isNaN(start.getTime()) && !isNaN(end.getTime()) && start <= end;
    },
    {
      message: 'Ngày kết thúc (endDate) phải diễn ra cùng ngày hoặc sau ngày bắt đầu (startDate).',
      path: ['endDate'],
    }
  );

/**
 * Schema xác thực dữ liệu cập nhật trạng thái đơn nghỉ (PUT /api/leaves/:id/status)
 */
export const updateLeaveStatusSchema = z.object({
  status: z
    .string({ required_error: "Trạng thái mới là bắt buộc ('Approved' hoặc 'Rejected')." })
    .transform((val) => val.trim().toUpperCase())
    .refine((val) => ALLOWED_STATUSES.includes(val), {
      message: "Trạng thái cập nhật không hợp lệ. Chỉ chấp nhận 'Approved' (hoặc 'APPROVED') và 'Rejected' (hoặc 'REJECTED').",
    }),

  approverNotes: z
    .string()
    .trim()
    .max(500, 'Ghi chú phê duyệt không được vượt quá 500 ký tự.')
    .optional()
    .nullable()
    .or(z.literal('')),
});

/**
 * Middleware tiện ích validate dữ liệu
 */
export const validateRequest = (schema, source = 'body') => {
  return (req, res, next) => {
    try {
      const parsedData = schema.parse(req[source]);
      req[source] = parsedData;
      next();
    } catch (err) {
      if (err instanceof z.ZodError) {
        const issues = err.issues || err.errors || [];
        const formattedErrors = issues.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        return errorResponse(res, 'Dữ liệu gửi lên không hợp lệ.', 400, formattedErrors);
      }
      next(err);
    }
  };
};
