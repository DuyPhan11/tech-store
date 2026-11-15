import { Card } from '../../components/ui/Card'
import styles from './ProductCard.module.css'

const currency = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })

export interface ProductCardData {
  id: string
  name: string
  slug?: string
  priceVnd: number
  image: string
  specification?: string
  brandId?: string
}

export interface ProductCardProps {
  product: ProductCardData
  brandName?: string
  href?: string
  className?: string
}

export function ProductCard({ product, brandName, href, className = '' }: ProductCardProps) {
  const targetHref = href ?? (product.slug ? `/products/${product.slug}` : undefined)

  return (
    <Card
      className={`${styles.productCard} ${className}`}
      media={
        targetHref ? (
          <a href={targetHref} tabIndex={-1} aria-hidden="true">
            <img src={product.image} alt="" loading="lazy" className={styles.image} />
          </a>
        ) : (
          <img src={product.image} alt={product.name} loading="lazy" className={styles.image} />
        )
      }
    >
      {brandName && <small className={styles.brand}>{brandName}</small>}
      <h3 className={styles.title}>
        {targetHref ? (
          <a href={targetHref} className={styles.titleLink}>
            {product.name}
          </a>
        ) : (
          product.name
        )}
      </h3>
      {product.specification && <p className={styles.specs}>{product.specification}</p>}
      <strong className={styles.price}>{currency.format(product.priceVnd)}</strong>
    </Card>
  )
}
