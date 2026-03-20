import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useParams, useNavigate } from 'react-router-dom'
import { MoreVertical, Trash2, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import PageHeader from '../../../components/PageHeader'
import ErrorState from '../../../components/ErrorState'
import Loader from '../../../components/Loader'
import { Button } from '../../../components/ui/button'
import { Label } from '../../../components/ui/label'
import { Input } from '../../../components/ui/input'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '../../../components/ui/dropdown-menu'
import { getSession } from '../../../lib/auth'
import { getUser, updateUser, deleteUser } from '../../../services/userService'

const ICONS = ['hardhat', 'wrench', 'truck', 'clipboard', 'gear']

export default function UserProfilePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const session = getSession()
  const sessionUserId = session?.user?.id
  const currentUserRole = session?.user?.role
  
  const effectiveUserId = id || sessionUserId
  const isOwnProfile = !id || id === sessionUserId
  const isAdmin = currentUserRole === 'admin'

  const queryClient = useQueryClient()

  const [avatarUrl, setAvatarUrl] = useState<string>('')
  const [phoneNumber, setPhoneNumber] = useState<string>('')
  const [position, setPosition] = useState<string>('')

  const userQuery = useQuery({
    queryKey: ['user', effectiveUserId],
    queryFn: () => getUser(effectiveUserId!),
    enabled: !!effectiveUserId,
  })

  useEffect(() => {
    if (userQuery.data) {
      setAvatarUrl(userQuery.data.avatarUrl ?? '')
      setPhoneNumber(userQuery.data.phoneNumber ?? '')
      setPosition(userQuery.data.position ?? '')
    }
  }, [userQuery.data])

  const updateMutation = useMutation({
    mutationFn: () => updateUser(effectiveUserId!, {
      phoneNumber: phoneNumber || null,
      position: position || null,
      avatarUrl: avatarUrl || null,
      isAvatarIcon: true,
    }),
    onSuccess: (updated) => {
      toast.success('Profile updated successfully')
      queryClient.setQueryData(['user', effectiveUserId], updated)
    },
    onError: (error) => {
      toast.error('Failed to update profile: ' + (error as Error).message)
    }
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteUser(effectiveUserId!),
    onSuccess: () => {
      toast.success('User deleted successfully')
      queryClient.invalidateQueries({ queryKey: ['users'] })
      navigate('/admin/users')
    },
    onError: (error) => {
      toast.error('Failed to delete user: ' + (error as Error).message)
    }
  })

  if (!effectiveUserId) {
    return <ErrorState error={new Error('User not found')} title="Error" />
  }

  if (userQuery.isLoading) {
    return <Loader label="Loading profile..." />
  }

  if (userQuery.isError) {
    return (
      <ErrorState
        error={userQuery.error}
        onRetry={() => userQuery.refetch()}
        title="Could not load profile"
      />
    )
  }

  const user = userQuery.data
  
  if (!user) return null

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {id && (
        <Button 
          variant="ghost" 
          size="sm" 
          className="mb-2" 
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      )}

      <PageHeader
        actions={
          <div className="flex items-center gap-2">
            {isAdmin && !isOwnProfile && user.role !== 'admin' && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem 
                    className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
                    onClick={() => {
                      if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
                        deleteMutation.mutate()
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete User
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        }
        subtitle={isOwnProfile ? "Manage your personal details and avatar" : `Viewing profile for ${user.email}`}
        title={isOwnProfile ? "My Profile" : user.name}
      />

      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm space-y-6">
        <div>
          <h3 className="text-lg font-medium">Account Details</h3>
          <p className="text-sm text-slate-500 mb-4">
            {isOwnProfile ? "Contact your administrator to change read-only details." : "Information about this user account."}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-md">
            <div>
              <Label className="text-slate-500">Name</Label>
              <p className="font-medium mt-1">{user.name}</p>
            </div>
            <div>
              <Label className="text-slate-500">Email</Label>
              <p className="font-medium mt-1">{user.email}</p>
            </div>
            <div>
              <Label className="text-slate-500">Role</Label>
              <p className="font-medium mt-1 capitalize">{user.role}</p>
            </div>
            <div>
              <Label className="text-slate-500">Department</Label>
              <p className="font-medium mt-1">{user.department || 'N/A'}</p>
            </div>
          </div>
        </div>

        <div className="border-t pt-6 space-y-4">
          <h3 className="text-lg font-medium">{isOwnProfile ? "Editable Details" : "Contact Information"}</h3>
          
          <div className="space-y-2">
            <Label htmlFor="position">Industrial Position / Title</Label>
            <Input
              id="position"
              placeholder="e.g. Heavy Equipment Operator"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              disabled={!isOwnProfile && !isAdmin}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              placeholder="555-0100"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              disabled={!isOwnProfile && !isAdmin}
            />
          </div>

          {(isOwnProfile || isAdmin) && (
            <div className="space-y-2">
               <Label>Avatar Icon</Label>
               <div className="flex flex-wrap gap-3 mt-2">
                 {ICONS.map((icon) => (
                   <button
                     key={icon}
                     type="button"
                     onClick={() => setAvatarUrl(icon)}
                     className={`p-3 rounded-md border-2 capitalize transition-colors ${
                       avatarUrl === icon 
                         ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-medium' 
                         : 'border-slate-200 hover:border-slate-300 text-slate-600 bg-white'
                     }`}
                   >
                     {icon}
                   </button>
                 ))}
                 <button
                    type="button"
                    onClick={() => setAvatarUrl('')}
                    className={`p-3 rounded-md border-2 transition-colors ${
                      avatarUrl === '' 
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-medium' 
                        : 'border-slate-200 hover:border-slate-300 text-slate-600 bg-white'
                    }`}
                  >
                    None
                  </button>
               </div>
            </div>
          )}

          {(isOwnProfile || isAdmin) && (
            <div className="pt-4 flex justify-end">
               <Button 
                 onClick={() => updateMutation.mutate()} 
                 disabled={updateMutation.isPending}
               >
                 {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
               </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
