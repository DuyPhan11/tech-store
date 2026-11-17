import laptop from './home/assets/laptop.jpg'
import phone from './home/assets/phone.jpg'
import monitor from './home/assets/monitor.jpg'
import audio from './home/assets/audio.jpg'
import type { CatalogOption, CatalogProduct, ProductBranchInventory, ProductDetail, ProductImage } from './list/catalogTypes'

export const categories: readonly CatalogOption[] = [
  { id: 'laptop', name: 'Laptop' },
  { id: 'laptop-van-phong', name: 'Laptop văn phòng & Học tập', parentId: 'laptop' },
  { id: 'laptop-gaming', name: 'Laptop chơi game (Gaming)', parentId: 'laptop' },
  { id: 'laptop-mong-nhe', name: 'Laptop mỏng nhẹ thời trang', parentId: 'laptop' },
  { id: 'laptop-workstation', name: 'Dòng máy trạm MSI Workstation', parentId: 'laptop' },
  { id: 'dien-thoai', name: 'Điện thoại' },
  { id: 'man-hinh', name: 'Màn hình' },
  { id: 'am-thanh', name: 'Âm thanh' },
  { id: 'phu-kien', name: 'Phụ kiện' },
]

export const brands: readonly CatalogOption[] = [
  { id: 'asus', name: 'ASUS' },
  { id: 'lenovo', name: 'Lenovo' },
  { id: 'acer', name: 'Acer' },
  { id: 'hp', name: 'HP' },
  { id: 'msi', name: 'MSI' },
  { id: 'nova', name: 'Nova' },
  { id: 'orbit', name: 'Orbit' },
  { id: 'vista', name: 'Vista' },
  { id: 'echo', name: 'Echo' },
]

interface RawProductData {
  id: string
  slug: string
  sku: string
  name: string
  categoryId: string
  brandId: string
  priceVnd: number
  status: 'ACTIVE' | 'INACTIVE'
  image: string
  gallery?: string[]
  specification: string
  specifications: { label: string; value: string }[]
  description: string
  inventories: ProductBranchInventory[]
}

