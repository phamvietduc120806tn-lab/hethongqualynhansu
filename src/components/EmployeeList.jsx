import React, { useState, useEffect, useMemo } from 'react';

// ============================================================================
// 1. DỮ LIỆU MẪU GIẢ LẬP (MOCK DATA)
// Tương thích 100% với cấu trúc dữ liệu trả về từ API backend: GET /api/employees
// ============================================================================
const MOCK_EMPLOYEES = [
  {
    id: '86411499-3ae6-4328-a005-cf78a90f9a21',
    name: 'Nguyễn Văn Quản Trị',
    email: 'admin@hrms.local',
    phone: '0901234567',
    role: 'ADMIN',
    isActive: true,
    department: {
      id: 'd1',
      name: 'Ban Giám Đốc & Kỹ Thuật',
      description: 'Điều hành và quản lý kỹ thuật toàn công ty'
    },
    createdAt: '2026-01-15T08:30:00Z'
  },
  {
    id: '543378d0-9eb0-4c71-b248-2b988d23ea1f',
    name: 'Trần Thị Thu Thảo',
    email: 'hr@hrms.local',
    phone: '0912345678',
    role: 'HR',
    isActive: true,
    department: {
      id: 'd2',
      name: 'Phòng Nhân Sự',
      description: 'Tuyển dụng và văn hóa doanh nghiệp'
    },
    createdAt: '2026-02-01T09:15:00Z'
  },
  {
    id: '673e4ddc-e0e8-46ee-91cd-183eaac5f242',
    name: 'Lê Hoàng Nam',
    email: 'nam.le@hrms.local',
    phone: '0987654321',
    role: 'EMPLOYEE',
    isActive: true,
    department: {
      id: 'd3',
      name: 'Phòng Kỹ Thuật & Công Nghệ',
      description: 'Phát triển sản phẩm phần mềm'
    },
    createdAt: '2026-02-10T10:00:00Z'
  },
  {
    id: 'e4a2b910-1845-4203-b8dc-7f12e800c123',
    name: 'Phạm Minh Tuấn',
    email: 'tuan.pm@hrms.local',
    phone: '0933221100',
    role: 'EMPLOYEE',
    isActive: true,
    department: {
      id: 'd4',
      name: 'Phòng Kinh Doanh & Tiếp Thị',
      description: 'Mở rộng thị trường và tìm kiếm khách hàng'
    },
    createdAt: '2026-03-05T14:20:00Z'
  },
  {
    id: 'b12c8e34-9721-4d1a-881c-99d8a112f456',
    name: 'Võ Thị Mai Phương',
    email: 'phuong.vo@hrms.local',
    phone: '0977889900',
    role: 'EMPLOYEE',
    isActive: false,
    department: {
      id: 'd3',
      name: 'Phòng Kỹ Thuật & Công Nghệ',
      description: 'Thiết kế giao diện UI/UX'
    },
    createdAt: '2026-03-12T11:45:00Z'
  }
];

// Helper hiển thị badge vai trò (Role)
const getRoleBadge = (role) => {
  switch (role) {
    case 'ADMIN':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
          Quản Trị Viên (Admin)
        </span>
      );
    case 'HR':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
          Nhân Sự (HR)
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          Nhân Viên (Employee)
        </span>
      );
  }
};

