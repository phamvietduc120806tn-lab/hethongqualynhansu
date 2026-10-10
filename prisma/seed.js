import { PrismaClient, Role, LeaveType, LeaveStatus, AttendanceStatus } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Đang làm sạch dữ liệu cũ (Clean up) ---');
  await prisma.leaveRequest.deleteMany({});
  await prisma.attendance.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.department.deleteMany({});

  console.log('--- 1. Tạo phòng ban (Departments) ---');
  const deptEngineering = await prisma.department.create({
    data: {
      name: 'Phòng Kỹ thuật & Công nghệ',
      description: 'Phát triển và bảo trì hệ thống phần mềm, hạ tầng kỹ thuật.'
    }
  });

  const deptHR = await prisma.department.create({
    data: {
      name: 'Phòng Nhân sự',
      description: 'Tuyển dụng, quản lý chính sách và văn hóa doanh nghiệp.'
    }
  });

  const deptSales = await prisma.department.create({
    data: {
      name: 'Phòng Kinh doanh & Tiếp thị',
      description: 'Mở rộng thị trường, chăm sóc khách hàng và bán hàng.'
    }
  });

  console.log('--- 2. Tạo người dùng mẫu (Users) ---');
  const saltRounds = 10;
  const adminPassword = await bcrypt.hash('Admin@123', saltRounds);
  const hrPassword = await bcrypt.hash('Hr@123', saltRounds);
  const empPassword = await bcrypt.hash('Emp@123', saltRounds);

  // Admin
  const adminUser = await prisma.user.create({
    data: {
      name: 'Nguyễn Văn Quản Trị',
      email: 'admin@hrms.local',
      password: adminPassword,
      phone: '0901234567',
      role: Role.ADMIN,
      departmentId: deptEngineering.id
    }
  });

  // HR Manager
  const hrUser = await prisma.user.create({
    data: {
      name: 'Trần Thị Thu Thảo',
      email: 'hr@hrms.local',
      password: hrPassword,
      phone: '0912345678',
      role: Role.HR,
      departmentId: deptHR.id
    }
  });

  // Employee
  const employeeUser = await prisma.user.create({
    data: {
      name: 'Lê Hoàng Nam',
      email: 'nam.le@hrms.local',
      password: empPassword,
      phone: '0987654321',
      role: Role.EMPLOYEE,
      departmentId: deptEngineering.id
    }
  });

  console.log('--- 3. Tạo dữ liệu chấm công mẫu (Attendance) ---');
  const today = new Date();
  const dateOnly = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
  const checkInTime = new Date(dateOnly);
  checkInTime.setHours(8, 25, 0); // 08:25 AM

  const checkOutTime = new Date(dateOnly);
  checkOutTime.setHours(17, 30, 0); // 17:30 PM

  await prisma.attendance.create({
    data: {
      userId: employeeUser.id,
      date: dateOnly,
      checkIn: checkInTime,
      checkOut: checkOutTime,
      status: AttendanceStatus.PRESENT,
      notes: 'Check-in đúng giờ'
    }
  });

  console.log('--- 4. Tạo yêu cầu nghỉ phép mẫu (LeaveRequests) ---');
  const startDate = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate() + 3));
  const endDate = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate() + 4));

  await prisma.leaveRequest.create({
    data: {
      userId: employeeUser.id,
      leaveType: LeaveType.ANNUAL,
      startDate,
      endDate,
      reason: 'Xin nghỉ phép giải quyết việc gia đình',
      status: LeaveStatus.PENDING,
      approverId: hrUser.id
    }
  });

  console.log('✅ Khởi tạo dữ liệu mẫu thành công!');
}

main()
  .catch((e) => {
    console.error('Lỗi khi seed dữ liệu:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