const rawProductList: RawProductData[] = [
  {
    id: 'nova-14',
    slug: 'nova-14',
    sku: 'LAP-NOV-14',
    name: 'Laptop Nova 14',
    categoryId: 'laptop',
    brandId: 'nova',
    priceVnd: 18990000,
    status: 'ACTIVE',
    image: laptop,
    gallery: [laptop],
    specification: '14 inch · RAM 16 GB · SSD 512 GB',
    specifications: [
      { label: 'Kích thước màn hình', value: '14 inch IPS QHD (2560 × 1600)' },
      { label: 'Bộ vi xử lý', value: '8 nhân, xung nhịp tối đa 4.5 GHz' },
      { label: 'Bộ nhớ RAM', value: '16 GB LPDDR5 6400 MHz' },
      { label: 'Ổ cứng', value: '512 GB SSD NVMe PCIe 4.0' },
      { label: 'Trọng lượng', value: '1.38 kg' },
      { label: 'Bảo hành', value: '12 tháng chính hãng' },
    ],
    description: 'Laptop Nova 14 mang đến hiệu năng ấn tượng trong thiết kế gọn nhẹ. Màn hình sắc nét cùng thời lượng pin bền bỉ hỗ trợ tối đa cho công việc và học tập hằng ngày.',
    inventories: [
      { branchId: 1, branchName: 'Chi nhánh Quận 1', branchActive: true, quantity: 5 },
      { branchId: 2, branchName: 'Chi nhánh Quận 7', branchActive: true, quantity: 8 },
      { branchId: 3, branchName: 'Kho bảo trì', branchActive: false, quantity: 20 },
    ],
  },
  {
    id: 'orbit-6',
    slug: 'orbit-6',
    sku: 'PHO-ORB-06',
    name: 'Điện thoại Orbit 6',
    categoryId: 'dien-thoai',
    brandId: 'orbit',
    priceVnd: 8990000,
    status: 'ACTIVE',
    image: phone,
    gallery: [phone],
    specification: 'OLED 6,1 inch · Bộ nhớ 128 GB',
    specifications: [
      { label: 'Màn hình', value: '6.1 inch Super AMOLED 120Hz' },
      { label: 'Bộ nhớ trong', value: '128 GB' },
      { label: 'Camera chính', value: '50 MP + 12 MP góc siêu rộng' },
      { label: 'Dung lượng pin', value: '4500 mAh, sạc nhanh 33W' },
      { label: 'Hệ điều hành', value: 'Android 14' },
      { label: 'Bảo hành', value: '12 tháng chính hãng' },
    ],
    description: 'Điện thoại Orbit 6 sở hữu màn hình OLED 120Hz mượt mà, cụm camera sắc nét và thời lượng pin cả ngày dài.',
    inventories: [
      { branchId: 1, branchName: 'Chi nhánh Quận 1', branchActive: true, quantity: 12 },
      { branchId: 2, branchName: 'Chi nhánh Quận 7', branchActive: true, quantity: 6 },
    ],
  },
  {
    id: 'vista-27',
    slug: 'vista-27',
    sku: 'MON-VIS-27',
    name: 'Màn hình Vista 27',
    categoryId: 'man-hinh',
    brandId: 'vista',
    priceVnd: 5490000,
    status: 'ACTIVE',
    image: monitor,
    gallery: [monitor],
    specification: '27 inch · QHD · Tấm nền IPS',
    specifications: [
      { label: 'Kích thước', value: '27 inch' },
      { label: 'Độ phân giải', value: 'QHD (2560 × 1440)' },
      { label: 'Tấm nền', value: 'IPS 100% sRGB' },
      { label: 'Tần số quét', value: '100 Hz' },
      { label: 'Cổng kết nối', value: 'HDMI 2.0, DisplayPort 1.4, Type-C 65W' },
      { label: 'Bảo hành', value: '24 tháng' },
    ],
    description: 'Màn hình Vista 27 với độ phân giải QHD sắc nét cùng khả năng hiển thị màu sắc chuẩn xác là lựa chọn lý tưởng cho góc làm việc chuyên nghiệp.',
    inventories: [
      { branchId: 1, branchName: 'Chi nhánh Quận 1', branchActive: true, quantity: 4 },
      { branchId: 2, branchName: 'Chi nhánh Quận 7', branchActive: true, quantity: 3 },
    ],
  },
  {
    id: 'echo-air',
    slug: 'echo-air',
    sku: 'AUD-ECH-AIR',
    name: 'Tai nghe Echo Air',
    categoryId: 'am-thanh',
    brandId: 'echo',
    priceVnd: 1790000,
    status: 'ACTIVE',
    image: audio,
    gallery: [audio],
    specification: 'Chụp tai · Kết nối Bluetooth',
    specifications: [
      { label: 'Kiểu dáng', value: 'Chụp tai Over-ear' },
      { label: 'Kết nối', value: 'Bluetooth 5.3 / Jack 3.5mm' },
      { label: 'Thời lượng pin', value: 'Lên tới 40 giờ' },
      { label: 'Chống ồn', value: 'Chống ồn chủ động ANC' },
      { label: 'Bảo hành', value: '12 tháng' },
    ],
    description: 'Echo Air mang lại không gian âm thanh chân thực, đệm tai êm ái cùng tính năng chống ồn chủ động hiệu quả.',
    inventories: [
      { branchId: 1, branchName: 'Chi nhánh Quận 1', branchActive: true, quantity: 15 },
      { branchId: 2, branchName: 'Chi nhánh Quận 7', branchActive: true, quantity: 10 },
    ],
  },
  {
    id: 'nova-16',
    slug: 'nova-16',
    sku: 'LAP-NOV-16',
    name: 'Nova 16',
    categoryId: 'laptop',
    brandId: 'nova',
    priceVnd: 21990000,
    status: 'ACTIVE',
    image: laptop,
    gallery: [laptop],
    specification: '16 inch · SSD 1 TB',
    specifications: [
      { label: 'Kích thước', value: '16 inch 2.5K IPS 120Hz' },
      { label: 'Bộ nhớ RAM', value: '16 GB DDR5' },
      { label: 'Ổ cứng', value: '1 TB SSD NVMe' },
      { label: 'Card đồ họa', value: 'Đồ họa tích hợp thế hệ mới' },
      { label: 'Bảo hành', value: '12 tháng' },
    ],
    description: 'Nova 16 mở rộng không gian hiển thị với màn hình 16 inch độ phân giải cao và dung lượng lưu trữ 1 TB thoải mái.',
    inventories: [
      { branchId: 1, branchName: 'Chi nhánh Quận 1', branchActive: true, quantity: 3 },
      { branchId: 2, branchName: 'Chi nhánh Quận 7', branchActive: true, quantity: 2 },
    ],
  },
  {
    id: 'orbit-mini',
    slug: 'orbit-mini',
    sku: 'PHO-ORB-MIN',
    name: 'Orbit Mini',
    categoryId: 'dien-thoai',
    brandId: 'orbit',
    priceVnd: 6490000,
    status: 'ACTIVE',
    image: phone,
    gallery: [phone],
    specification: '6 inch · Bộ nhớ 128 GB',
    specifications: [
      { label: 'Màn hình', value: '6.0 inch AMOLED' },
      { label: 'Bộ nhớ', value: '128 GB' },
      { label: 'Dung lượng pin', value: '4000 mAh' },
      { label: 'Trọng lượng', value: '155g' },
      { label: 'Bảo hành', value: '12 tháng' },
    ],
    description: 'Thiết kế nhỏ gọn vừa vặn trong lòng bàn tay, Orbit Mini là chiếc điện thoại tiện lợi với đầy đủ tính năng hiện đại.',
    inventories: [
      { branchId: 1, branchName: 'Chi nhánh Quận 1', branchActive: true, quantity: 7 },
      { branchId: 2, branchName: 'Chi nhánh Quận 7', branchActive: true, quantity: 5 },
    ],
  },
  {
    id: 'vista-24',
    slug: 'vista-24',
    sku: 'MON-VIS-24',
    name: 'Vista 24',
    categoryId: 'man-hinh',
    brandId: 'vista',
    priceVnd: 3290000,
    status: 'ACTIVE',
    image: monitor,
    gallery: [monitor],
    specification: '24 inch · Full HD',
    specifications: [
      { label: 'Kích thước', value: '23.8 inch' },
      { label: 'Độ phân giải', value: 'Full HD (1920 × 1080)' },
      { label: 'Tần số quét', value: '75 Hz' },
      { label: 'Bảo hành', value: '24 tháng' },
    ],
    description: 'Vista 24 là sự lựa chọn kinh tế, đáp ứng xuất sắc nhu cầu hiển thị cho văn phòng và giải trí cơ bản.',
    inventories: [
      { branchId: 1, branchName: 'Chi nhánh Quận 1', branchActive: true, quantity: 9 },
      { branchId: 2, branchName: 'Chi nhánh Quận 7', branchActive: true, quantity: 4 },
    ],
  },
  {
    id: 'echo-studio',
    slug: 'echo-studio',
    sku: 'AUD-ECH-STU',
    name: 'Echo Studio',
    categoryId: 'am-thanh',
    brandId: 'echo',
    priceVnd: 2190000,
    status: 'ACTIVE',
    image: audio,
    gallery: [audio],
    specification: 'Chụp tai · Kết nối USB-C',
    specifications: [
      { label: 'Kiểu tai nghe', value: 'Chụp tai kiểm âm Studio' },
      { label: 'Kết nối', value: 'USB-C DAC tích hợp & 3.5mm' },
      { label: 'Dải tần', value: '20 Hz – 40.000 Hz' },
      { label: 'Bảo hành', value: '12 tháng' },
    ],
    description: 'Echo Studio đem lại trải nghiệm âm thanh phòng thu trung thực, phục vụ tốt cho cả công việc sáng tạo lẫn thưởng thức âm nhạc.',
    // Toàn bộ chi nhánh ACTIVE đều có tồn 0 để phục vụ test case OUT_OF_STOCK
    inventories: [
      { branchId: 1, branchName: 'Chi nhánh Quận 1', branchActive: true, quantity: 0 },
      { branchId: 2, branchName: 'Chi nhánh Quận 7', branchActive: true, quantity: 0 },
      { branchId: 3, branchName: 'Chi nhánh Tạm ngừng', branchActive: false, quantity: 15 },
    ],
  },
  {
    id: 'nova-lite',
    slug: 'nova-lite',
    sku: 'LAP-NOV-LIT',
    name: 'Nova Lite',
    categoryId: 'laptop',
    brandId: 'nova',
    priceVnd: 12990000,
    status: 'ACTIVE',
    image: laptop,
    gallery: [laptop],
    specification: '13 inch · SSD 256 GB',
    specifications: [
      { label: 'Kích thước', value: '13.3 inch Full HD' },
      { label: 'RAM', value: '8 GB' },
      { label: 'Ổ cứng', value: '256 GB SSD' },
      { label: 'Bảo hành', value: '12 tháng' },
    ],
    description: 'Nova Lite siêu mỏng nhẹ, tối ưu cho sinh viên và người thường xuyên di chuyển.',
    inventories: [
      { branchId: 1, branchName: 'Chi nhánh Quận 1', branchActive: true, quantity: 6 },
      { branchId: 2, branchName: 'Chi nhánh Quận 7', branchActive: true, quantity: 6 },
    ],
  },
  {
    id: 'orbit-plus',
    slug: 'orbit-plus',
    sku: 'PHO-ORB-PLU',
    name: 'Orbit Plus',
    categoryId: 'dien-thoai',
    brandId: 'orbit',
    priceVnd: 9990000,
    status: 'ACTIVE',
    image: phone,
    gallery: [phone],
    specification: '6,7 inch · Bộ nhớ 256 GB',
    specifications: [
      { label: 'Màn hình', value: '6.7 inch AMOLED 120Hz' },
      { label: 'Bộ nhớ', value: '256 GB' },
      { label: 'Pin', value: '5000 mAh' },
      { label: 'Bảo hành', value: '12 tháng' },
    ],
    description: 'Màn hình lớn 6.7 inch cùng viên pin khủng 5000 mAh mang lại trải nghiệm giải trí không giới hạn.',
    inventories: [
      { branchId: 1, branchName: 'Chi nhánh Quận 1', branchActive: true, quantity: 4 },
      { branchId: 2, branchName: 'Chi nhánh Quận 7', branchActive: true, quantity: 11 },
    ],
  },
  // Sản phẩm INACTIVE phục vụ kiểm thử không truy cập được qua public catalog
  {
    id: 'nova-archived',
    slug: 'nova-archived',
    sku: 'LAP-NOV-ARC',
    name: 'Nova Archived Edition',
    categoryId: 'laptop',
    brandId: 'nova',
    priceVnd: 15000000,
    status: 'INACTIVE',
    image: laptop,
    gallery: [laptop],
    specification: 'Mẫu sản phẩm đã ngưng kinh doanh',
    specifications: [{ label: 'Tình trạng', value: 'Ngưng kinh doanh' }],
    description: 'Sản phẩm này không còn được mở bán công khai.',
    inventories: [],
  },
]

