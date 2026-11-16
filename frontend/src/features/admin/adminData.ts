export interface AdminMetric {
  title: string
  value: string
  subText: string
  trend: 'up' | 'down' | 'neutral'
  trendValue: string
  icon: 'revenue' | 'orders' | 'customers' | 'inventory'
}

export interface AdminProductItem {
  id: string
  sku: string
  name: string
  category: string
  brand: string
  priceVnd: number
  stock: number
  status: 'ACTIVE' | 'INACTIVE'
  image: string
}

export interface AdminOrderItem {
  id: string
  code: string
  customerName: string
  customerPhone: string
  date: string
  totalVnd: number
  status: 'PENDING' | 'CONFIRMED' | 'SHIPPING' | 'COMPLETED' | 'CANCELLED'
  paymentMethod: 'COD' | 'ONLINE_MOCK'
  itemCount: number
  items: { name: string; quantity: number; priceVnd: number }[]
  shippingAddress: string
}

export interface AdminInventoryItem {
  id: string
  sku: string
  productName: string
  branchName: string
  branchId: string
  quantity: number
  minThreshold: number
  status: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK'
}

export interface AdminCategoryItem {
  id: string
  name: string
  slug: string
  productCount: number
  description: string
  status: 'ACTIVE' | 'INACTIVE'
}

export interface AdminBrandItem {
  id: string
  name: string
  country: string
  productCount: number
  status: 'ACTIVE' | 'INACTIVE'
}

export interface AdminCouponItem {
  id: string
  code: string
  discountType: 'PERCENT' | 'FIXED'
  discountValue: number
  minOrderVnd: number
  usedCount: number
  maxUsage: number
  validFrom: string
  validUntil: string
  status: 'ACTIVE' | 'EXPIRED'
}

export interface AdminUserItem {
  id: string
  fullName: string
  email: string
  phone: string
  roles: string[]
  orderCount: number
  totalSpentVnd: number
  createdAt: string
  status: 'ACTIVE' | 'LOCKED'
}

export interface AdminStaffItem {
  id: string
  fullName: string
  email: string
  phone: string
  role: 'ROLE_STAFF' | 'ROLE_ADMIN'
  branchName: string
  status: 'ACTIVE' | 'INACTIVE'
  joinedDate: string
}

export interface AdminBranchItem {
  id: string
  name: string
  address: string
  phone: string
  city: string
  status: 'ACTIVE' | 'INACTIVE'
  managerName: string
}

export interface AdminReviewItem {
  id: string
  productName: string
  customerName: string
  rating: number
  comment: string
  date: string
  status: 'APPROVED' | 'PENDING' | 'HIDDEN_BY_ADMIN'
}

// Initial Data
export const initialMetrics: AdminMetric[] = [
  {
    title: 'Tổng doanh thu tháng',
    value: '1.285.450.000₫',
    subText: 'so với tháng trước',
    trend: 'up',
    trendValue: '+14.2%',
    icon: 'revenue',
  },
  {
    title: 'Đơn hàng mới',
    value: '186 đơn',
    subText: '24 đơn đang chờ xử lý',
    trend: 'up',
    trendValue: '+8.5%',
    icon: 'orders',
  },
  {
    title: 'Khách hàng thành viên',
    value: '1.420 người',
    subText: '+38 tài khoản trong tuần',
    trend: 'up',
    trendValue: '+5.3%',
    icon: 'customers',
  },
  {
    title: 'Cảnh báo tồn kho',
    value: '12 sản phẩm',
    subText: 'Dưới mức tồn an toàn',
    trend: 'down',
    trendValue: 'Cần bổ sung',
    icon: 'inventory',
  },
]

