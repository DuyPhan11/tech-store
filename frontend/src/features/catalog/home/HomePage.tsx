import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { cartApi } from '../../../lib/api/cartApi'
import { catalogApi } from '../../../lib/api/catalogApi'
import type { HomeData } from './homeData'
import type { CatalogProduct, PublicBrand, PublicCategory } from '../list/catalogTypes'
import styles from './HomePage.module.css'

interface HeroSlide {
  id: string
  brand: string
  badge: string
  title: string
  subtitle: string
  ctaLabel: string
  ctaPath: string
  validity: string
  bonusLabel: string
  bonusValue: string
  primaryImg: string
  primaryAlt: string
  secondaryImg: string
  secondaryAlt: string
  chipTop: string
  chipMain: string
  chipSub: string
  bgStyle: string
}

const HERO_SLIDES: HeroSlide[] = [
  {
    id: 'msi-eofy',
    brand: 'msi',
    badge: 'EOFY DEAL',
    title: 'TẶNG NGAY MÀN HÌNH GAMING CAO CẤP',
    subtitle: 'KHI MUA MÁY TÍNH ĐỂ BÀN & LAPTOP MSI GAMING ĐƯỢC CHỈ ĐỊNH',
    ctaLabel: 'XEM NGAY',
    ctaPath: '/products?category=laptop-gaming',
    validity: 'ÁP DỤNG ĐẾN HẾT NGÀY 07/09/2026 HOẶC ĐẾN KHI HẾT QUÀ TẶNG.',
    bonusLabel: 'TRỊ GIÁ LÊN ĐẾN',
    bonusValue: '8.990.000₫',
    primaryImg: 'https://images.unsplash.com/photo-1547082299-de196ea013d6?w=600&auto=format&fit=crop&q=80',
    primaryAlt: 'MSI Gaming Monitor and PC',
    secondaryImg: 'https://images.unsplash.com/photo-1587831990711-23ca6441447b?w=400&auto=format&fit=crop&q=80',
    secondaryAlt: 'MSI Gaming Desktop Tower',
    chipTop: 'intel',
    chipMain: 'CORE i9',
    chipSub: '14TH GEN',
    bgStyle: 'linear-gradient(135deg, #09090b 0%, #1c1018 55%, #0f172a 100%)',
  },
  {
    id: 'iphone-16-promo',
    brand: 'Apple',
    badge: 'CHÍNH HÃNG VN/A',
    title: 'IPHONE 16 SERIES SẴN HÀNG ĐỦ MÀU',
    subtitle: 'TRẢ GÓP 0% LÃI SUẤT • BẢO HÀNH CHÍNH HÃNG 12 THÁNG',
    ctaLabel: 'KHÁM PHÁ NGAY',
    ctaPath: '/products?category=dien-thoai-iphone',
    validity: 'GIAO NHANH TRONG 2 GIỜ TẠI SHOWROOM QUẬN 1 & QUẬN 7.',
    bonusLabel: 'GIÁ CHỈ TỪ',
    bonusValue: '21.490.000₫',
    primaryImg: 'https://lh3.googleusercontent.com/eLpc_ZESsdaaLqjC1yHKsBVhXGnwHtWlLs3_42yNqdd3FkOowWqnSd-1OnVLGSBudDOjufCYjMDJXb4wxw4sY8RzW4HugpVL=w800-rw',
    primaryAlt: 'iPhone 16 Chính hãng VN/A',
    secondaryImg: 'https://lh3.googleusercontent.com/ZHiiwMfwqdE84RgZpNhvQXdk0pNp8dWQGLpm_AWGvbhmGRx--GOT1m5cUfMSDdbV3AxXRfPSmILSfEugUBEpcoO1pERMFKY=w800-rw',
    secondaryAlt: 'iPhone 16 Camera',
    chipTop: 'APPLE',
    chipMain: 'A18',
    chipSub: 'BIONIC CHIP',
    bgStyle: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 55%, #312e81 100%)',
  },
  {
    id: 'monitor-300hz',
    brand: 'SAMSUNG',
    badge: 'ESPORTS PRO',
    title: 'MÀN HÌNH GAMING TẦN SỐ QUÉT ĐẾN 300HZ',
    subtitle: 'TẤM NỀN FAST IPS 1MS • CHUẨN MÀU ĐỒ HỌA CHUYÊN NGHIỆP',
    ctaLabel: 'MUA NGAY',
    ctaPath: '/products?category=man-hinh-gaming',
    validity: 'ƯU ĐÃI ĐẶC BIỆT KHI MUA KÈM PC HOẶC LAPTOP TẠI TECH STORE.',
    bonusLabel: 'TIẾT KIỆM ĐẾN',
    bonusValue: '2.500.000₫',
    primaryImg: 'https://lh3.googleusercontent.com/WxqhB__5-mKYpai6lJULuXqOBfwMCtQUfo9fGuO5jPK4945XGzYzdzImnaP76PwfPOqCP-tGQCweEZoIEIsTrQJIvuB_6Lc=w800-rw',
    primaryAlt: 'Màn hình Samsung Odyssey G4',
    secondaryImg: 'https://lh3.googleusercontent.com/ofgH7a3Jh6D47Ypdp4Kvjh8Cq2XG4fv4eyBVKsQT7uX6ZapERvUGaYTnNxai4BYPlljtgkrtK4WZKvcw-yf1ha6uPocIpyXb=w800-rw',
    secondaryAlt: 'Phụ kiện Gaming Gear',
    chipTop: 'FAST IPS',
    chipMain: '300Hz',
    chipSub: '1MS GTG',
    bgStyle: 'linear-gradient(135deg, #020617 0%, #0c4a6e 55%, #0f172a 100%)',
  },
]

interface ProductPreview {
  id: string
  slug: string
  name: string
  image: string
  price: string
  priceVnd?: number
  oldPrice?: string
  inStock: boolean
  reviews: number
  rating?: number
}

function formatVnd(val: number): string {
  return val.toLocaleString('vi-VN') + '₫'
}

