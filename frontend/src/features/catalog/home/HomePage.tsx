import { useState } from 'react'
import { Button } from '../../../components/ui/Button'
import { Card } from '../../../components/ui/Card'
import type { HomeData } from './homeData'
import hero from './assets/hero.jpg'
import styles from './HomePage.module.css'

const currency = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })

export function HomePage({ data }: { data: HomeData }) {
  const [expanded, setExpanded] = useState(false)
  const groups = data.categories.map(category => ({
    ...category,
    products: data.discover.filter(product => product.categoryId === category.id),
  }))
  const canExpand = groups.some(group => group.products.length > 1)

  return (
    <div className={styles.home}>
      <section className={styles.hero} aria-labelledby="home-title">
        <div className={styles.intro}>
          <h1 id="home-title">Thiết bị cho góc làm việc của bạn</h1>
          <p>Khám phá laptop, màn hình và thiết bị cá nhân tại Tech Store.</p>
          <a className={styles.cta} href="#san-pham-noi-bat">Khám phá sản phẩm <span aria-hidden="true">↓</span></a>
        </div>
        <img className={styles.heroPhoto} src={hero} alt="Laptop, điện thoại và tai nghe trên bục trưng bày xanh" />
      </section>

      <section aria-labelledby="category-title">
        <h2 id="category-title">Danh mục nổi bật</h2>
        <div className={styles.categoryGrid}>
          {groups.map(category => (
            <a key={category.id} href={`/products?category=${category.id}`} className={styles.category}>
              <img src={category.image} alt="" />
              {category.name}<span aria-hidden="true">↗</span>
            </a>
          ))}
        </div>
      </section>

      <section id="san-pham-noi-bat" aria-labelledby="featured-title">
        <h2 id="featured-title">Sản phẩm nổi bật</h2>
        <p className={styles.note}>Sản phẩm, hình ảnh và giá trên trang dùng để minh họa.</p>
        <div className={styles.products}>
          {data.featured.map(product => (
            <Card
              key={product.id}
              className={styles.product}
              media={
                <a href={`/products/${product.id}`} tabIndex={-1} aria-hidden="true">
                  <img src={product.image} alt="" loading="lazy" />
                </a>
              }
            >
              <h3>
                <a href={`/products/${product.id}`} className={styles.productLink}>
                  {product.name}
                </a>
              </h3>
              <p>{product.specification}</p>
              <strong>{currency.format(product.priceVnd)}</strong>
            </Card>
          ))}
        </div>
      </section>

      <section aria-labelledby="discover-title">
        <h2 id="discover-title">Khám phá thêm sản phẩm</h2>
        <div id="discover-groups" className={styles.discover}>
          {groups.map(group => (
            <section key={group.id} id={`nhom-${group.id}`} tabIndex={-1} className={styles.group}>
              <h3>{group.name}</h3>
              {group.products.length === 0 && <p>Chưa có sản phẩm minh họa.</p>}
              {(expanded ? group.products : group.products.slice(0, 1)).map(product => (
                <article key={product.id} className={styles.compact}>
                  <a href={`/products/${product.id}`} tabIndex={-1} aria-hidden="true">
                    <img src={product.image} alt="" loading="lazy" />
                  </a>
                  <div>
                    <h4>
                      <a href={`/products/${product.id}`} className={styles.productLink}>
                        {product.name}
                      </a>
                    </h4>
                    <p>{product.specification}</p>
                    <strong>{currency.format(product.priceVnd)}</strong>
                  </div>
                </article>
              ))}
            </section>
          ))}
        </div>
        {canExpand && !expanded && <Button variant="outline" aria-controls="discover-groups"
          onClick={() => setExpanded(true)}>Xem thêm sản phẩm</Button>}
        {expanded && <p role="status" className={styles.note}>Đã hiển thị tất cả sản phẩm minh họa.</p>}
      </section>
    </div>
  )
}