export const initialProducts: AdminProductItem[] = [
  {
    id: 'p-1',
    sku: 'MSI-PRO-16',
    name: 'MSI Pro 16 Flex-036AU 15.6 All-In-One Multitouch',
    category: 'Máy tính để bàn',
    brand: 'MSI',
    priceVnd: 12490000,
    stock: 24,
    status: 'ACTIVE',
    image: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=100&auto=format&fit=crop&q=80',
  },
  {
    id: 'p-2',
    sku: 'MSI-TRI-AS',
    name: 'MSI MPG Trident AS 10SC-1208AU Gaming Desktop PC',
    category: 'Máy tính để bàn',
    brand: 'MSI',
    priceVnd: 28990000,
    stock: 15,
    status: 'ACTIVE',
    image: 'https://images.unsplash.com/photo-1587831990711-23ca6441447b?w=100&auto=format&fit=crop&q=80',
  },
  {
    id: 'p-3',
    sku: 'MSI-GS66-ST',
    name: 'MSI GS66 Stealth 10SGS 15.6 300Hz Gaming Laptop',
    category: 'Laptop',
    brand: 'MSI',
    priceVnd: 42990000,
    stock: 8,
    status: 'ACTIVE',
    image: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=100&auto=format&fit=crop&q=80',
  },
  {
    id: 'p-4',
    sku: 'ASUS-TUF-FX505',
    name: 'ASUS TUF Gaming FX505 GeForce GTX 1650 144Hz',
    category: 'Laptop',
    brand: 'ASUS',
    priceVnd: 18990000,
    stock: 3,
    status: 'ACTIVE',
    image: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=100&auto=format&fit=crop&q=80',
  },
  {
    id: 'p-5',
    sku: 'RAZER-BLADE-15',
    name: 'Razer Blade 15 Base Gaming Laptop OLED 4K',
    category: 'Laptop',
    brand: 'Razer',
    priceVnd: 54990000,
    stock: 5,
    status: 'ACTIVE',
    image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=100&auto=format&fit=crop&q=80',
  },
  {
    id: 'p-6',
    sku: 'MSI-OPTIX-27',
    name: 'Màn hình Gaming MSI Optix MAG274QRF-QD 27 inch 2K 165Hz',
    category: 'Màn hình',
    brand: 'MSI',
    priceVnd: 8490000,
    stock: 18,
    status: 'ACTIVE',
    image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=100&auto=format&fit=crop&q=80',
  },
  {
    id: 'p-7',
    sku: 'TT-RGB-850W',
    name: 'Nguồn máy tính Thermaltake Toughpower Grand RGB 850W Gold',
    category: 'Linh kiện PC',
    brand: 'Thermaltake',
    priceVnd: 3490000,
    stock: 32,
    status: 'ACTIVE',
    image: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=100&auto=format&fit=crop&q=80',
  },
  {
    id: 'p-8',
    sku: 'ADATA-XPG-32G',
    name: 'RAM Desktop ADATA XPG Spectrix D50 RGB 32GB (2x16GB) 3200MHz',
    category: 'Linh kiện PC',
    brand: 'ADATA',
    priceVnd: 2290000,
    stock: 0,
    status: 'INACTIVE',
    image: 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=100&auto=format&fit=crop&q=80',
  },
]

