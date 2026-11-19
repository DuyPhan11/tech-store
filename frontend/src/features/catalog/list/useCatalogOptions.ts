import { useEffect, useState } from 'react'
import { catalogApi } from '../../../lib/api/catalogApi'
import { toBrandOptions, toCategoryOptions, type CatalogOption } from './catalogTypes'

export interface CatalogOptionsState {
  categories: readonly CatalogOption[]
  brands: readonly CatalogOption[]
  status: 'loading' | 'ready' | 'error'
}

/**
 * Nạp danh mục / thương hiệu đang ACTIVE từ backend để bộ lọc catalog công khai phản ánh
 * thay đổi của Admin (UC12, ADR-018 A6). Khi lỗi, trả danh sách rỗng — không dùng dữ liệu mẫu.
 */
export function useCatalogOptions(): CatalogOptionsState {
  const [state, setState] = useState<CatalogOptionsState>({ categories: [], brands: [], status: 'loading' })

  useEffect(() => {
    const controller = new AbortController()
    Promise.all([catalogApi.getCategories(controller.signal), catalogApi.getBrands(controller.signal)])
      .then(([cats, brands]) => {
        setState({ categories: toCategoryOptions(cats), brands: toBrandOptions(brands), status: 'ready' })
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setState({ categories: [], brands: [], status: 'error' })
        }
      })
    return () => controller.abort()
  }, [])

  return state
}
