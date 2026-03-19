import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '../../../components/ui/button'
import EquipmentProfilePage from '../../equipment/pages/EquipmentProfilePage'

export default function FieldEquipmentDetailPage() {
  const navigate = useNavigate()

  return (
    <div className="space-y-6">
      <Button className="mb-4" onClick={() => navigate('/field/dashboard')} size="sm" variant="outline">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Dashboard
      </Button>
      <EquipmentProfilePage />
    </div>
  )
}
