import { errorResponse } from '../utils/response.js';

/**
 * Global Error Handler Middleware
 */
export const errorHandler = (err, req, res, next) => {
  console.error('Unhandled Application Error:', err);

  // Xử lý lỗi cú pháp JSON trong request body
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return errorResponse(res, 'Dữ liệu JSON gửi lên không đúng định dạng.', 400);
  }

  // Xử lý lỗi liên quan tới Prisma
  if (err.code && err.code.startsWith('P')) {
    if (err.code === 'P2002') {
      return errorResponse(res, 'Dữ liệu đã tồn tại trong hệ thống (vi phạm ràng buộc unique).', 409);
    }
    if (err.code === 'P2025') {
      return errorResponse(res, 'Không tìm thấy bản ghi yêu cầu trong cơ sở dữ liệu.', 404);
    }
  }

  const message = process.env.NODE_ENV === 'production' 
    ? 'Đã xảy ra lỗi hệ thống, vui lòng thử lại sau.' 
    : err.message || 'Lỗi máy chủ nội bộ.';

  return errorResponse(res, message, 500);
};