// 1. Initial 6 Featured / New Products (Real Laptops from DB & Seed)
const initialNewProducts: ProductPreview[] = [
  {
    id: 'np-1',
    slug: 'laptop-asus-vivobook-go-14-e1404fa-eb935w-ryzen-5-40-16gb-512gb-windows-11-home',
    name: 'Laptop Asus Vivobook Go 14 E1404FA-EB935W (Ryzen 5 40/ 16GB/ 512GB)',
    image: 'https://lh3.googleusercontent.com/qexCUvh-ASrliTTw6635imfDBmjxIDsGC7gVBepCo11oO3JMEk3c7KsRtbr_TfzA5iciTFPwqga-hl3AdYyYE5W9OVUQdVY=w230-rw',
    price: '20.990.000₫',
    priceVnd: 20990000,
    oldPrice: '28.490.000₫',
    inStock: true,
    reviews: 5,
  },
  {
    id: 'np-2',
    slug: 'laptop-lenovo-loq-15irh11e---83y9003vvn-core-5-205h-geforce-rtx-3050-8gb-512gb-win-11',
    name: 'Laptop Gaming Lenovo LOQ 15IRH11E (Core 5 205H/ RTX 3050/ 8GB/ 512GB)',
    image: 'https://lh3.googleusercontent.com/_PM-PnsTUlTl_r4iqpYJvTnADzLN-M5iZ00gSqjqEG1elMFA725DzTl7gFHenFAPmU1qxk2yE5ZQyt-3L1kZ0TpnohR_gPk=w230-rw',
    price: '25.990.000₫',
    priceVnd: 25990000,
    oldPrice: '36.990.000₫',
    inStock: true,
    reviews: 5,
  },
  {
    id: 'np-3',
    slug: 'laptop-asus-vivobook-s14-s3407ca-sf913w-ultra-5-225h-16gb-512gb-win-11-home',
    name: 'Laptop Asus Vivobook S14 S3407CA (Ultra 5-225H/ OLED/ 16GB/ 512GB)',
    image: 'https://lh3.googleusercontent.com/fh3QAE_n_Y_-PrJNaJbHhURaBpqBQGu_XfE3pzvEtWVgzbnXFPE1aILkHf6Rm0k54YMEYz3zerwv34SkhvlhELSnR1t2w7jZww=w230-rw',
    price: '27.490.000₫',
    priceVnd: 27490000,
    oldPrice: '35.990.000₫',
    inStock: true,
    reviews: 4,
  },
  {
    id: 'np-4',
    slug: 'laptop-acer-nitro-propanel-anv16-i12-53vh-core-5-205h-geforce-rtx-3050-16gb-512gb-win-11',
    name: 'Laptop Acer Nitro ProPanel ANV16 (Core 5 205H/ RTX 3050/ 16GB/ 512GB)',
    image: 'https://lh3.googleusercontent.com/pzhCCNum6HOe9zEXHJbr3lG5OIS6IDN5YFVi-4FAuFzASxx3Ol_gQg-UVpNYY50GfMx7sUkDwdEi1sHDlGfUFRejNQL4xW0=w230-rw',
    price: '28.990.000₫',
    priceVnd: 28990000,
    oldPrice: '33.338.500₫',
    inStock: true,
    reviews: 5,
  },
  {
    id: 'np-5',
    slug: 'laptop-msi-prestige-14-ai-d3mg-022vn-ultra-7-355-32gb-1tb-windows-11-home',
    name: 'Laptop MSI Prestige 14 AI+ D3MG (Ultra 7-355/ 32GB/ 1TB OLED)',
    image: 'https://lh3.googleusercontent.com/tJdbWXqIBRbW-KlFl5CYIYYOKYMKfiRqVnHaLgvLICEpiSvrurbOOsRQv6PKwAojYT848Qn2v71z3dKbUPY9p7qO9isGyJQ=w230-rw',
    price: '44.490.000₫',
    priceVnd: 44490000,
    oldPrice: '51.163.500₫',
    inStock: true,
    reviews: 5,
  },
  {
    id: 'np-6',
    slug: 'laptop-hp-probook-4-g1i---bq5c7pt-ultra-7-255u-16gb-512gb-win-11-home-sl',
    name: 'Laptop HP ProBook 4 G1i (Ultra 7-255U/ 16GB/ 512GB/ Win 11 SL)',
    image: 'https://lh3.googleusercontent.com/WjSd894vIGO-EaYozFdQMK3VFU-w7Rw0qfCt0iqxBGeMP54VWD7A5VmtwxQHXF_ZpQMrVmEUghLJDGJJbMv3vBx8Upi1GyU=w230-rw',
    price: '32.490.000₫',
    priceVnd: 32490000,
    oldPrice: '41.990.000₫',
    inStock: true,
    reviews: 5,
  },
]

// 2. Initial 5 Highlight / Custom Builds (Dàn máy & Thiết bị tuyển chọn)
const initialCustomBuilds: ProductPreview[] = [
  {
    id: 'cb-1',
    slug: 'laptop-asus-tuf-gaming-a15-fa506ncg-hn329w-ryzen-7-8845hs-geforce-rtx-3050-16gb-512gb',
    name: 'Laptop Asus TUF Gaming A15 FA506NCG (Ryzen 7 8845HS/ RTX 3050)',
    image: 'https://lh3.googleusercontent.com/JVbjYz4WEYUOgot9lQ2vt9y-BPdlvzaxR5A9MtzEnfddsdjkaYX2q6-rt7Gwuqv3Y6L5awdsDjqQXQ3WiN-IWJWOEaLFwjIDBA=w230-rw',
    price: '27.990.000₫',
    priceVnd: 27990000,
    oldPrice: '32.188.500₫',
    inStock: true,
    reviews: 5,
  },
  {
    id: 'cb-2',
    slug: 'laptop-acer-gaming-aspire-7-a715-59g-59rd-core-5-210h-geforce-rtx-3050-16gb-512gb-win-11',
    name: 'Laptop Acer Gaming Aspire 7 A715 (Core 5 210H/ RTX 3050/ 16GB)',
    image: 'https://lh3.googleusercontent.com/XocPrkhBjIbz91p7_hrFO_sbjVN9vKv5k5KAms6hRjpWoKgINeayDeI9JAJBzll3RYDC3UesGhcew8Hv8ZESPTksGRRyA9Fk=w230-rw',
    price: '25.990.000₫',
    priceVnd: 25990000,
    oldPrice: '29.888.500₫',
    inStock: true,
    reviews: 4,
  },
  {
    id: 'cb-3',
    slug: 'laptop-hp-probook-4-g1i---bq5c7pt-ultra-7-255u-16gb-512gb-win-11-home-sl',
    name: 'Laptop HP ProBook 4 G11 (Ultra 7-255U/ 16GB/ 512GB/ Win 11 Pro)',
    image: 'https://lh3.googleusercontent.com/WjSd894vIGO-EaYozFdQMK3VFU-w7Rw0qfCt0iqxBGeMP54VWD7A5VmtwxQHXF_ZpQMrVmEUghLJDGJJbMv3vBx8Upi1GyU=w230-rw',
    price: '32.490.000₫',
    priceVnd: 32490000,
    oldPrice: '37.363.500₫',
    inStock: true,
    reviews: 4,
  },
  {
    id: 'cb-4',
    slug: 'laptop-lenovo-thinkbook-14-g9-irl---21uy008tvn-core-i5-13420h-16gb-512gb-win-11',
    name: 'Laptop Lenovo ThinkBook 14 G9 (Core i5-13420H/ 16GB/ 512GB)',
    image: 'https://lh3.googleusercontent.com/60T5Wb3tR6ddyp_XyZsC2oMMUoDtTjyKdmHUBTksR1CRwdpHGIWvnX0_B-VZ1-blkQ57PYEx_uw6HGRIcfcK2xFk0Rvw0-Dn=w230-rw',
    price: '26.290.000₫',
    priceVnd: 26290000,
    oldPrice: '30.233.500₫',
    inStock: true,
    reviews: 4,
  },
  {
    id: 'cb-5',
    slug: 'laptop-acer-swift-air-14-sfa14-i31-52bv-core-5-320-12gb-512gb-windows-11-home',
    name: 'Laptop Acer Swift Air 14 OLED (Core 5 320/ 12GB/ 512GB/ 120Hz)',
    image: 'https://lh3.googleusercontent.com/KghMvRNKo3CqbgEH5A1L0jbbMYNY0ByLZam2ABkHansFvIfu25qla_84sQ3W2VTc1aZxfA37FqIaPQNk0pF-coIsMMJAkj0=w230-rw',
    price: '24.990.000₫',
    priceVnd: 24990000,
    oldPrice: '28.738.500₫',
    inStock: true,
    reviews: 4,
  },
]

