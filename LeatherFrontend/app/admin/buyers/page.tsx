'use client'

import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import { toast } from 'sonner'

type User = {
  _id: string
  userName: string
  userEmail: string
  phoneNumber: string
  userAddress: string
  userRole: 'customer' | 'admin'
  profileImage?: string
  isVerified: boolean
  createdAt: string
}

export default function AdminBuyersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await apiFetch('/api/v1/admin/users', {
        method: 'GET',
      })
      
      if (response?.data) {
        setUsers(response.data)
      } else {
        setError('Failed to fetch users')
      }
    } catch (err: any) {
      const errorMsg = err?.message || 'Failed to fetch users'
      setError(errorMsg)
      toast.error(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (confirm(`Are you sure you want to delete ${userName}?`)) {
      try {
        await apiFetch(`/api/v1/admin/users/${userId}`, {
          method: 'DELETE',
        })
        toast.success(`User ${userName} deleted successfully`)
        setUsers(users.filter(u => u._id !== userId))
      } catch (err: any) {
        toast.error(err?.message || 'Failed to delete user')
      }
    }
  }

  const handleToggleRole = async (userId: string, currentRole: string, userName: string) => {
    try {
      const newRole = currentRole === 'admin' ? 'customer' : 'admin'
      await apiFetch(`/api/v1/admin/users/${userId}/role`, {
        method: 'PUT',
        body: JSON.stringify({ userRole: newRole }),
      })
      toast.success(`${userName} role changed to ${newRole}`)
      setUsers(users.map(u => 
        u._id === userId ? { ...u, userRole: newRole as 'customer' | 'admin' } : u
      ))
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update user role')
    }
  }

  const filteredUsers = users.filter(user =>
    user.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.phoneNumber.includes(searchTerm)
  )

  if (loading) {
    return (
      <div>
        <h2 className="text-2xl font-serif mb-4">Users</h2>
        <p className="text-sm opacity-70">Loading users...</p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-serif">Users</h2>
        <Button onClick={fetchUsers} className="bg-primary hover:bg-primary/90">
          Refresh
        </Button>
      </div>

      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

      {/* Search Bar */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search by name, email, or phone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full border border-border px-4 py-2 text-sm outline-none focus:border-accent transition"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="border border-border p-4 rounded">
          <p className="text-sm opacity-70">Total Users</p>
          <p className="text-2xl font-serif">{users.length}</p>
        </div>
        <div className="border border-border p-4 rounded">
          <p className="text-sm opacity-70">Customers</p>
          <p className="text-2xl font-serif">{users.filter(u => u.userRole === 'customer').length}</p>
        </div>
        <div className="border border-border p-4 rounded">
          <p className="text-sm opacity-70">Admins</p>
          <p className="text-2xl font-serif">{users.filter(u => u.userRole === 'admin').length}</p>
        </div>
      </div>

      {/* Users Table */}
      <div className="overflow-x-auto border border-border rounded">
        <table className="w-full">
          <thead className="bg-muted border-b border-border">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium">Profile</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Name</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Email</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Phone</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Address</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Role</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Joined</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <tr key={user._id} className="border-b border-border hover:bg-muted/50 transition">
                  <td className="px-4 py-3">
                    {user.profileImage ? (
                      <div className="w-10 h-10 rounded-full overflow-hidden">
                        <Image
                          src={user.profileImage}
                          alt={user.userName}
                          width={40}
                          height={40}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-xs font-semibold">
                        {user.userName.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm">{user.userName}</td>
                  <td className="px-4 py-3 text-sm">{user.userEmail}</td>
                  <td className="px-4 py-3 text-sm">{user.phoneNumber}</td>
                  <td className="px-4 py-3 text-sm">{user.userAddress}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      user.userRole === 'admin' 
                        ? 'bg-red-100 text-red-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {user.userRole}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      user.isVerified
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {user.isVerified ? 'Verified' : 'Pending'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleToggleRole(user._id, user.userRole, user.userName)}
                        className="bg-accent hover:bg-accent/90 text-white text-xs"
                      >
                        Make {user.userRole === 'admin' ? 'Customer' : 'Admin'}
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleDeleteUser(user._id, user.userName)}
                        className="bg-red-600 hover:bg-red-700 text-white text-xs"
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-sm opacity-70">
                  No users found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