export const initialOrders: AdminOrderItem[] = [
  {
    id: 'ord-1',
    code: 'TS-100245',
    customerName: 'Nguyễn Văn A',
    customerPhone: '0901234567',
    date: '16/11/2026 14:30',
    totalVnd: 41480000,
    status: 'PENDING',
    paymentMethod: 'COD',
    itemCount: 2,
    shippingAddress: '123 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP. HCM',
    items: [
      { name: 'MSI Pro 16 Flex-036AU All-In-One', quantity: 1, priceVnd: 12490000 },
      { name: 'MSI MPG Trident AS Gaming Desktop', quantity: 1, priceVnd: 28990000 },
    ],
  },
  {
    id: 'ord-2',
    code: 'TS-100244',
    customerName: 'Trần Thị Mai',
    customerPhone: '0912345678',
    date: '16/11/2026 11:15',
    totalVnd: 18990000,
    status: 'PENDING',
    paymentMethod: 'ONLINE_MOCK',
    itemCount: 1,
    shippingAddress: '45 Cầu Giấy, Phường Dịch Vọng, Quận Cầu Giấy, Hà Nội',
    items: [
      { name: 'ASUS TUF Gaming FX505 GeForce GTX 1650', quantity: 1, priceVnd: 18990000 },
    ],
  },
  {
    id: 'ord-3',
    code: 'TS-100242',
    customerName: 'Lê Hoàng Nam',
    customerPhone: '0987654321',
    date: '15/11/2026 16:45',
    totalVnd: 8490000,
    status: 'CONFIRMED',
    paymentMethod: 'ONLINE_MOCK',
    itemCount: 1,
    shippingAddress: '78 Nguyễn Văn Linh, Quận Hải Châu, Đà Nẵng',
    items: [
      { name: 'Màn hình Gaming MSI Optix MAG274QRF-QD 27 inch', quantity: 1, priceVnd: 8490000 },
    ],
  },
  {
    id: 'ord-4',
    code: 'TS-100238',
    customerName: 'Phạm Minh Đức',
    customerPhone: '0933445566',
    date: '15/11/2026 09:20',
    totalVnd: 42990000,
    status: 'SHIPPING',
    paymentMethod: 'ONLINE_MOCK',
    itemCount: 1,
    shippingAddress: '12 Đường 3/2, Quận 10, TP. HCM',
    items: [
      { name: 'MSI GS66 Stealth 10SGS 15.6 300Hz Gaming Laptop', quantity: 1, priceVnd: 42990000 },
    ],
  },
  {
    id: 'ord-5',
    code: 'TS-100220',
    customerName: 'Hoàng Kim Ngân',
    customerPhone: '0977889900',
    date: '14/11/2026 15:10',
    totalVnd: 3490000,
    status: 'COMPLETED',
    paymentMethod: 'COD',
    itemCount: 1,
    shippingAddress: '88 Láng Hạ, Đống Đa, Hà Nội',
    items: [
      { name: 'Nguồn Thermaltake Toughpower Grand RGB 850W', quantity: 1, priceVnd: 3490000 },
    ],
  },
  {
    id: 'ord-6',
    code: 'TS-100215',
    customerName: 'Đặng Tuấn Kiệt',
    customerPhone: '0944556677',
    date: '13/11/2026 18:05',
    totalVnd: 54990000,
    status: 'CANCELLED',
    paymentMethod: 'COD',
    itemCount: 1,
    shippingAddress: '234 Trần Hưng Đạo, Quận 5, TP. HCM',
    items: [
      { name: 'Razer Blade 15 Base Gaming Laptop OLED 4K', quantity: 1, priceVnd: 54990000 },
    ],
  },
]

export const initialInventory: AdminInventoryItem[] = [
  {
    id: 'inv-1',
    sku: 'MSI-PRO-16',
    productName: 'MSI Pro 16 Flex-036AU All-In-One',
    branchName: 'Chi nhánh Quận 1 (TP.HCM)',
    branchId: 'b-hcm',
    quantity: 14,
    minThreshold: 5,
    status: 'IN_STOCK',
  },
  {
    id: 'inv-2',
    sku: 'MSI-PRO-16',
    productName: 'MSI Pro 16 Flex-036AU All-In-One',
    branchName: 'Chi nhánh Cầu Giấy (Hà Nội)',
    branchId: 'b-hn',
    quantity: 6,
    minThreshold: 5,
    status: 'IN_STOCK',
  },
  {
    id: 'inv-3',
    sku: 'MSI-PRO-16',
    productName: 'MSI Pro 16 Flex-036AU All-In-One',
    branchName: 'Chi nhánh Hải Châu (Đà Nẵng)',
    branchId: 'b-dn',
    quantity: 4,
    minThreshold: 5,
    status: 'LOW_STOCK',
  },
  {
    id: 'inv-4',
    sku: 'ASUS-TUF-FX505',
    productName: 'ASUS TUF Gaming FX505 GeForce GTX 1650',
    branchName: 'Chi nhánh Quận 1 (TP.HCM)',
    branchId: 'b-hcm',
    quantity: 2,
    minThreshold: 5,
    status: 'LOW_STOCK',
  },
  {
    id: 'inv-5',
    sku: 'ADATA-XPG-32G',
    productName: 'RAM Desktop ADATA XPG Spectrix D50 RGB 32GB',
    branchName: 'Chi nhánh Cầu Giấy (Hà Nội)',
    branchId: 'b-hn',
    quantity: 0,
    minThreshold: 5,
    status: 'OUT_OF_STOCK',
  },
]