// Helper tạo Avatar với chữ cái đầu
const getAvatarInitials = (name) => {
  if (!name) return 'NV';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export default function EmployeeList() {
  // ==========================================
  // STATE MANAGEMENT
  // ==========================================
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Bộ lọc & Tìm kiếm
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('ALL');

  // Phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Toggle sử dụng Mock Data hoặc gọi API thật
  const USE_MOCK_DATA = true; // Đổi thành false khi tích hợp API backend thật

  // ==========================================
  // FETCH DATA EFFECT
  // ==========================================
  const fetchEmployees = async () => {
    setLoading(true);
    setError(null);

    if (USE_MOCK_DATA) {
      // Giả lập thời gian chờ mạng (Network delay 800ms) để hiển thị Skeleton Loading
      setTimeout(() => {
        setEmployees(MOCK_EMPLOYEES);
        setLoading(false);
      }, 800);
      return;
    }

    try {
      // Khi tích hợp API thật:
      const token = localStorage.getItem('token'); // Lấy JWT token đã lưu khi đăng nhập
      const response = await fetch('http://localhost:5000/api/employees', {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Không thể tải danh sách nhân viên từ máy chủ.');
      }

      const result = await response.json();
      setEmployees(result.data.employees || []);
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err.message);
      // Fallback về mock data nếu API offline
      setEmployees(MOCK_EMPLOYEES);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  // ==========================================
  // LỌC VÀ PHÂN TRANG (FILTER & PAGINATION)
  // ==========================================
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const matchSearch =
        emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (emp.department?.name && emp.department.name.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchRole = selectedRole === 'ALL' || emp.role === selectedRole;

      return matchSearch && matchRole;
    });
  }, [employees, searchTerm, selectedRole]);

  // Tính toán phân trang
  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage) || 1;
  const paginatedEmployees = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredEmployees.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredEmployees, currentPage, itemsPerPage]);

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 sm:p-6 lg:p-8 font-sans antialiased">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* ========================================================= */}
        {/* HEADER SECTION */}
        {/* ========================================================= */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Danh sách nhân viên
              </h1>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                {loading ? '...' : `${employees.length} nhân sự`}
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              Quản lý hồ sơ, phòng ban và phân quyền chức vụ của nhân viên trong hệ thống.
            </p>
          </div>

          {/* NÚT THÊM NHÂN VIÊN MỚI */}
          <button
            onClick={() => alert('Mở Form/Modal Thêm nhân viên mới!')}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-sm font-semibold rounded-xl shadow-sm hover:shadow transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 shrink-0 cursor-pointer"
          >
            <svg
              className="w-4 h-4 stroke-[2.5]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            <span>Thêm nhân viên mới</span>
          </button>
        </div>

        {/* ========================================================= */}
        {/* TOOLBAR: SEARCH & FILTERS */}
        {/* ========================================================= */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Ô TÌM KIẾM */}
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Tìm theo tên, email hoặc phòng ban..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
            />
          </div>

          {/* BỘ LỌC CHỨC VỤ VÀ NÚT LÀM MỚI */}
          <div className="flex items-center gap-2">
            <select
              value={selectedRole}
              onChange={(e) => {
                setSelectedRole(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 cursor-pointer"
            >
              <option value="ALL">Tất cả chức vụ</option>
              <option value="ADMIN">Quản Trị Viên (Admin)</option>
              <option value="HR">Nhân Sự (HR)</option>
              <option value="EMPLOYEE">Nhân Viên (Employee)</option>
            </select>

            <button
              title="Tải lại danh sách"
              onClick={fetchEmployees}
              className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-xl border border-slate-200 transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* EMPLOYEE DATA TABLE */}
        {/* ========================================================= */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              {/* TABLE HEADER */}
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-200/80 text-[13px] font-semibold text-slate-600 tracking-wider">
                  <th scope="col" className="py-3.5 pl-6 pr-3">Mã ID</th>
                  <th scope="col" className="py-3.5 px-4">Nhân viên</th>
                  <th scope="col" className="py-3.5 px-4">Email</th>
                  <th scope="col" className="py-3.5 px-4">Phòng ban</th>
                  <th scope="col" className="py-3.5 px-4">Chức vụ</th>
                  <th scope="col" className="py-3.5 pl-3 pr-6 text-right">Thao tác</th>
                </tr>
              </thead>

              {/* TABLE BODY */}
              <tbody className="divide-y divide-slate-100 text-sm">
                {/* 1. TRẠNG THÁI LOADING (SKELETON SHIMMER) */}
                {loading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <tr key={index} className="animate-pulse">
                      <td className="py-4 pl-6 pr-3">
                        <div className="h-4 w-14 bg-slate-200 rounded"></div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-slate-200 shrink-0"></div>
                          <div className="space-y-1.5">
                            <div className="h-4 w-28 bg-slate-200 rounded"></div>
                            <div className="h-3 w-16 bg-slate-100 rounded"></div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="h-4 w-36 bg-slate-200 rounded"></div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="h-4 w-32 bg-slate-200 rounded"></div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="h-6 w-24 bg-slate-200 rounded-full"></div>
                      </td>
                      <td className="py-4 pl-3 pr-6 text-right">
                        <div className="h-4 w-12 bg-slate-200 rounded ml-auto"></div>
                      </td>
                    </tr>
                  ))
                ) : paginatedEmployees.length === 0 ? (
                  /* 2. TRẠNG THÁI KHÔNG CÓ DỮ LIỆU (EMPTY STATE) */
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                          </svg>
                        </div>
                        <p className="font-semibold text-slate-700">Không tìm thấy nhân viên nào</p>
                        <p className="text-xs text-slate-400 mt-1">
                          Hãy thử kiểm tra lại từ khóa tìm kiếm hoặc bỏ bộ lọc hiện tại.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  /* 3. DANH SÁCH DỮ LIỆU NHÂN VIÊN THỰC TẾ */
                  paginatedEmployees.map((emp) => (
                    <tr
                      key={emp.id}
                      className="hover:bg-slate-50/70 transition-colors duration-150 group"
                    >
                      {/* CỘT 1: ID */}
                      <td className="py-4 pl-6 pr-3 font-mono text-xs text-slate-500">
                        <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium" title={emp.id}>
                          #{emp.id.substring(0, 8)}
                        </span>
                      </td>

                      {/* CỘT 2: TÊN NHÂN VIÊN & AVATAR */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-500 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-sm">
                            {getAvatarInitials(emp.name)}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 group-hover:text-indigo-600 transition">
                              {emp.name}
                            </div>
                            <div className="text-xs text-slate-400">
                              {emp.phone || 'Chưa có SĐT'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* CỘT 3: EMAIL */}
                      <td className="py-4 px-4 text-slate-600 font-medium">
                        <a
                          href={`mailto:${emp.email}`}
                          className="hover:text-indigo-600 transition flex items-center gap-1.5"
                        >
                          <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          <span>{emp.email}</span>
                        </a>
                      </td>

                      {/* CỘT 4: PHÒNG BAN */}
                      <td className="py-4 px-4 text-slate-700">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-slate-300"></span>
                          <span className="font-medium text-slate-800">
                            {emp.department?.name || 'Chưa phân bổ'}
                          </span>
                        </div>
                      </td>

                      {/* CỘT 5: CHỨC VỤ / VAI TRÒ */}
                      <td className="py-4 px-4">
                        {getRoleBadge(emp.role)}
                      </td>

                      {/* CỘT 6: THAO TÁC */}
                      <td className="py-4 pl-3 pr-6 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            title="Xem chi tiết"
                            onClick={() => alert(`Xem chi tiết nhân viên: ${emp.name}`)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                          <button
                            title="Chỉnh sửa thông tin"
                            onClick={() => alert(`Chỉnh sửa nhân viên: ${emp.name}`)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* ========================================================= */}
          {/* PHÂN TRANG (PAGINATION) */}
          {/* ========================================================= */}
          {!loading && filteredEmployees.length > 0 && (
            <div className="px-6 py-4 border-t border-slate-200/80 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-slate-600">
              <div>
                Đang hiển thị{' '}
                <span className="font-semibold text-slate-900">
                  {Math.min((currentPage - 1) * itemsPerPage + 1, filteredEmployees.length)}
                </span>{' '}
                đến{' '}
                <span className="font-semibold text-slate-900">
                  {Math.min(currentPage * itemsPerPage, filteredEmployees.length)}
                </span>{' '}
                trong số <span className="font-semibold text-slate-900">{filteredEmployees.length}</span> nhân viên
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition font-medium text-xs"
                >
                  Trước
                </button>

                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`w-7 h-7 rounded-lg text-xs font-semibold transition ${
                      currentPage === i + 1
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}

                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition font-medium text-xs"
                >
                  Sau
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
