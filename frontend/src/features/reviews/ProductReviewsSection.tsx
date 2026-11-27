import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { reviewApi } from '../../lib/api/reviewApi'
import type { EligibleReviewOrder, ProductReviewsResponse, ReviewResponse } from './reviewTypes'
import styles from './ProductReviewsSection.module.css'

interface ProductReviewsSectionProps {
  productId: number
}

function renderStars(rating: number) {
  const rounded = Math.round(rating)
  return (
    <span className={styles.starsDisplay} aria-label={`${rating} trên 5 sao`}>
      {[1, 2, 3, 4, 5].map(n => (
        <span key={n} className={n <= rounded ? undefined : styles.starEmpty}>★</span>
      ))}
    </span>
  )
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  } catch {
    return iso
  }
}

export function ProductReviewsSection({ productId }: ProductReviewsSectionProps) {
  const { user, isAuthenticated } = useAuth()
  const isCustomer = Boolean(isAuthenticated && user?.roles?.includes('ROLE_CUSTOMER'))

  const [reviewsData, setReviewsData] = useState<ProductReviewsResponse | null>(null)
  const [eligibleOrders, setEligibleOrders] = useState<EligibleReviewOrder[]>([])
  const [loading, setLoading] = useState(true)

  // Create form state
  const [selectedOrderId, setSelectedOrderId] = useState<number | ''>('')
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Inline edit state
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editRating, setEditRating] = useState(5)
  const [editComment, setEditComment] = useState('')

  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const loadData = useCallback(async (signal?: AbortSignal) => {
    setLoading(true)
    try {
      const data = await reviewApi.getProductReviews(productId, signal)
      if (!signal?.aborted) {
        setReviewsData(data)
      }
      if (isCustomer && !signal?.aborted) {
        const eligible = await reviewApi.getEligibleOrders(productId)
        if (!signal?.aborted) {
          setEligibleOrders(eligible)
          setSelectedOrderId(eligible.length > 0 ? eligible[0].orderId : '')
        }
      } else if (!signal?.aborted) {
        setEligibleOrders([])
        setSelectedOrderId('')
      }
    } catch {
      // Keep graceful empty state if API is unavailable during static render
    } finally {
      if (!signal?.aborted) setLoading(false)
    }
  }, [productId, isCustomer])

  useEffect(() => {
    const controller = new AbortController()
    void loadData(controller.signal)
    return () => controller.abort()
  }, [loadData])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)
    setSuccessMsg(null)
    if (!selectedOrderId) {
      setErrorMsg('Vui lòng chọn đơn hàng đã hoàn tất.')
      return
    }
    if (!comment.trim()) {
      setErrorMsg('Vui lòng nhập nội dung đánh giá.')
      return
    }
    setSubmitting(true)
    try {
      await reviewApi.createReview({
        productId,
        orderId: Number(selectedOrderId),
        rating,
        comment: comment.trim(),
      })
      setComment('')
      setRating(5)
      setSuccessMsg('Đã gửi đánh giá sản phẩm thành công!')
      await loadData()
    } catch (err: unknown) {
      setErrorMsg((err as Error)?.message || 'Không thể gửi đánh giá.')
    } finally {
      setSubmitting(false)
    }
  }

  const startEdit = (r: ReviewResponse) => {
    setEditingId(r.id)
    setEditRating(r.rating)
    setEditComment(r.comment)
    setErrorMsg(null)
    setSuccessMsg(null)
  }

  const handleSaveEdit = async (reviewId: number) => {
    setErrorMsg(null)
    setSuccessMsg(null)
    if (!editComment.trim()) {
      setErrorMsg('Nội dung đánh giá không được để trống.')
      return
    }
    setSubmitting(true)
    try {
      await reviewApi.updateReview(reviewId, {
        rating: editRating,
        comment: editComment.trim(),
      })
      setEditingId(null)
      setSuccessMsg('Đã cập nhật đánh giá.')
      await loadData()
    } catch (err: unknown) {
      setErrorMsg((err as Error)?.message || 'Không thể cập nhật đánh giá.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleHide = async (reviewId: number) => {
    setErrorMsg(null)
    setSuccessMsg(null)
    setSubmitting(true)
    try {
      await reviewApi.hideReview(reviewId)
      setSuccessMsg('Đã ẩn đánh giá của bạn khỏi danh sách công khai.')
      await loadData()
    } catch (err: unknown) {
      setErrorMsg((err as Error)?.message || 'Không thể ẩn đánh giá.')
    } finally {
      setSubmitting(false)
    }
  }

  const totalReviews = reviewsData?.totalReviews ?? 0
  const averageRating = reviewsData?.averageRating ?? 0
  const reviews = reviewsData?.reviews ?? []

  return (
    <div className={styles.reviewsContainer}>
      <div className={styles.summaryBar}>
        <div className={styles.ratingOverview}>
          <span className={styles.averageScore}>{averageRating.toFixed(1)}</span>
          <div className={styles.averageMeta}>
            {renderStars(averageRating)}
            <span className={styles.totalCount}>{totalReviews} đánh giá hiển thị</span>
          </div>
        </div>
        {!isCustomer && (
          <p className={styles.noticeInfo}>
            Chỉ khách hàng đã mua và hoàn tất đơn hàng (COMPLETED) mới có thể viết đánh giá.
          </p>
        )}
      </div>

      {errorMsg && <p className={styles.noticeError} role="alert">{errorMsg}</p>}
      {successMsg && <p className={styles.noticeSuccess} role="status">{successMsg}</p>}

      {isCustomer && eligibleOrders.length > 0 && (
        <form className={styles.reviewFormCard} onSubmit={handleCreate}>
          <h3 className={styles.formTitle}>Viết đánh giá của bạn</h3>
          <div className={styles.formField}>
            <label htmlFor="review-order-select">Đơn hàng đã hoàn tất</label>
            <select
              id="review-order-select"
              value={selectedOrderId}
              onChange={e => setSelectedOrderId(Number(e.target.value))}
            >
              {eligibleOrders.map(o => (
                <option key={o.orderId} value={o.orderId}>
                  #{o.orderCode} ({formatDate(o.completedAt)})
                </option>
              ))}
            </select>
          </div>
          <div className={styles.formField}>
            <label>Đánh giá sao</label>
            <div className={styles.starPicker} role="group" aria-label="Chọn số sao">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  type="button"
                  className={`${styles.starBtn} ${rating === star ? styles.starBtnActive : ''}`}
                  onClick={() => setRating(star)}
                >
                  {star} ★
                </button>
              ))}
            </div>
          </div>
          <div className={styles.formField}>
            <label htmlFor="review-comment-input">Nhận xét sản phẩm</label>
            <textarea
              id="review-comment-input"
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Chia sẻ trải nghiệm sử dụng sản phẩm của bạn..."
              maxLength={2000}
              required
            />
          </div>
          <button type="submit" className={styles.submitBtn} disabled={submitting}>
            {submitting ? 'Đang gửi...' : 'Gửi đánh giá'}
          </button>
        </form>
      )}

      {isCustomer && !loading && eligibleOrders.length === 0 && (
        <p className={styles.noticeInfo}>
          Bạn chưa có đơn hàng hoàn tất (COMPLETED) nào chưa đánh giá cho sản phẩm này.
        </p>
      )}

      {loading && <p className={styles.noticeInfo}>Đang tải đánh giá...</p>}

      {!loading && reviews.length === 0 && (
        <p className={styles.noticeInfo}>Chưa có đánh giá nào cho sản phẩm này.</p>
      )}

      {reviews.length > 0 && (
        <div className={styles.reviewList}>
          {reviews.map(r => {
            const isOwner = Boolean(isCustomer && user?.id === r.userId)
            const isEditing = editingId === r.id
            return (
              <article key={r.id} className={styles.reviewItem}>
                <div className={styles.reviewItemHeader}>
                  <div className={styles.authorBlock}>
                    <span className={styles.authorName}>{r.authorName}</span>
                    <span className={styles.verifiedBadge}>Đã mua hàng #{r.orderCode}</span>
                  </div>
                  <span className={styles.reviewDate}>{formatDate(r.createdAt)}</span>
                </div>

                {isEditing ? (
                  <div className={styles.reviewFormCard}>
                    <div className={styles.starPicker}>
                      {[1, 2, 3, 4, 5].map(star => (
                        <button
                          key={star}
                          type="button"
                          className={`${styles.starBtn} ${editRating === star ? styles.starBtnActive : ''}`}
                          onClick={() => setEditRating(star)}
                        >
                          {star} ★
                        </button>
                      ))}
                    </div>
                    <textarea
                      value={editComment}
                      onChange={e => setEditComment(e.target.value)}
                      maxLength={2000}
                    />
                    <div className={styles.ownerActions}>
                      <button
                        type="button"
                        className={styles.submitBtn}
                        onClick={() => void handleSaveEdit(r.id)}
                        disabled={submitting}
                      >
                        Lưu
                      </button>
                      <button
                        type="button"
                        className={styles.actionBtn}
                        onClick={() => setEditingId(null)}
                        disabled={submitting}
                      >
                        Hủy
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div>{renderStars(r.rating)}</div>
                    <p className={styles.reviewComment}>{r.comment}</p>
                    {isOwner && (
                      <div className={styles.ownerActions}>
                        <button
                          type="button"
                          className={styles.actionBtn}
                          onClick={() => startEdit(r)}
                          disabled={submitting}
                        >
                          Sửa
                        </button>
                        <button
                          type="button"
                          className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                          onClick={() => void handleHide(r.id)}
                          disabled={submitting}
                        >
                          Ẩn đánh giá
                        </button>
                      </div>
                    )}
                  </>
                )}
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
