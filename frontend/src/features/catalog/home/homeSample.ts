import type { HomeData } from './homeData'
import laptop from './assets/laptop.jpg'
import phone from './assets/phone.jpg'
import monitor from './assets/monitor.jpg'
import audio from './assets/audio.jpg'

export const homeSample: HomeData = {
  categories: [
    { id: 'laptop', name: 'Laptop', image: laptop },
    { id: 'dien-thoai', name: 'Điện thoại', image: phone },
    { id: 'man-hinh', name: 'Màn hình', image: monitor },
    { id: 'am-thanh', name: 'Âm thanh', image: audio },
  ],
  featured: [
    { id: 'nova-14', categoryId: 'laptop', name: 'Laptop Nova 14', specification: '14 inch · RAM 16 GB · SSD 512 GB', image: laptop, priceVnd: 18990000 },
    { id: 'orbit-6', categoryId: 'dien-thoai', name: 'Điện thoại Orbit 6', specification: 'OLED 6,1 inch · Bộ nhớ 128 GB', image: phone, priceVnd: 8990000 },
    { id: 'vista-27', categoryId: 'man-hinh', name: 'Màn hình Vista 27', specification: '27 inch · QHD · Tấm nền IPS', image: monitor, priceVnd: 5490000 },
    { id: 'echo-air', categoryId: 'am-thanh', name: 'Tai nghe Echo Air', specification: 'Chụp tai · Kết nối Bluetooth', image: audio, priceVnd: 1790000 },
  ],
  discover: [
    { id: 'nova-16', categoryId: 'laptop', name: 'Nova 16', specification: '16 inch · SSD 1 TB', image: laptop, priceVnd: 21990000 },
    { id: 'orbit-mini', categoryId: 'dien-thoai', name: 'Orbit Mini', specification: '6 inch · Bộ nhớ 128 GB', image: phone, priceVnd: 6490000 },
    { id: 'vista-24', categoryId: 'man-hinh', name: 'Vista 24', specification: '24 inch · Full HD', image: monitor, priceVnd: 3290000 },
    { id: 'echo-studio', categoryId: 'am-thanh', name: 'Echo Studio', specification: 'Chụp tai · Kết nối USB-C', image: audio, priceVnd: 2190000 },
    { id: 'nova-lite', categoryId: 'laptop', name: 'Nova Lite', specification: '13 inch · SSD 256 GB', image: laptop, priceVnd: 12990000 },
    { id: 'orbit-plus', categoryId: 'dien-thoai', name: 'Orbit Plus', specification: '6,7 inch · Bộ nhớ 256 GB', image: phone, priceVnd: 9990000 },
  ],
}