// 1. Danh sách sản phẩm cho UC04 (chỉ gồm sản phẩm ACTIVE, giữ đúng 10 sản phẩm mẫu ban đầu)
export const catalogProducts: CatalogProduct[] = rawProductList
  .filter(p => p.status === 'ACTIVE')
  .map(p => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    categoryId: p.categoryId,
    brandId: p.brandId,
    priceVnd: p.priceVnd,
    image: p.image,
    specification: p.specification,
    status: p.status,
  }))

// 2. Hàm chuyển đổi RawProductData sang ProductDetail chuẩn theo quy tắc tồn kho và hình ảnh
export function buildProductDetail(raw: RawProductData): ProductDetail {
  // Quy tắc tồn kho:
  // - IN_STOCK nếu có ít nhất 1 chi nhánh ACTIVE có quantity > 0
  // - maxBranchQuantity = MAX(quantity) của chi nhánh ACTIVE
  const activeBranchInventories = raw.inventories.filter(inv => inv.branchActive)
  const inStock = activeBranchInventories.some(inv => inv.quantity > 0)
  const maxBranchQuantity = activeBranchInventories.reduce((max, inv) => Math.max(max, inv.quantity), 0)

  // Quy tắc ảnh:
  // - Tối đa 8 ảnh/sản phẩm
  // - Sắp xếp theo displayOrder
  // - Có tối đa 1 ảnh primary
  // - Fallback alt text theo tên sản phẩm
  const galleryUrls = (raw.gallery && raw.gallery.length > 0 ? raw.gallery : [raw.image]).slice(0, 8)
  const images: ProductImage[] = galleryUrls.map((url, index) => ({
    id: `${raw.id}-img-${index + 1}`,
    url,
    alt: `${raw.name} - Ảnh ${index + 1}`,
    isPrimary: index === 0,
    displayOrder: index,
  }))

  return {
    id: raw.id,
    slug: raw.slug,
    sku: raw.sku,
    name: raw.name,
    categoryId: raw.categoryId,
    brandId: raw.brandId,
    priceVnd: raw.priceVnd,
    status: raw.status,
    image: raw.image,
    images,
    specification: raw.specification,
    specifications: raw.specifications ?? [],
    description: raw.description ?? '',
    inStock,
    maxBranchQuantity,
  }
}

// 3. Toàn bộ chi tiết sản phẩm (kèm cả ACTIVE và INACTIVE để mock source kiểm tra)
export const productDetailsMap = new Map<string, ProductDetail>(
  rawProductList.map(raw => [raw.slug, buildProductDetail(raw)])
)
