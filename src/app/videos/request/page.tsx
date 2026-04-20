'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Plus, Send, X, Check, Clock, AlertCircle } from 'lucide-react'
import { VideoRequest, User } from '@/types/enhanced-types'
import { getCurrentUser, supabase } from '@/lib/supabase'

export default function VideoRequestPage() {
  const [user, setUser] = useState<User | null>(null)
  const [requests, setRequests] = useState<VideoRequest[]>([])
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const router = useRouter()

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    source_url: ''
  })

  useEffect(() => {
    const loadUserAndRequests = async () => {
      try {
        const currentUser = await getCurrentUser()
        if (!currentUser) {
          router.push('/login')
          return
        }
        setUser(currentUser as User)

        // Fetch user's video requests
        const { data: requestsData, error } = await supabase
          .from('video_requests')
          .select('*')
          .eq('requested_by', currentUser.id)
          .order('created_at', { ascending: false })

        if (error) throw error
        setRequests(requestsData || [])
      } catch (error) {
        console.error('Error loading requests:', error)
      } finally {
        setLoading(false)
      }
    }

    loadUserAndRequests()
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setSubmitting(true)
    try {
      const { data, error } = await supabase
        .from('video_requests')
        .insert({
          title: formData.title,
          description: formData.description,
          source_url: formData.source_url,
          requested_by: user.id
        })
        .select()
        .single()

      if (error) throw error

      setRequests([data, ...requests])
      setFormData({ title: '', description: '', source_url: '' })
      setShowForm(false)
    } catch (error) {
      console.error('Error submitting request:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusIcon = (status: VideoRequest['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'approved':
        return <Check className="h-4 w-4 text-green-500" />
      case 'rejected':
        return <X className="h-4 w-4 text-red-500" />
      case 'completed':
        return <Check className="h-4 w-4 text-blue-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: VideoRequest['status']) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-500 bg-yellow-500 bg-opacity-20'
      case 'approved':
        return 'text-green-500 bg-green-500 bg-opacity-20'
      case 'rejected':
        return 'text-red-500 bg-red-500 bg-opacity-20'
      case 'completed':
        return 'text-blue-500 bg-blue-500 bg-opacity-20'
      default:
        return 'text-gray-500 bg-gray-500 bg-opacity-20'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Video Requests</h1>
            <p className="text-gray-400">Request new movies and videos to be added to the library</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Request
          </button>
        </div>

        {/* Request Form */}
        {showForm && (
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">Request a New Video</h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                  placeholder="Enter video title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                  placeholder="Describe the video (optional)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Source URL
                </label>
                <input
                  type="url"
                  value={formData.source_url}
                  onChange={(e) => setFormData({ ...formData, source_url: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                  placeholder="Mega.nz link, Google Drive link, etc. (optional)"
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {submitting ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Requests List */}
        <div className="space-y-4">
          {requests.length === 0 ? (
            <div className="text-center py-12">
              <div className="h-24 w-24 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus className="h-12 w-12 text-gray-600" />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">No video requests yet</h3>
              <p className="text-gray-400 mb-4">Start by requesting your first video</p>
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                Make a Request
              </button>
            </div>
          ) : (
            requests.map((request) => (
              <div key={request.id} className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-1">{request.title}</h3>
                    {request.description && (
                      <p className="text-gray-400 text-sm mb-2">{request.description}</p>
                    )}
                    {request.source_url && (
                      <a
                        href={request.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 text-sm"
                      >
                        View Source
                      </a>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-3 py-1 text-xs rounded-full flex items-center space-x-1 ${getStatusColor(request.status)}`}>
                      {getStatusIcon(request.status)}
                      <span className="capitalize">{request.status}</span>
                    </span>
                  </div>
                </div>

                {request.rejection_reason && (
                  <div className="bg-red-500 bg-opacity-20 border border-red-500 border-opacity-30 rounded-lg p-3 mb-3">
                    <p className="text-red-400 text-sm">
                      <strong>Reason:</strong> {request.rejection_reason}
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between text-sm text-gray-400">
                  <span>Requested on {formatDate(request.created_at)}</span>
                  {request.approved_at && (
                    <span>Approved on {formatDate(request.approved_at)}</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Navigation */}
        <div className="mt-8 flex justify-center">
          <Link
            href="/videos"
            className="text-blue-400 hover:text-blue-300 text-sm"
          >
            Browse Video Library
          </Link>
        </div>
      </div>
    </div>
  )
}
