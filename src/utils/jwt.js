import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'default_jwt_secret_hrms_key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d';

/**
 * Sinh mã JWT Token từ payload
 * @param {Object} payload Dữ liệu đính kèm (userId, email, role, ...)
 * @returns {string} Token chuỗi JWT
 */
export const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
};

/**
 * Xác minh mã JWT Token
 * @param {string} token Chuỗi JWT
 * @returns {Object} Payload giải mã
 */
export const verifyToken = (token) => {
  return jwt.verify(token, JWT_SECRET);
};
