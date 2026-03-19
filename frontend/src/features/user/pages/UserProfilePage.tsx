import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import PageHeader from '../../../components/PageHeader'
import ErrorState from '../../../components/ErrorState'
import Loader from '../../../components/Loader'
import { Button } from '../../../components/ui/button'
import { Label } from '../../../components/ui/label'
import { Input } from '../../../components/ui/input'
import { getSession } from '../../../lib/auth'
import { getUser, updateUser } from '../../../services/userService'

const ICONS = ['hardhat', 'wrench', 'truck', 'clipboard', 'gear']

export default function UserProfilePage() {
  const session = getSession()
  const userId = session?.user?.id
  const queryClient = useQueryClient()

  const [avatarUrl, setAvatarUrl] = useState<string>('')
  const [phoneNumber, setPhoneNumber] = useState<string>('')
  const [position, setPosition] = useState<string>('')

  const userQuery = useQuery({
    queryKey: ['user', userId],
    queryFn: () => getUser(userId!),
    enabled: !!userId,
  })

  useEffect(() => {
    if (userQuery.data) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAvatarUrl(userQuery.data.avatarUrl ?? '')
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPhoneNumber(userQuery.data.phoneNumber ?? '')
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPosition(userQuery.data.position ?? '')
    }
  }, [userQuery.data])

  const updateMutation = useMutation({
    mutationFn: () => updateUser(userId!, {
      phoneNumber: phoneNumber || null,
      position: position || null,
      avatarUrl: avatarUrl || null,
      isAvatarIcon: true,
    }),
    onSuccess: (updated) => {
      toast.success('Profile updated successfully')
      queryClient.setQueryData(['user', userId], updated)
    },
    onError: (error) => {
      toast.error('Failed to update profile: ' + (error as Error).message)
    }
  })

  if (!userId) {
    return <ErrorState error={new Error('Not logged in')} title="Authentication Error" />
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
      <PageHeader
        subtitle="Manage your personal details and avatar"
        title="User Profile"
      />

      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm space-y-6">
        <div>
          <h3 className="text-lg font-medium">Read-Only Information</h3>
          <p className="text-sm text-slate-500 mb-4">Contact your administrator to change these details.</p>
          <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-md">
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
          <h3 className="text-lg font-medium">Editable Details</h3>
          
          <div className="space-y-2">
            <Label htmlFor="position">Industrial Position / Title</Label>
            <Input
              id="position"
              placeholder="e.g. Heavy Equipment Operator"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              placeholder="555-0100"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />
          </div>

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

          <div className="pt-4 flex justify-end">
             <Button 
               onClick={() => updateMutation.mutate()} 
               disabled={updateMutation.isPending}
             >
               {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
             </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