// 3. Tabbed MSI Laptop Series
const msiSeriesData: Record<'GS' | 'GT' | 'GL' | 'GE', ProductPreview[]> = {
  GS: [
    {
      id: 'gs-1',
      slug: 'laptop-msi-prestige-14-ai-d3mg-022vn-ultra-7-355-32gb-1tb-windows-11-home',
      name: 'Laptop MSI Prestige 14 AI+ D3MG (Ultra 7-355/ 32GB/ 1TB OLED)',
      image: 'https://lh3.googleusercontent.com/tJdbWXqIBRbW-KlFl5CYIYYOKYMKfiRqVnHaLgvLICEpiSvrurbOOsRQv6PKwAojYT848Qn2v71z3dKbUPY9p7qO9isGyJQ=w230-rw',
      price: '44.490.000₫',
      oldPrice: '51.163.500₫',
      inStock: true,
      reviews: 5,
    },
    {
      id: 'gs-2',
      slug: 'laptop-msi-prestige-14-flip-ai-vincent-van-gogh-edition-ultra-x9-378h-32gb-1tb',
      name: 'Laptop MSI Prestige 14 Flip AI Vincent van Gogh (Ultra 9/ 32GB/ 1TB)',
      image: 'https://lh3.googleusercontent.com/bvm27CeviO9nTuVDmlLiIYdqHZCOQ1dYGmsj_CsLq6M5t2pH1UF_A7wQx-jXwNiSpEYiSNE0ECvrdZLVdQxFzhOmRk2MbF6p=w230-rw',
      price: '58.590.000₫',
      oldPrice: '67.838.500₫',
      inStock: true,
      reviews: 5,
    },
    {
      id: 'gs-3',
      slug: 'laptop-msi-prestige-n16-flip-ai-c1xmt-017vn-rtx-spark-n1x-64gb-2tb-windows-11-pro',
      name: 'Laptop MSI Prestige N16 Flip AI+ C1XMT (RTX Spark N1X/ 64GB/ 2TB)',
      image: 'https://lh3.googleusercontent.com/p7mwSaoRmOnhVbwoCi3j1pmcFFX-bJQQWimMSsBGkWp7efz9nuSBmCIatUMFgsN8D3NWuhHwNpJacQJvSi9GPOLZWjqco4PRXw=w230-rw',
      price: '139.990.000₫',
      oldPrice: '160.988.500₫',
      inStock: true,
      reviews: 5,
    },
    {
      id: 'gs-4',
      slug: 'laptop-msi-prestige-n16-flip-ai-c1xmt-016vn-rtx-spark-n1x-128gb-2tb-windows-11-pro',
      name: 'Laptop MSI Prestige N16 Flip AI+ C1XMT Flagship (128GB/ 2TB Pro)',
      image: 'https://lh3.googleusercontent.com/TR9IyRX4ggytDPYmjRhsYsODLsWCo8hWpDUA-5mwlxp3NvSLTQmF-LbvgdidKL4xQOnAg-0SvSIw-qQpjWdlzhX9uuDqXWk=w230-rw',
      price: '222.990.000₫',
      oldPrice: '256.438.500₫',
      inStock: true,
      reviews: 5,
    },
    {
      id: 'gs-5',
      slug: 'nova-14',
      name: 'Laptop Nova 14 (14 inch IPS QHD/ 8 nhân/ RAM 16GB/ SSD 512GB)',
      image: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=300&auto=format&fit=crop&q=80',
      price: '18.990.000₫',
      oldPrice: '21.838.500₫',
      inStock: true,
      reviews: 4,
    },
  ],
  GT: [
    {
      id: 'gt-1',
      slug: 'laptop-asus-tuf-gaming-a15-fa506ncg-hn329w-ryzen-7-8845hs-geforce-rtx-3050-16gb-512gb',
      name: 'Laptop Asus TUF Gaming A15 FA506NCG (Ryzen 7 8845HS/ RTX 3050)',
      image: 'https://lh3.googleusercontent.com/JVbjYz4WEYUOgot9lQ2vt9y-BPdlvzaxR5A9MtzEnfddsdjkaYX2q6-rt7Gwuqv3Y6L5awdsDjqQXQ3WiN-IWJWOEaLFwjIDBA=w230-rw',
      price: '27.990.000₫',
      oldPrice: '32.188.500₫',
      inStock: true,
      reviews: 5,
    },
    {
      id: 'gt-2',
      slug: 'laptop-lenovo-loq-15irh11e---83y9003vvn-core-5-205h-geforce-rtx-3050-8gb-512gb-win-11',
      name: 'Laptop Gaming Lenovo LOQ 15IRH11E (Core 5 205H/ RTX 3050/ 8GB)',
      image: 'https://lh3.googleusercontent.com/_PM-PnsTUlTl_r4iqpYJvTnADzLN-M5iZ00gSqjqEG1elMFA725DzTl7gFHenFAPmU1qxk2yE5ZQyt-3L1kZ0TpnohR_gPk=w230-rw',
      price: '25.990.000₫',
      oldPrice: '36.990.000₫',
      inStock: true,
      reviews: 5,
    },
    {
      id: 'gt-3',
      slug: 'laptop-acer-nitro-propanel-anv16-i12-53vh-core-5-205h-geforce-rtx-3050-16gb-512gb-win-11',
      name: 'Laptop Acer Nitro ProPanel ANV16 (Core 5 205H/ RTX 3050/ 16GB)',
      image: 'https://lh3.googleusercontent.com/pzhCCNum6HOe9zEXHJbr3lG5OIS6IDN5YFVi-4FAuFzASxx3Ol_gQg-UVpNYY50GfMx7sUkDwdEi1sHDlGfUFRejNQL4xW0=w230-rw',
      price: '28.990.000₫',
      oldPrice: '33.338.500₫',
      inStock: true,
      reviews: 5,
    },
    {
      id: 'gt-4',
      slug: 'laptop-acer-gaming-aspire-7-a715-59g-59rd-core-5-210h-geforce-rtx-3050-16gb-512gb-win-11',
      name: 'Laptop Acer Gaming Aspire 7 A715 (Core 5 210H/ RTX 3050/ 16GB)',
      image: 'https://lh3.googleusercontent.com/XocPrkhBjIbz91p7_hrFO_sbjVN9vKv5k5KAms6hRjpWoKgINeayDeI9JAJBzll3RYDC3UesGhcew8Hv8ZESPTksGRRyA9Fk=w230-rw',
      price: '25.990.000₫',
      oldPrice: '29.888.500₫',
      inStock: true,
      reviews: 4,
    },
    {
      id: 'gt-5',
      slug: 'laptop-msi-prestige-14-ai-d3mg-022vn-ultra-7-355-32gb-1tb-windows-11-home',
      name: 'Laptop MSI Prestige 14 AI+ D3MG (Ultra 7-355/ 32GB/ 1TB OLED)',
      image: 'https://lh3.googleusercontent.com/tJdbWXqIBRbW-KlFl5CYIYYOKYMKfiRqVnHaLgvLICEpiSvrurbOOsRQv6PKwAojYT848Qn2v71z3dKbUPY9p7qO9isGyJQ=w230-rw',
      price: '44.490.000₫',
      oldPrice: '51.163.500₫',
      inStock: true,
      reviews: 5,
    },
  ],
  GL: [
    {
      id: 'gl-1',
      slug: 'laptop-msi-prestige-n16-flip-ai-c1xmt-016vn-rtx-spark-n1x-128gb-2tb-windows-11-pro',
      name: 'Laptop MSI Prestige N16 Flip AI+ C1XMT (128GB/ 2TB Pro)',
      image: 'https://lh3.googleusercontent.com/TR9IyRX4ggytDPYmjRhsYsODLsWCo8hWpDUA-5mwlxp3NvSLTQmF-LbvgdidKL4xQOnAg-0SvSIw-qQpjWdlzhX9uuDqXWk=w230-rw',
      price: '222.990.000₫',
      oldPrice: '256.438.500₫',
      inStock: true,
      reviews: 5,
    },
    {
      id: 'gl-2',
      slug: 'laptop-msi-prestige-n16-flip-ai-c1xmt-017vn-rtx-spark-n1x-64gb-2tb-windows-11-pro',
      name: 'Laptop MSI Prestige N16 Flip AI+ C1XMT (64GB/ 2TB Pro)',
      image: 'https://lh3.googleusercontent.com/p7mwSaoRmOnhVbwoCi3j1pmcFFX-bJQQWimMSsBGkWp7efz9nuSBmCIatUMFgsN8D3NWuhHwNpJacQJvSi9GPOLZWjqco4PRXw=w230-rw',
      price: '139.990.000₫',
      oldPrice: '160.988.500₫',
      inStock: true,
      reviews: 5,
    },
    {
      id: 'gl-3',
      slug: 'laptop-msi-prestige-14-flip-ai-vincent-van-gogh-edition-ultra-x9-378h-32gb-1tb',
      name: 'Laptop MSI Prestige 14 Flip AI Vincent van Gogh (Ultra 9/ 32GB/ 1TB)',
      image: 'https://lh3.googleusercontent.com/bvm27CeviO9nTuVDmlLiIYdqHZCOQ1dYGmsj_CsLq6M5t2pH1UF_A7wQx-jXwNiSpEYiSNE0ECvrdZLVdQxFzhOmRk2MbF6p=w230-rw',
      price: '58.590.000₫',
      oldPrice: '67.838.500₫',
      inStock: true,
      reviews: 5,
    },
    {
      id: 'gl-4',
      slug: 'laptop-hp-probook-4-g1i---bq5c7pt-ultra-7-255u-16gb-512gb-win-11-home-sl',
      name: 'Laptop HP ProBook 4 G11 (Ultra 7-255U/ 16GB/ 512GB/ Win 11 Pro)',
      image: 'https://lh3.googleusercontent.com/WjSd894vIGO-EaYozFdQMK3VFU-w7Rw0qfCt0iqxBGeMP54VWD7A5VmtwxQHXF_ZpQMrVmEUghLJDGJJbMv3vBx8Upi1GyU=w230-rw',
      price: '32.490.000₫',
      oldPrice: '37.363.500₫',
      inStock: true,
      reviews: 4,
    },
    {
      id: 'gl-5',
      slug: 'laptop-lenovo-thinkbook-14-g9-irl---21uy008tvn-core-i5-13420h-16gb-512gb-win-11',
      name: 'Laptop Lenovo ThinkBook 14 G9 (Core i5-13420H/ 16GB/ 512GB)',
      image: 'https://lh3.googleusercontent.com/60T5Wb3tR6ddyp_XyZsC2oMMUoDtTjyKdmHUBTksR1CRwdpHGIWvnX0_B-VZ1-blkQ57PYEx_uw6HGRIcfcK2xFk0Rvw0-Dn=w230-rw',
      price: '26.290.000₫',
      oldPrice: '30.233.500₫',
      inStock: true,
      reviews: 4,
    },
  ],
  GE: [
    {
      id: 'ge-1',
      slug: 'laptop-asus-vivobook-s14-s3407ca-sf913w-ultra-5-225h-16gb-512gb-win-11-home',
      name: 'Laptop Asus Vivobook S14 S3407CA (Ultra 5-225H/ OLED/ 16GB/ 512GB)',
      image: 'https://lh3.googleusercontent.com/fh3QAE_n_Y_-PrJNaJbHhURaBpqBQGu_XfE3pzvEtWVgzbnXFPE1aILkHf6Rm0k54YMEYz3zerwv34SkhvlhELSnR1t2w7jZww=w230-rw',
      price: '27.490.000₫',
      oldPrice: '35.990.000₫',
      inStock: true,
      reviews: 4,
    },
    {
      id: 'ge-2',
      slug: 'laptop-acer-swift-air-14-sfa14-i31-52bv-core-5-320-12gb-512gb-windows-11-home',
      name: 'Laptop Acer Swift Air 14 OLED (Core 5 320/ 12GB/ 512GB/ 120Hz)',
      image: 'https://lh3.googleusercontent.com/KghMvRNKo3CqbgEH5A1L0jbbMYNY0ByLZam2ABkHansFvIfu25qla_84sQ3W2VTc1aZxfA37FqIaPQNk0pF-coIsMMJAkj0=w230-rw',
      price: '24.990.000₫',
      oldPrice: '28.738.500₫',
      inStock: true,
      reviews: 4,
    },
    {
      id: 'ge-3',
      slug: 'laptop-asus-vivobook-go-14-e1404fa-eb935w-ryzen-5-40-16gb-512gb-windows-11-home',
      name: 'Laptop Asus Vivobook Go 14 E1404FA-EB935W (Ryzen 5 40/ 16GB/ 512GB)',
      image: 'https://lh3.googleusercontent.com/qexCUvh-ASrliTTw6635imfDBmjxIDsGC7gVBepCo11oO3JMEk3c7KsRtbr_TfzA5iciTFPwqga-hl3AdYyYE5W9OVUQdVY=w230-rw',
      price: '20.990.000₫',
      oldPrice: '28.490.000₫',
      inStock: true,
      reviews: 5,
    },
    {
      id: 'ge-4',
      slug: 'laptop-lenovo-ideapad-slim-3-14ahp10-83k9004qvn-ryzen-5-125-8gb-512gb-windows-11',
      name: 'Laptop Lenovo IdeaPad Slim 3 14AHP10 (Ryzen 5 125/ 8GB/ 512GB)',
      image: 'https://lh3.googleusercontent.com/3eqhAIqi2zIL_xdvpgmq_a63Z3R-Riw1FodSc5aZCSDJyz_a1EXhCLfqSMqMJ0z6-ruTiDJ7AItayq2if9AORiEy-VvZpwOn=w230-rw',
      price: '19.790.000₫',
      oldPrice: '24.888.500₫',
      inStock: true,
      reviews: 4,
    },
    {
      id: 'ge-5',
      slug: 'nova-14',
      name: 'Laptop Nova 14 (14 inch IPS QHD/ 8 nhân/ RAM 16GB/ SSD 512GB)',
      image: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=300&auto=format&fit=crop&q=80',
      price: '18.990.000₫',
      oldPrice: '21.838.500₫',
      inStock: true,
      reviews: 4,
    },
  ],
}

