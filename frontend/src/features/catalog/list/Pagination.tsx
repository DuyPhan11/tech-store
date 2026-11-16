import styles from './ProductListPage.module.css'

export function Pagination({ page, pages, onChange }: { page: number; pages: number; onChange: (page: number) => void }) {
  if (pages < 2) return null

  // Generate page numbers with ellipsis
  const getPageNumbers = () => {
    const list: (number | string)[] = []
    if (pages <= 6) {
      for (let i = 1; i <= pages; i++) list.push(i)
    } else {
      list.push(1)
      if (page > 3) list.push('...')
      const start = Math.max(2, page - 1)
      const end = Math.min(pages - 1, page + 1)
      for (let i = start; i <= end; i++) list.push(i)
      if (page < pages - 2) list.push('...')
      list.push(pages)
    }
    return list
  }

  return (
    <nav aria-label="Phân trang sản phẩm" className={styles.pagination}>
      <button
        type="button"
        className={styles.pageCircleBtn}
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
        aria-label="Trang trước"
      >
        ‹
      </button>

      {getPageNumbers().map((item, idx) =>
        typeof item === 'number' ? (
          <button
            key={idx}
            type="button"
            className={`${styles.pageCircleBtn} ${item === page ? styles.activePage : ''}`}
            onClick={() => onChange(item)}
            aria-current={item === page ? 'page' : undefined}
          >
            {item}
          </button>
        ) : (
          <span key={idx} className={styles.pageEllipsis}>
            {item}
          </span>
        )
      )}

      <button
        type="button"
        className={styles.pageCircleBtn}
        disabled={page >= pages}
        onClick={() => onChange(page + 1)}
        aria-label="Trang sau"
      >
        ›
      </button>
    </nav>
  )
}
