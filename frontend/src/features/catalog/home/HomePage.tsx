import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { catalogApi } from '../../../lib/api/catalogApi'
import type { HomeData } from './homeData'
import styles from './HomePage.module.css'

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
    slug: 'nova-14',
    name: 'Laptop Nova 14 (14 inch IPS QHD/ RAM 16GB/ SSD 512GB)',
    image: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=300&auto=format&fit=crop&q=80',
    price: '18.990.000₫',
    priceVnd: 18990000,
    oldPrice: '21.838.500₫',
    inStock: true,
    reviews: 4,
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

export function HomePage({ data: _data }: { data?: HomeData }) {
  const navigate = useNavigate()
  const [activeSeriesTab, setActiveSeriesTab] = useState<'GS' | 'GT' | 'GL' | 'GE'>('GS')
  const [newProducts, setNewProducts] = useState<ProductPreview[]>(initialNewProducts)

  // Fetch live products from backend if available
  useEffect(() => {
    const controller = new AbortController()
    catalogApi.getProducts({ keyword: '', category: 'laptop', brand: '', sort: 'default', page: 1 }, controller.signal)
      .then(res => {
        if (!controller.signal.aborted && res && res.products && res.products.length > 0) {
          const valid = res.products.filter(p => !p.name.includes('Nova Lite') && p.slug !== 'nova-out-of-stock')
          if (valid.length > 0) {
            const mapped: ProductPreview[] = valid.slice(0, 6).map((p, idx) => ({
              id: p.id || `live-${idx}`,
              slug: p.slug || p.id,
              name: p.name,
              image: p.image,
              price: formatVnd(p.priceVnd),
              priceVnd: p.priceVnd,
              oldPrice: formatVnd(Math.round(p.priceVnd * 1.15)),
              inStock: p.status !== 'INACTIVE',
              reviews: 5,
            }))
            setNewProducts(mapped)
          }
        }
      })
      .catch(() => {
        // Fallback to initial seed products cleanly
      })

    return () => controller.abort()
  }, [])

  const currentSeriesList = msiSeriesData[activeSeriesTab] || msiSeriesData.GS

  return (
    <div className={styles.techStoreHome}>
      {/* 1. Hero Promo Banner */}
      <section className={styles.heroSection} aria-label="Khuyến mãi nổi bật">
        <div className={styles.heroBanner}>
          <button type="button" className={styles.bannerArrowLeft} aria-label="Banner trước">
            ‹
          </button>

          <div className={styles.heroLeft}>
            <div className={styles.msiLogoRow}>
              <span className={styles.msiText}>msi</span>
              <span className={styles.eofyBadge}>EOFY DEAL</span>
            </div>

            <h1 className={styles.heroTitle}>
              TẶNG NGAY MÀN HÌNH GAMING CAO CẤP
            </h1>

            <p className={styles.heroSubtitle}>
              KHI MUA MÁY TÍNH ĐỂ BÀN MSI GAMING ĐƯỢC CHỈ ĐỊNH
            </p>

            <button
              type="button"
              className={styles.shopNowBtn}
              onClick={() => navigate('/products')}
            >
              XEM NGAY
            </button>

            <p className={styles.validityNotice}>
              ÁP DỤNG ĐẾN HẾT NGÀY 07/09/2026 HOẶC ĐẾN KHI HẾT QUÀ TẶNG.
            </p>
          </div>

          <div className={styles.heroRight}>
            <div className={styles.bonusBadge}>
              <span>TRỊ GIÁ LÊN ĐẾN</span>
              <strong>8.990.000₫</strong>
            </div>

            <div className={styles.techArtwork}>
              <img
                src="https://images.unsplash.com/photo-1547082299-de196ea013d6?w=600&auto=format&fit=crop&q=80"
                alt="MSI Gaming Monitor and PC"
                className={styles.monitorImg}
              />
              <img
                src="https://images.unsplash.com/photo-1587831990711-23ca6441447b?w=400&auto=format&fit=crop&q=80"
                alt="MSI Gaming Desktop Tower"
                className={styles.desktopImg}
              />
            </div>

            <div className={styles.intelBadge}>
              <span>intel</span>
              <strong>CORE i9</strong>
              <small>10TH GEN</small>
            </div>
          </div>

          <button type="button" className={styles.bannerArrowRight} aria-label="Banner kế tiếp">
            ›
          </button>
        </div>

        <div className={styles.heroDots}>
          <span className={`${styles.dot} ${styles.activeDot}`} />
          <span className={styles.dot} />
          <span className={styles.dot} />
        </div>
      </section>

      {/* 2. New Products Carousel */}
      <section className={styles.sectionWrap} id="san-pham-noi-bat">
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionHeading}>
            Sản phẩm mới <span className={styles.subHeading}>(Sản phẩm nổi bật)</span>
          </h2>
          <a href="/products" className={styles.seeAllLink}>
            Xem tất cả sản phẩm
          </a>
        </div>

        <div className={styles.carouselContainer}>
          <button type="button" className={styles.carouselArrowLeft} aria-label="Xem sản phẩm trước">
            ‹
          </button>

          <div className={styles.productRowSix}>
            {newProducts.map(prod => (
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
                  <div className={styles.stars}>★★★★★</div>
                  <span className={styles.reviewCount}>({prod.reviews} đánh giá)</span>
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
                    onClick={e => {
                      e.stopPropagation()
                      navigate('/cart')
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="9" cy="21" r="1" />
                      <circle cx="20" cy="21" r="1" />
                      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                    </svg>
                    <span>Thêm vào giỏ</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button type="button" className={styles.carouselArrowRight} aria-label="Xem thêm sản phẩm">
            ›
          </button>
        </div>
      </section>

      {/* 3. Zip Financing Promo Bar */}
      <section className={styles.zipBanner} id="zip-financing" aria-label="Ưu đãi trả góp Zip">
        <div className={styles.zipInner}>
          <div className={styles.zipBadgeCircle}>
            <span className={styles.zipLogoText}>zip</span>
          </div>
          <span className={styles.zipDivider}>|</span>
          <div className={styles.zipMessage}>
            <strong>Sở hữu ngay hôm nay, trả góp 0% lãi suất lên đến 6 tháng cùng Zip.</strong>
            <a href="#zip-learn-more" id="zip-learn-more" className={styles.learnMoreLink}>
              Tìm hiểu thêm
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
              <h2 className={styles.verticalTitle}>Dàn máy &amp; Thiết bị</h2>
              <span className={styles.verticalSubtitle}>Khám phá thêm sản phẩm</span>
            </div>
            <a href="/products" className={styles.verticalLink}>
              Xem tất cả sản phẩm
            </a>
          </div>

          <div className={styles.fiveCardsRow}>
            {initialCustomBuilds.map(item => (
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
                  <div className={styles.stars}>★★★★★</div>
                  <span className={styles.reviewCount}>({item.reviews} đánh giá)</span>
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
                    onClick={e => {
                      e.stopPropagation()
                      navigate('/cart')
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="9" cy="21" r="1" />
                      <circle cx="20" cy="21" r="1" />
                      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                    </svg>
                    <span>Thêm vào giỏ</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. MSI Laptop Series Tabs & Section */}
      <section className={styles.sectionWrap} id="msi-series">
        <div className={styles.seriesTabs}>
          {(['GS', 'GT', 'GL', 'GE'] as const).map(tab => (
            <button
              key={tab}
              type="button"
              className={`${styles.seriesTabBtn} ${activeSeriesTab === tab ? styles.activeSeriesTab : ''}`}
              onClick={() => setActiveSeriesTab(tab)}
            >
              MSI {tab} Series
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
              <h2 className={styles.verticalTitle}>MSI {activeSeriesTab} Series</h2>
              <span className={styles.verticalSubtitle}>Laptop gaming cao cấp</span>
            </div>
            <a href="/products?category=laptop" className={styles.verticalLink}>
              Xem tất cả sản phẩm
            </a>
          </div>

          <div className={styles.fiveCardsRow}>
            {currentSeriesList.map(item => (
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
                  <div className={styles.stars}>★★★★★</div>
                  <span className={styles.reviewCount}>({item.reviews} đánh giá)</span>
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
                    onClick={e => {
                      e.stopPropagation()
                      navigate('/cart')
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="9" cy="21" r="1" />
                      <circle cx="20" cy="21" r="1" />
                      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                    </svg>
                    <span>Thêm vào giỏ</span>
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
            onClick={() => navigate('/products')}
          >
            Xem thêm sản phẩm
          </button>
        </div>
      </section>

      {/* 6. Brand Logos Bar */}
      <section className={styles.brandLogosBar} aria-label="Thương hiệu hợp tác">
        <div className={styles.brandLogosInner}>
          <span className={styles.brandNameLogo}>ROCCAT</span>
          <span className={styles.brandNameLogo}>msi</span>
          <span className={styles.brandNameLogo}>RAZER</span>
          <span className={styles.brandNameLogo}>thermaltake</span>
          <span className={styles.brandNameLogo}>ADATA</span>
          <span className={styles.brandNameLogo}>hp</span>
          <span className={styles.brandNameLogo}>GIGABYTE</span>
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
