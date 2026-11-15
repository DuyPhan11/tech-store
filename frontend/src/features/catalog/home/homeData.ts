export interface HomeCategory {
  id: string
  name: string
  image: string
}

export interface HomeProduct {
  id: string
  categoryId: string
  name: string
  specification: string
  image: string
  priceVnd: number
}

export interface HomeData {
  categories: readonly HomeCategory[]
  featured: readonly HomeProduct[]
  discover: readonly HomeProduct[]
}