export const initialCategories: AdminCategoryItem[] = [
  { id: 'cat-1', name: 'Laptop', slug: 'laptop', productCount: 42, description: 'Laptop gaming, laptop văn phòng học tập, máy trạm', status: 'ACTIVE' },
  { id: 'cat-2', name: 'Máy tính để bàn', slug: 'dien-thoai', productCount: 35, description: 'PC Gaming trọn bộ, máy bộ All-in-one, máy trạm', status: 'ACTIVE' },
  { id: 'cat-3', name: 'Màn hình máy tính', slug: 'man-hinh', productCount: 28, description: 'Màn hình 2K, 4K, tần số quét 144Hz - 360Hz', status: 'ACTIVE' },
  { id: 'cat-4', name: 'Linh kiện PC', slug: 'phu-kien', productCount: 65, description: 'CPU, VGA, Mainboard, RAM, PSU, Vỏ case, Tản nhiệt', status: 'ACTIVE' },
  { id: 'cat-5', name: 'Thiết bị mạng & Âm thanh', slug: 'am-thanh', productCount: 19, description: 'Router Wifi 6, Tai nghe gaming, Loa máy tính', status: 'ACTIVE' },
]

export const initialBrands: AdminBrandItem[] = [
  { id: 'br-1', name: 'MSI', country: 'Đài Loan', productCount: 56, status: 'ACTIVE' },
  { id: 'br-2', name: 'ASUS', country: 'Đài Loan', productCount: 48, status: 'ACTIVE' },
  { id: 'br-3', name: 'Razer', country: 'Mỹ', productCount: 22, status: 'ACTIVE' },
  { id: 'br-4', name: 'Thermaltake', country: 'Đài Loan', productCount: 18, status: 'ACTIVE' },
  { id: 'br-5', name: 'ADATA', country: 'Đài Loan', productCount: 24, status: 'ACTIVE' },
  { id: 'br-6', name: 'HP', country: 'Mỹ', productCount: 31, status: 'ACTIVE' },
  { id: 'br-7', name: 'Gigabyte', country: 'Đài Loan', productCount: 29, status: 'ACTIVE' },
]

export const initialCoupons: AdminCouponItem[] = [
  {
    id: 'cp-1',
    code: 'TECHSTORE10',
    discountType: 'PERCENT',
    discountValue: 10,
    minOrderVnd: 5000000,
    usedCount: 45,
    maxUsage: 200,
    validFrom: '01/11/2026',
    validUntil: '30/11/2026',
    status: 'ACTIVE',
  },
  {
    id: 'cp-2',
    code: 'GAMING2026',
    discountType: 'FIXED',
    discountValue: 500000,
    minOrderVnd: 15000000,
    usedCount: 88,
    maxUsage: 100,
    validFrom: '10/11/2026',
    validUntil: '31/12/2026',
    status: 'ACTIVE',
  },
  {
    id: 'cp-3',
    code: 'FREESHIP',
    discountType: 'FIXED',
    discountValue: 150000,
    minOrderVnd: 10000000,
    usedCount: 120,
    maxUsage: 500,
    validFrom: '01/01/2026',
    validUntil: '31/12/2026',
    status: 'ACTIVE',
  },
]

export const initialUsers: AdminUserItem[] = [
  {
    id: 'usr-1',
    fullName: 'Nguyễn Văn A',
    email: 'customer@techstore.vn',
    phone: '0901234567',
    roles: ['ROLE_CUSTOMER'],
    orderCount: 4,
    totalSpentVnd: 68470000,
    createdAt: '12/03/2026',
    status: 'ACTIVE',
  },
  {
    id: 'usr-2',
    fullName: 'Trần Thị Mai',
    email: 'mai.tran@example.com',
    phone: '0912345678',
    roles: ['ROLE_CUSTOMER'],
    orderCount: 2,
    totalSpentVnd: 24480000,
    createdAt: '05/06/2026',
    status: 'ACTIVE',
  },
  {
    id: 'usr-3',
    fullName: 'Lê Hoàng Nam',
    email: 'locked@techstore.vn',
    phone: '0987654321',
    roles: ['ROLE_CUSTOMER'],
    orderCount: 1,
    totalSpentVnd: 5490000,
    createdAt: '18/08/2026',
    status: 'LOCKED',
  },
]

