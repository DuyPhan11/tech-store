import { Button } from '../../../components/ui/Button'
import styles from './ProductListPage.module.css'

export function Pagination({ page, pages, onChange }: { page: number; pages: number; onChange: (page: number) => void }) {
  if (pages < 2) return null
  return (
    <nav aria-label="Phân trang sản phẩm" className={styles.pagination}>
      <Button variant="outline" disabled={page <= 1} onClick={() => onChange(page - 1)}>Trang trước</Button>
      <span aria-current="page">Trang {page} / {pages}</span>
      <Button variant="outline" disabled={page >= pages} onClick={() => onChange(page + 1)}>Trang sau</Button>
    </nav>
  )
}
