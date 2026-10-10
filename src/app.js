import express from 'express';
import cors from 'cors';
import routes from './routes/index.js';
import { errorHandler } from './middlewares/error.middleware.js';

const app = express();

// 1. Cấu hình middleware toàn cục
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 2. Route kiểm tra trạng thái hoạt động (Health Check)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'UP',
    message: 'HRMS Authentication API is running smoothly.',
    timestamp: new Date().toISOString(),
  });
});

// 3. Đăng ký tập trung tất cả routes API
app.use('/api', routes);

// 4. Bắt route không tồn tại (404 Handler)
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Không tìm thấy đường dẫn ${req.method} ${req.originalUrl}`,
  });
});

// 5. Middleware bắt lỗi tập trung (Global Error Handler)
app.use(errorHandler);

export default app;