export const initialStaff: AdminStaffItem[] = [
  {
    id: 'st-1',
    fullName: 'Minh Anh',
    email: 'admin@techstore.vn',
    phone: '0901234567',
    role: 'ROLE_ADMIN',
    branchName: 'Chi nhánh Quận 1 (TP.HCM)',
    status: 'ACTIVE',
    joinedDate: '01/01/2025',
  },
  {
    id: 'st-2',
    fullName: 'Vũ Quốc Bảo',
    email: 'staff@techstore.vn',
    phone: '0918765432',
    role: 'ROLE_STAFF',
    branchName: 'Chi nhánh Cầu Giấy (Hà Nội)',
    status: 'ACTIVE',
    joinedDate: '15/04/2025',
  },
  {
    id: 'st-3',
    fullName: 'Nguyễn Thùy Linh',
    email: 'linh.nguyen@techstore.vn',
    phone: '0934567890',
    role: 'ROLE_STAFF',
    branchName: 'Chi nhánh Hải Châu (Đà Nẵng)',
    status: 'ACTIVE',
    joinedDate: '10/08/2025',
  },
]

export const initialBranches: AdminBranchItem[] = [
  {
    id: 'b-hcm',
    name: 'Chi nhánh Quận 1 (TP.HCM)',
    address: '123 Nguyễn Huệ, Phường Bến Nghé, Quận 1',
    phone: '(028) 1234 5678',
    city: 'Hồ Chí Minh',
    status: 'ACTIVE',
    managerName: 'Minh Anh',
  },
  {
    id: 'b-hn',
    name: 'Chi nhánh Cầu Giấy (Hà Nội)',
    address: '45 Cầu Giấy, Phường Dịch Vọng, Quận Cầu Giấy',
    phone: '(024) 1234 5678',
    city: 'Hà Nội',
    status: 'ACTIVE',
    managerName: 'Vũ Quốc Bảo',
  },
  {
    id: 'b-dn',
    name: 'Chi nhánh Hải Châu (Đà Nẵng)',
    address: '78 Nguyễn Văn Linh, Phường Nam Dương, Quận Hải Châu',
    phone: '(0236) 1234 567',
    city: 'Đà Nẵng',
    status: 'ACTIVE',
    managerName: 'Nguyễn Thùy Linh',
  },
]

export const initialReviews: AdminReviewItem[] = [
  {
    id: 'rev-1',
    productName: 'MSI GS66 Stealth 10SGS 15.6 300Hz Gaming Laptop',
    customerName: 'Hoàng Long',
    rating: 5,
    comment: 'Máy chạy cực kỳ mượt mà, màn hình 300Hz chơi CS:GO và Valorant đỉnh chóp. Đóng gói rất cẩn thận!',
    date: '14/11/2026',
    status: 'APPROVED',
  },
  {
    id: 'rev-2',
    productName: 'ASUS TUF Gaming FX505 GeForce GTX 1650',
    customerName: 'Nguyễn Văn A',
    rating: 4,
    comment: 'Tầm giá này hiệu năng rất tốt, quạt tản nhiệt hơi ồn một chút khi render nặng nhưng chấp nhận được.',
    date: '12/11/2026',
    status: 'APPROVED',
  },
  {
    id: 'rev-3',
    productName: 'Màn hình Gaming MSI Optix MAG274QRF-QD 27 inch',
    customerName: 'Trần Thị Mai',
    rating: 5,
    comment: 'Độ chuẩn màu rất cao, tấm nền Quantum Dot sắc nét không có điểm chết nào. Rất ưng ý!',
    date: '10/11/2026',
    status: 'APPROVED',
  },
  {
    id: 'rev-4',
    productName: 'RAM Desktop ADATA XPG Spectrix D50 RGB 32GB',
    customerName: 'Lê Hoàng Nam',
    rating: 1,
    comment: 'Spam từ khóa quảng cáo linh tinh và đường link lạ...',
    date: '08/11/2026',
    status: 'HIDDEN_BY_ADMIN',
  },
]