const DEFAULT_HOME_CATEGORIES: Array<{ slug: string; name: string; description: string }> = [
  { slug: 'laptop', name: 'Laptop', description: 'Laptop văn phòng, gaming & workstation' },
  { slug: 'dien-thoai', name: 'Điện thoại', description: 'Smartphone & máy tính bảng chính hãng' },
  { slug: 'man-hinh', name: 'Màn hình', description: 'Màn hình gaming & đồ họa sắc nét' },
  { slug: 'am-thanh', name: 'Âm thanh', description: 'Tai nghe & loa Bluetooth chính hãng' },
  { slug: 'phu-kien', name: 'Phụ kiện', description: 'Bàn phím cơ, chuột gaming & gear' },
]

function mapCatalogProductToPreview(p: CatalogProduct, idx: number): ProductPreview {
  return {
    id: p.id || `live-${idx}`,
    slug: p.slug || p.id,
    name: p.name,
    image: p.image,
    price: formatVnd(p.priceVnd),
    priceVnd: p.priceVnd,
    inStock: p.status !== 'INACTIVE',
    reviews: p.reviewCount ?? 0,
    rating: p.averageRating ?? 0,
  }
}

export function HomePage({ data: _data }: { data?: HomeData }) {
  const navigate = useNavigate()
  const [heroIndex, setHeroIndex] = useState(0)
  const [isHeroPaused, setIsHeroPaused] = useState(false)
  const [homeCategories, setHomeCategories] = useState(DEFAULT_HOME_CATEGORIES)
  const [activeCategorySlug, setActiveCategorySlug] = useState<string>('laptop')
  const [newProducts, setNewProducts] = useState<ProductPreview[]>(initialNewProducts)
  const [highlightProducts, setHighlightProducts] = useState<ProductPreview[]>(initialCustomBuilds)
  const [categoryProductsMap, setCategoryProductsMap] = useState<Record<string, ProductPreview[]>>({})
  const [brands, setBrands] = useState<PublicBrand[]>([])
  const [newProductsPage, setNewProductsPage] = useState(0)
  const [addingId, setAddingId] = useState<string | null>(null)
  const [addedId, setAddedId] = useState<string | null>(null)

  // Auto-advance hero banner every 5s unless hovered
  useEffect(() => {
    if (isHeroPaused) return
    const timer = window.setInterval(() => {
      setHeroIndex(prev => (prev + 1) % HERO_SLIDES.length)
    }, 5000)
    return () => window.clearInterval(timer)
  }, [isHeroPaused])

  // Fetch live categories, brands, and products across all categories from database
  useEffect(() => {
    const controller = new AbortController()

    Promise.all([
      catalogApi.getCategories(controller.signal),
      catalogApi.getBrands(controller.signal),
      catalogApi.getProducts({ keyword: '', category: '', brand: '', sort: 'default', page: 1, size: 48 }, controller.signal),
    ])
      .then(([cats, brandList, prodPage]) => {
        if (controller.signal.aborted) return

        // Map child -> parent slug so every product can be grouped under its parent category
        const childToParent = new Map<string, string>()
        const parents: Array<{ slug: string; name: string; description: string }> = []
        for (const c of cats as PublicCategory[]) {
          if (!c.parentSlug) {
            parents.push({
              slug: c.slug,
              name: c.name,
              description: c.description || `Sản phẩm ${c.name} chính hãng`,
            })
            childToParent.set(c.slug, c.slug)
          } else {
            childToParent.set(c.slug, c.parentSlug)
          }
        }
        if (parents.length > 0) {
          setHomeCategories(parents)
          setActiveCategorySlug(prev => (parents.some(p => p.slug === prev) ? prev : parents[0].slug))
        }

        if (brandList && brandList.length > 0) {
          setBrands(brandList)
        }

        const valid = (prodPage?.products || []).filter(p => p.status !== 'INACTIVE')
        if (valid.length > 0) {
          // Group products by parent category
          const byParent: Record<string, ProductPreview[]> = {}
          const buckets = new Map<string, CatalogProduct[]>()

          for (const item of [...valid].reverse()) {
            const catSlug = item.categoryId || 'other'
            const parentKey = childToParent.get(catSlug) || catSlug
            if (!byParent[parentKey]) byParent[parentKey] = []
            byParent[parentKey].push(mapCatalogProductToPreview(item, byParent[parentKey].length))

            if (!buckets.has(catSlug)) buckets.set(catSlug, [])
            buckets.get(catSlug)!.push(item)
          }
          setCategoryProductsMap(byParent)

          // Section 4: Highlight non-laptop tech gear (monitors, keyboards, mice, audio, phones)
          const gearHighlight = [
            ...(byParent['man-hinh'] || []).slice(0, 2),
            ...(byParent['phu-kien'] || []).slice(0, 2),
            ...(byParent['am-thanh'] || []).slice(0, 1),
          ]
          if (gearHighlight.length >= 3) {
            setHighlightProducts(gearHighlight.slice(0, 5))
          } else {
            setHighlightProducts(valid.slice(0, 5).map(mapCatalogProductToPreview))
          }

          // Section 2: Interleaved 24 products across all categories
          const mixed: CatalogProduct[] = []
          let added = true
          while (added && mixed.length < 24) {
            added = false
            for (const list of buckets.values()) {
              const next = list.shift()
              if (next) {
                mixed.push(next)
                added = true
                if (mixed.length >= 24) break
              }
            }
          }
          setNewProducts(mixed.map(mapCatalogProductToPreview))
          setNewProductsPage(0)
        }
      })
      .catch(() => {
        // Fallback to initial seed data cleanly when offline/SSR
      })

    return () => controller.abort()
  }, [])

  const handleCardAddToCart = async (e: React.MouseEvent, prod: ProductPreview) => {
    e.stopPropagation()
    const numId = Number(prod.id)
    if (isNaN(numId) || numId <= 0) {
      navigate(`/products/${prod.slug}`)
      return
    }
    try {
      setAddingId(prod.id)
      const updated = await cartApi.addItem(numId, 1)
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('techstore:cart-updated', { detail: updated }))
      }
      setAddedId(prod.id)
      window.setTimeout(() => {
        setAddedId(prev => (prev === prod.id ? null : prev))
      }, 2000)
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'status' in err && (err as { status: number }).status === 401) {
        navigate('/login?redirect=/')
      } else {
        window.alert((err as { message?: string })?.message || 'Không thể thêm sản phẩm vào giỏ hàng')
      }
    } finally {
      setAddingId(null)
    }
  }

  const totalNewPages = Math.max(1, Math.ceil(newProducts.length / 6))
  const newProductPages = Array.from({ length: totalNewPages }, (_, pageIdx) =>
    newProducts.slice(pageIdx * 6, pageIdx * 6 + 6)
  )
  const activeCategoryObj = homeCategories.find(c => c.slug === activeCategorySlug) || homeCategories[0]
  const currentCategoryList = (categoryProductsMap[activeCategorySlug] || msiSeriesData.GS).slice(0, 5)

  return (
    <div className={styles.techStoreHome}>
      {/* 1. Hero Promo Banner Carousel */}
      <section
        className={styles.heroSection}
        aria-label="Khuyến mãi nổi bật"
        onMouseEnter={() => setIsHeroPaused(true)}
        onMouseLeave={() => setIsHeroPaused(false)}
      >
        <div className={styles.heroViewport}>
          <button
            type="button"
            className={styles.bannerArrowLeft}
            aria-label="Banner trước"
            onClick={() => setHeroIndex(prev => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length)}
          >
            ‹
          </button>

          <div
            className={styles.heroTrack}
            style={{ transform: `translateX(-${heroIndex * 100}%)` }}
          >
            {HERO_SLIDES.map(slide => (
              <div key={slide.id} className={styles.heroBanner} style={{ background: slide.bgStyle }}>
                <div className={styles.heroLeft}>
                  <div className={styles.msiLogoRow}>
                    <span className={styles.msiText}>{slide.brand}</span>
                    <span className={styles.eofyBadge}>{slide.badge}</span>
                  </div>

                  <h1 className={styles.heroTitle}>{slide.title}</h1>

                  <p className={styles.heroSubtitle}>{slide.subtitle}</p>

                  <button
                    type="button"
                    className={styles.shopNowBtn}
                    onClick={() => navigate(slide.ctaPath)}
                  >
                    {slide.ctaLabel}
                  </button>

                  <p className={styles.validityNotice}>{slide.validity}</p>
                </div>

                <div className={styles.heroRight}>
                  <div className={styles.bonusBadge}>
                    <span>{slide.bonusLabel}</span>
                    <strong>{slide.bonusValue}</strong>
                  </div>

                  <div className={styles.techArtwork}>
                    <img
                      src={slide.primaryImg}
                      alt={slide.primaryAlt}
                      className={styles.monitorImg}
                    />
                    <img
                      src={slide.secondaryImg}
                      alt={slide.secondaryAlt}
                      className={styles.desktopImg}
                    />
                  </div>

                  <div className={styles.intelBadge}>
                    <span>{slide.chipTop}</span>
                    <strong>{slide.chipMain}</strong>
                    <small>{slide.chipSub}</small>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            className={styles.bannerArrowRight}
            aria-label="Banner kế tiếp"
            onClick={() => setHeroIndex(prev => (prev + 1) % HERO_SLIDES.length)}
          >
            ›
          </button>
        </div>

        <div className={styles.heroDots}>
          {HERO_SLIDES.map((slide, idx) => (
            <button
              key={slide.id}
              type="button"
              aria-label={`Chuyển tới banner ${idx + 1}`}
              aria-current={idx === heroIndex ? 'true' : undefined}
              className={`${styles.dot} ${idx === heroIndex ? styles.activeDot : ''}`}
              style={{ border: 'none', padding: 0, cursor: 'pointer', transition: 'all 0.25s ease' }}
              onClick={() => setHeroIndex(idx)}
            />
          ))}
        </div>
      </section>

      {/* 2. New Products Carousel */}
      <section className={styles.sectionWrap} id="san-pham-noi-bat">
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionHeading}>
            Sản phẩm mới <span className={styles.subHeading}>(Sản phẩm nổi bật)</span>
          </h2>
          <a
            href="/products"
            className={styles.seeAllLink}
            onClick={e => {
              e.preventDefault()
              navigate('/products')
            }}
          >
            Xem tất cả sản phẩm
          </a>
        </div>

        <div className={styles.carouselContainer}>
          <button
            type="button"
            className={styles.carouselArrowLeft}
            aria-label="Xem sản phẩm trước"
            onClick={() => setNewProductsPage(prev => (prev - 1 + totalNewPages) % totalNewPages)}
          >
            ‹
          </button>

          <div className={styles.carouselViewport}>
            <div
              className={styles.carouselTrack}
              style={{ transform: `translateX(-${newProductsPage * 100}%)` }}
            >
              {newProductPages.map((pageProducts, pageIdx) => (
                <div key={`new-page-${pageIdx}`} className={`${styles.carouselSlide} ${styles.productRowSix}`}>
                  {pageProducts.map(prod => (
              <div
                key={prod.id}
                className={styles.productCard}
                onClick={() => navigate(`/products/${prod.slug}`)}
                role="button"
                tabIndex={0}
              >
                <div className={styles.stockStatus}>
                  {prod.inStock ? (
                    <span className={styles.inStock}>
                      <span className={styles.stockDot} /> Còn hàng
                    </span>
                  ) : (
                    <span className={styles.checkAvailability}>
                      <span className={styles.stockDotRed} /> Liên hệ cửa hàng
                    </span>
                  )}
                </div>

                <div className={styles.topActions}>
                  <button
                    type="button"
                    className={styles.actionCircleBtn}
                    title="Thêm vào yêu thích"
                    aria-label="Yêu thích"
                    onClick={e => {
                      e.stopPropagation()
                      alert('Đã thêm vào danh sách yêu thích!')
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    className={styles.actionCircleBtn}
                    title="So sánh sản phẩm"
                    aria-label="So sánh"
                    onClick={e => {
                      e.stopPropagation()
                      alert('Đã thêm vào danh sách so sánh!')
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="20" x2="18" y2="10" />
                      <line x1="12" y1="20" x2="12" y2="4" />
                      <line x1="6" y1="20" x2="6" y2="14" />
                    </svg>
                  </button>
                </div>

                <div className={styles.thumbWrapper}>
                  <img src={prod.image} alt={prod.name} className={prod.id ? styles.productImg : ''} />
                </div>

                <div className={styles.reviewsRow}>
                  <div className={styles.stars} style={prod.reviews === 0 ? { color: '#cbd5e1' } : undefined}>
                    {prod.reviews > 0
                      ? '★'.repeat(Math.min(5, Math.max(1, Math.round(prod.rating ?? 5)))) +
                        '☆'.repeat(5 - Math.min(5, Math.max(1, Math.round(prod.rating ?? 5))))
                      : '☆☆☆☆☆'}
                  </div>
                  <span className={styles.reviewCount}>
                    {prod.reviews > 0 ? `(${prod.reviews} đánh giá)` : 'Chưa có đánh giá'}
                  </span>
                </div>

                <h3 className={styles.productName}>{prod.name}</h3>

                <div className={styles.priceRow}>
                  {prod.oldPrice && <span className={styles.oldPrice}>{prod.oldPrice}</span>}
                  <strong className={styles.currentPrice}>{prod.price}</strong>
                </div>

                <div className={styles.hoverCartWrap}>
                  <button
                    type="button"
                    className={styles.addToCartPillBtn}
                    disabled={addingId === prod.id}
                    onClick={e => handleCardAddToCart(e, prod)}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="9" cy="21" r="1" />
                      <circle cx="20" cy="21" r="1" />
                      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                    </svg>
                    <span>
                      {addingId === prod.id ? 'Đang thêm...' : addedId === prod.id ? 'Đã thêm ✓' : 'Thêm vào giỏ'}
                    </span>
                  </button>
                </div>
              </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          <button
            type="button"
            className={styles.carouselArrowRight}
            aria-label="Xem thêm sản phẩm"
            onClick={() => setNewProductsPage(prev => (prev + 1) % totalNewPages)}
          >
            ›
          </button>
        </div>
      </section>

      {/* 3. Tech Store Shipping & Voucher Promo Bar */}
      <section className={styles.zipBanner} id="shipping-promo" aria-label="Ưu đãi giao hàng và mã giảm giá">
        <div className={styles.zipInner}>
          <div className={styles.zipBadgeCircle}>
            <span className={styles.zipLogoText}>FREESHIP</span>
          </div>
          <span className={styles.zipDivider}>|</span>
          <div className={styles.zipMessage}>
            <strong>Miễn phí vận chuyển toàn quốc · Bảo hành chính hãng tại showroom Quận 1 &amp; Quận 7.</strong>
            <a
              href="/products"
              className={styles.learnMoreLink}
              onClick={e => {
                e.preventDefault()
                navigate('/products')
              }}
            >
              Mua sắm ngay
            </a>
          </div>
        </div>
      </section>

      {/* 4. Custom Builds / Highlight Products Section */}
      <section className={styles.sectionWrap} id="custom-builds" aria-label="Khám phá thêm sản phẩm">
        <div className={styles.customBuildsRow}>
          <div
            className={styles.verticalFeaturedCard}
            style={{
              backgroundImage: 'linear-gradient(rgba(0,0,0,0.65), rgba(0,0,0,0.85)), url(https://images.unsplash.com/photo-1587202372634-32705e3bf49c?w=500&auto=format&fit=crop&q=80)',
            }}
          >
            <div className={styles.verticalCardContent}>
              <h2 className={styles.verticalTitle}>Màn hình &amp; Thiết bị</h2>
              <span className={styles.verticalSubtitle}>Khám phá thêm sản phẩm</span>
            </div>
            <a
              href="/products"
              className={styles.verticalLink}
              onClick={e => {
                e.preventDefault()
                navigate('/products')
              }}
            >
              Xem tất cả sản phẩm
            </a>
          </div>

          <div className={styles.fiveCardsRow}>
            {highlightProducts.map(item => (
              <div
                key={item.id}
                className={styles.productCard}
                onClick={() => navigate(`/products/${item.slug}`)}
                role="button"
                tabIndex={0}
              >
                <div className={styles.stockStatus}>
                  <span className={styles.inStock}>
                    <span className={styles.stockDot} /> Còn hàng
                  </span>
                </div>

                <div className={styles.topActions}>
                  <button
                    type="button"
                    className={styles.actionCircleBtn}
                    title="Thêm vào yêu thích"
                    aria-label="Yêu thích"
                    onClick={e => {
                      e.stopPropagation()
                      alert('Đã thêm vào danh sách yêu thích!')
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    className={styles.actionCircleBtn}
                    title="So sánh sản phẩm"
                    aria-label="So sánh"
                    onClick={e => {
                      e.stopPropagation()
                      alert('Đã thêm vào danh sách so sánh!')
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="20" x2="18" y2="10" />
                      <line x1="12" y1="20" x2="12" y2="4" />
                      <line x1="6" y1="20" x2="6" y2="14" />
                    </svg>
                  </button>
                </div>

                <div className={styles.thumbWrapper}>
                  <img src={item.image} alt={item.name} className={styles.productImg} />
                </div>

                <div className={styles.reviewsRow}>
                  <div className={styles.stars} style={item.reviews === 0 ? { color: '#cbd5e1' } : undefined}>
                    {item.reviews > 0
                      ? '★'.repeat(Math.min(5, Math.max(1, Math.round(item.rating ?? 5)))) +
                        '☆'.repeat(5 - Math.min(5, Math.max(1, Math.round(item.rating ?? 5))))
                      : '☆☆☆☆☆'}
                  </div>
                  <span className={styles.reviewCount}>
                    {item.reviews > 0 ? `(${item.reviews} đánh giá)` : 'Chưa có đánh giá'}
                  </span>
                </div>

                <h3 className={styles.productName}>{item.name}</h3>

                <div className={styles.priceRow}>
                  {item.oldPrice && <span className={styles.oldPrice}>{item.oldPrice}</span>}
                  <strong className={styles.currentPrice}>{item.price}</strong>
                </div>

                <div className={styles.hoverCartWrap}>
                  <button
                    type="button"
                    className={styles.addToCartPillBtn}
                    disabled={addingId === item.id}
                    onClick={e => handleCardAddToCart(e, item)}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="9" cy="21" r="1" />
                      <circle cx="20" cy="21" r="1" />
                      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                    </svg>
                    <span>
                      {addingId === item.id ? 'Đang thêm...' : addedId === item.id ? 'Đã thêm ✓' : 'Thêm vào giỏ'}
                    </span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Category Tabs & Products Section (Synced with DB Categories) */}
      <section className={styles.sectionWrap} id="msi-series">
        <div className={styles.seriesTabs}>
          {homeCategories.map(cat => (
            <button
              key={cat.slug}
              type="button"
              className={`${styles.seriesTabBtn} ${activeCategorySlug === cat.slug ? styles.activeSeriesTab : ''}`}
              onClick={() => setActiveCategorySlug(cat.slug)}
            >
              {cat.name}
            </button>
          ))}
        </div>

        <div className={styles.customBuildsRow}>
          <div
            className={styles.verticalFeaturedCard}
            style={{
              backgroundImage: 'linear-gradient(rgba(0,0,0,0.65), rgba(0,0,0,0.85)), url(https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=500&auto=format&fit=crop&q=80)',
            }}
          >
            <div className={styles.verticalCardContent}>
              <h2 className={styles.verticalTitle}>{activeCategoryObj.name}</h2>
              <span className={styles.verticalSubtitle}>{activeCategoryObj.description}</span>
            </div>
            <a
              href={`/products?category=${activeCategoryObj.slug}`}
              className={styles.verticalLink}
              onClick={e => {
                e.preventDefault()
                navigate(`/products?category=${activeCategoryObj.slug}`)
              }}
            >
              Xem tất cả sản phẩm
            </a>
          </div>

          <div className={styles.fiveCardsRow}>
            {currentCategoryList.map(item => (
              <div
                key={item.id}
                className={styles.productCard}
                onClick={() => navigate(`/products/${item.slug}`)}
                role="button"
                tabIndex={0}
              >
                <div className={styles.stockStatus}>
                  <span className={styles.inStock}>
                    <span className={styles.stockDot} /> Còn hàng
                  </span>
                </div>

                <div className={styles.topActions}>
                  <button
                    type="button"
                    className={styles.actionCircleBtn}
                    title="Thêm vào yêu thích"
                    aria-label="Yêu thích"
                    onClick={e => {
                      e.stopPropagation()
                      alert('Đã thêm vào danh sách yêu thích!')
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    className={styles.actionCircleBtn}
                    title="So sánh sản phẩm"
                    aria-label="So sánh"
                    onClick={e => {
                      e.stopPropagation()
                      alert('Đã thêm vào danh sách so sánh!')
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="20" x2="18" y2="10" />
                      <line x1="12" y1="20" x2="12" y2="4" />
                      <line x1="6" y1="20" x2="6" y2="14" />
                    </svg>
                  </button>
                </div>

                <div className={styles.thumbWrapper}>
                  <img src={item.image} alt={item.name} className={styles.productImg} />
                </div>

                <div className={styles.reviewsRow}>
                  <div className={styles.stars} style={item.reviews === 0 ? { color: '#cbd5e1' } : undefined}>
                    {item.reviews > 0
                      ? '★'.repeat(Math.min(5, Math.max(1, Math.round(item.rating ?? 5)))) +
                        '☆'.repeat(5 - Math.min(5, Math.max(1, Math.round(item.rating ?? 5))))
                      : '☆☆☆☆☆'}
                  </div>
                  <span className={styles.reviewCount}>
                    {item.reviews > 0 ? `(${item.reviews} đánh giá)` : 'Chưa có đánh giá'}
                  </span>
                </div>

                <h3 className={styles.productName}>{item.name}</h3>

                <div className={styles.priceRow}>
                  {item.oldPrice && <span className={styles.oldPrice}>{item.oldPrice}</span>}
                  <strong className={styles.currentPrice}>{item.price}</strong>
                </div>

                <div className={styles.hoverCartWrap}>
                  <button
                    type="button"
                    className={styles.addToCartPillBtn}
                    disabled={addingId === item.id}
                    onClick={e => handleCardAddToCart(e, item)}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="9" cy="21" r="1" />
                      <circle cx="20" cy="21" r="1" />
                      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                    </svg>
                    <span>
                      {addingId === item.id ? 'Đang thêm...' : addedId === item.id ? 'Đã thêm ✓' : 'Thêm vào giỏ'}
                    </span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.centerActions}>
          <button
            type="button"
            className={styles.pillActionBtn}
            onClick={() => navigate(`/products?category=${activeCategoryObj.slug}`)}
          >
            Xem thêm sản phẩm
          </button>
        </div>
      </section>

      {/* 6. Brand Logos Bar (Synced with DB Brands) */}
      <section className={styles.brandLogosBar} aria-label="Thương hiệu hợp tác">
        <div className={styles.brandLogosInner}>
          {(brands.length > 0 ? brands.slice(0, 10) : [
            { id: 1, name: 'ASUS', slug: 'asus' },
            { id: 2, name: 'Apple', slug: 'apple' },
            { id: 3, name: 'Samsung', slug: 'samsung' },
            { id: 4, name: 'Lenovo', slug: 'lenovo' },
            { id: 5, name: 'Acer', slug: 'acer' },
            { id: 6, name: 'HP', slug: 'hp' },
            { id: 7, name: 'MSI', slug: 'msi' },
          ]).map(b => (
            <button
              key={b.slug}
              type="button"
              className={styles.brandNameLogo}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
              onClick={() => navigate(`/products?brand=${b.slug}`)}
            >
              {b.name}
            </button>
          ))}
        </div>
      </section>

      {/* 7. Customer Testimonials */}
      <section className={styles.testimonialSection} aria-label="Đánh giá từ khách hàng">
        <div className={styles.testimonialBox}>
          <div className={styles.quoteMark}>“</div>
          <p className={styles.testimonialQuote}>
            Lần đầu mua sắm tại Tech Store và tôi thực sự ấn tượng với trải nghiệm tuyệt vời. Giao hàng nhanh chóng, đóng gói cẩn thận và hiệu năng dàn máy cực kỳ mạnh mẽ. Rất đáng trải nghiệm!
          </p>
          <div className={styles.testimonialAuthor}>Hoàng Long — Khách hàng thân thiết</div>
          <div className={styles.carouselDots}>
            <span className={styles.activeDot} />
            <span className={styles.dot} />
            <span className={styles.dot} />
            <span className={styles.dot} />
          </div>
        </div>
      </section>

      {/* 8. Service Pillars */}
      <section className={styles.pillarsSection}>
        <div className={styles.pillarItem}>
          <div className={styles.pillarIcon}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <h3>Hỗ trợ kỹ thuật 24/7</h3>
          <p>Bảo hành tận nơi lên đến 3 năm giúp bạn hoàn toàn an tâm sử dụng.</p>
        </div>

        <div className={styles.pillarItem}>
          <div className={styles.pillarIcon}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <h3>Tài khoản thành viên ưu đãi</h3>
          <p>Nhận chiết khấu độc quyền, miễn phí giao hàng và chuyên viên chăm sóc riêng.</p>
        </div>

        <div className={styles.pillarItem}>
          <div className={styles.pillarIcon}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
          <h3>Tiết kiệm vượt trội</h3>
          <p>Ưu đãi giảm giá lên đến 70%, cam kết mức giá cạnh tranh nhất thị trường.</p>
        </div>
      </section>

      {/* Sample Disclosure Note */}
      <footer className={styles.disclosureFooter}>
        <p className={styles.note}>Sản phẩm, hình ảnh và giá trên trang dùng để minh họa.</p>
      </footer>
    </div>
  )
}
