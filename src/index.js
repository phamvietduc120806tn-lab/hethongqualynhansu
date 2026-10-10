import dotenv from 'dotenv';
dotenv.config();

import app from './app.js';
import prisma from './config/db.js';

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, async () => {
  try {
    // Kiểm tra kết nối tới cơ sở dữ liệu
    await prisma.$queryRaw`SELECT 1`;
    console.log(`====================================================`);
    console.log(`🚀 HRMS Backend Server đang chạy tại http://localhost:${PORT}`);
    console.log(`📡 Đã kết nối thành công tới Supabase PostgreSQL`);
    console.log(`====================================================`);
  } catch (error) {
    console.error('❌ Lỗi kết nối Cơ sở dữ liệu:', error.message);
  }
});

// Xử lý bắt lỗi chưa được xử lý toàn cục để server hoạt động bền bỉ
process.on('uncaughtException', (err) => {
  console.error('⚠️ Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('⚠️ Unhandled Rejection tại:', promise, 'Lý do:', reason);
});

// Xử lý tắt server an toàn (Graceful Shutdown)
process.on('SIGTERM', async () => {
  console.log('Đang đóng kết nối HTTP và Prisma...');
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
});

