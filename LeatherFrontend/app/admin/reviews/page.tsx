'use client'

import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api'
import Image from 'next/image'
import { Check, X, Star } from 'lucide-react'
import { format } from 'date-fns'

type Review = {
  _id: string
  user: {
    _id: string
    userName: string
    profileImage?: string
  }
  product: {
    _id: string
    name: string
    image?: string
  }
  rating: number
  comment: string
  isApproved: boolean
  createdAt: string
  imageUrls?: string[]
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)

  const fetchReviews = async () => {
    try {
      setLoading(true)
      const res = await apiFetch('/api/v1/admin/reviews/pending')
      if (res?.data) setReviews(res.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReviews()
  }, [])

  const approveReview = async (id: string) => {
    if (!id || typeof id !== 'string') {
      alert('Invalid review ID')
      return
    }

    try {
      console.log('Approving review with ID:', id)
      const response = await apiFetch(`/api/v1/reviews/approve/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      console.log('Approval response:', response)

      if (response && response.success !== false) {
        setReviews(prev => prev.filter(r => r._id !== id))
        alert('Review approved successfully')
      } else {
        throw new Error(response?.message || 'Approval failed')
      }
    } catch (e: any) {
      console.error('Approve review error:', e)
      const errorMessage = e?.message || e?.body?.message || 'Unknown error occurred'
      alert(`Failed to approve review: ${errorMessage}`)
    }
  }

  const rejectReview = async (id: string) => {
    if (!id || typeof id !== 'string') {
      alert('Invalid review ID')
      return
    }

    if (!confirm('Are you sure you want to reject (delete) this review?')) return

    try {
      console.log('Rejecting review with ID:', id)
      const response = await apiFetch(`/api/v1/reviews/${id}`, {
        method: 'DELETE'
      })

      console.log('Rejection response:', response)

      if (response && response.success !== false) {
        setReviews(prev => prev.filter(r => r._id !== id))
        alert('Review rejected successfully')
      } else {
        throw new Error(response?.message || 'Rejection failed')
      }
    } catch (e: any) {
      console.error('Reject review error:', e)
      const errorMessage = e?.message || e?.body?.message || 'Unknown error occurred'
      alert(`Failed to reject review: ${errorMessage}`)
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-serif">Pending Reviews</h1>
      
      {loading ? (
        <p>Loading reviews...</p>
      ) : reviews.length === 0 ? (
        <p className="text-muted-foreground">No pending reviews.</p>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted border-b">
              <tr>
                <th className="p-4 font-medium">User</th>
                <th className="p-4 font-medium">Product</th>
                <th className="p-4 font-medium">Rating</th>
                <th className="p-4 font-medium">Comment</th>
                <th className="p-4 font-medium">Date</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {reviews.map(review => (
                <tr key={review._id} className="hover:bg-muted/50">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="relative w-8 h-8 rounded-full overflow-hidden bg-gray-200">
                        {review.user?.profileImage && (
                          <Image src={review.user.profileImage} alt={review.user.userName} fill className="object-cover" />
                        )}
                      </div>
                      <span className="font-medium">{review.user?.userName || 'Unknown User'}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="font-medium">{review.product?.name || 'Unknown Product'}</span>
                  </td>
                  <td className="p-4">
                    <div className="flex text-yellow-500">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} size={14} fill={i < review.rating ? "currentColor" : "none"} className={i < review.rating ? "" : "text-gray-300"} />
                      ))}
                    </div>
                  </td>
                  <td className="p-4 max-w-xs">
                    <p className="truncate">{review.comment}</p>
                    {review.imageUrls && review.imageUrls.length > 0 && (
                      <div className="flex gap-1 mt-2">
                        {review.imageUrls.map((url, i) => (
                          <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="block relative w-10 h-10 border rounded overflow-hidden">
                            <Image src={url} alt="Review attachment" fill className="object-cover" />
                          </a>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="p-4 text-muted-foreground">
                    {format(new Date(review.createdAt), 'MMM d, yyyy')}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => approveReview(review._id)}
                        className="p-2 bg-green-100 text-green-700 rounded hover:bg-green-200 transition"
                        title="Approve"
                      >
                        <Check size={16} />
                      </button>
                      <button 
                        onClick={() => rejectReview(review._id)}
                        className="p-2 bg-red-100 text-red-700 rounded hover:bg-red-200 transition"
                        title="Reject"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
