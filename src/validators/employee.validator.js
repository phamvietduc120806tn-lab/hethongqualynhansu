import { z } from 'zod';
import { errorResponse } from '../utils/response.js';

// Định dạng số điện thoại Việt Nam (10 số, bắt đầu bằng 03, 05, 07, 08, 09) hoặc quốc tế
const phoneRegex = /^(0|\+84)(3|5|7|8|9)[0-9]{8}$/;

/**
 * Schema xác thực dữ liệu thêm mới nhân viên (POST /api/employees)
 */
export const createEmployeeSchema = z.object({
  name: z
    .string({ required_error: 'Họ và tên nhân viên là bắt buộc.' })
    .trim()
    .min(2, 'Họ và tên phải có ít nhất 2 ký tự.')
    .max(100, 'Họ và tên không được vượt quá 100 ký tự.'),

  email: z
    .string({ required_error: 'Email là bắt buộc.' })
    .trim()
    .toLowerCase()
    .email('Địa chỉ email không đúng định dạng.'),

  password: z
    .string()
    .min(6, 'Mật khẩu phải có ít nhất 6 ký tự.')
    .optional(),

  phone: z
    .string()
    .trim()
    .regex(phoneRegex, 'Số điện thoại không đúng định dạng (VD: 0901234567).')
    .optional()
    .nullable()
    .or(z.literal('')),

  role: z
    .enum(['ADMIN', 'HR', 'EMPLOYEE'], {
      errorMap: () => ({ message: "Vai trò (role) không hợp lệ. Phải là một trong: ['ADMIN', 'HR', 'EMPLOYEE']." }),
    })
    .optional()
    .default('EMPLOYEE'),

  departmentId: z
    .string()
    .uuid('Department ID phải là chuỗi định dạng UUID hợp lệ.')
    .optional()
    .nullable()
    .or(z.literal('')),
});

/**
 * Schema xác thực dữ liệu cập nhật nhân viên (PUT /api/employees/:id)
 */
export const updateEmployeeSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, 'Họ và tên phải có ít nhất 2 ký tự.')
      .max(100, 'Họ và tên không được vượt quá 100 ký tự.')
      .optional(),

    email: z
      .string()
      .trim()
      .toLowerCase()
      .email('Địa chỉ email không đúng định dạng.')
      .optional(),

    phone: z
      .string()
      .trim()
      .regex(phoneRegex, 'Số điện thoại không đúng định dạng (VD: 0901234567).')
      .optional()
      .nullable()
      .or(z.literal('')),

    role: z
      .enum(['ADMIN', 'HR', 'EMPLOYEE'], {
        errorMap: () => ({ message: "Vai trò (role) không hợp lệ. Phải là: ['ADMIN', 'HR', 'EMPLOYEE']." }),
      })
      .optional(),

    departmentId: z
      .string()
      .uuid('Department ID phải là chuỗi định dạng UUID hợp lệ.')
      .optional()
      .nullable()
      .or(z.literal('')),

    isActive: z
      .boolean({ invalid_type_error: 'Trạng thái isActive phải là kiểu boolean (true hoặc false).' })
      .optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Vui lòng cung cấp ít nhất một trường thông tin cần cập nhật.',
  });

/**
 * Middleware tiện ích xác thực request body/query bằng Zod Schema
 */
export const validateRequest = (schema, source = 'body') => {
  return (req, res, next) => {
    try {
      const parsedData = schema.parse(req[source]);
      req[source] = parsedData; // Gán dữ liệu đã được làm sạch và chuẩn hóa
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
