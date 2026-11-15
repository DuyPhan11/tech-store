import { useState } from 'react'
import type { ProductImage } from '../list/catalogTypes'
import styles from './ProductDetailPage.module.css'

export interface ProductGalleryProps {
  images: ProductImage[]
  productName: string
}

export function ProductGallery({ images, productName }: ProductGalleryProps) {
  // Giới hạn tối đa 8 ảnh, sắp xếp theo displayOrder
  const sortedImages = [...images]
    .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
    .slice(0, 8)

  const primaryIndex = sortedImages.findIndex(img => img.isPrimary)
  const initialIndex = primaryIndex >= 0 ? primaryIndex : 0

  const [selectedIndex, setSelectedIndex] = useState(initialIndex)

  if (sortedImages.length === 0) {
    return (
      <div className={styles.gallery}>
        <div className={styles.mainImageWrapper}>
          <div className={styles.imageFallback} role="img" aria-label={`Ảnh đại diện ${productName}`}>
            <span>Chưa có ảnh</span>
          </div>
        </div>
      </div>
    )
  }

  const currentImage = sortedImages[selectedIndex] ?? sortedImages[0]

  return (
    <div className={styles.gallery}>
      <div className={styles.mainImageWrapper}>
        <img
          src={currentImage.url}
          alt={currentImage.alt || `${productName} - Ảnh ${selectedIndex + 1}`}
          className={styles.mainImage}
        />
      </div>

      {sortedImages.length > 1 && (
        <div className={styles.thumbnailList} role="tablist" aria-label="Danh sách hình ảnh sản phẩm">
          {sortedImages.map((img, index) => {
            const isSelected = index === selectedIndex
            return (
              <button
                key={img.id ?? index}
                type="button"
                role="tab"
                aria-selected={isSelected}
                aria-label={`Xem ảnh ${index + 1} của ${productName}`}
                className={styles.thumbnailButton}
                data-selected={isSelected}
                onClick={() => setSelectedIndex(index)}
              >
                <img
                  src={img.url}
                  alt=""
                  loading="lazy"
                  className={styles.thumbnailImage}
                />
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
