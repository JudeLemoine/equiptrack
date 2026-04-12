import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { TextField } from '@mui/material'
import { Button } from '../../../components/ui/button'
import { Label } from '../../../components/ui/label'
import { Textarea } from '../../../components/ui/textarea'
import type { CreateRentalRequestDTO } from '../../../types/rental'

const schema = z.object({
  startDate: z.string().min(1, 'Start date is required.'),
  endDate: z.string().optional(),
  notes: z.string().max(400, 'Notes must be under 400 characters.').optional(),
})

type RentalRequestFormValues = z.infer<typeof schema>

type RentalRequestFormProps = {
  isSubmitting?: boolean
  onSubmit: (values: Pick<CreateRentalRequestDTO, 'startDate' | 'endDate' | 'notes'>) => void
}

export default function RentalRequestForm({ isSubmitting, onSubmit }: RentalRequestFormProps) {
  const form = useForm<RentalRequestFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      startDate: '',
      endDate: '',
      notes: '',
    },
  })

  return (
    <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
      <div className="space-y-2">
        <Label htmlFor="startDate">Start Date</Label>
        <TextField
          id="startDate"
          type="date"
          fullWidth
          size="small"
          {...form.register('startDate')}
          slotProps={{ inputLabel: { shrink: true } }}
          variant="outlined"
          sx={{ '& .MuiOutlinedInput-root': { height: '40px', borderRadius: '8px', backgroundColor: 'white' } }}
        />
        {form.formState.errors.startDate ? (
          <p className="text-xs text-red-600">{form.formState.errors.startDate.message}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="endDate">End Date (optional)</Label>
        <TextField
          id="endDate"
          type="date"
          fullWidth
          size="small"
          {...form.register('endDate')}
          slotProps={{ inputLabel: { shrink: true } }}
          variant="outlined"
          sx={{ '& .MuiOutlinedInput-root': { height: '40px', borderRadius: '8px', backgroundColor: 'white' } }}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" placeholder="Optional context for admin" {...form.register('notes')} />
        {form.formState.errors.notes ? (
          <p className="text-xs text-red-600">{form.formState.errors.notes.message}</p>
        ) : null}
      </div>

      <Button className="w-full" disabled={isSubmitting} type="submit">
        {isSubmitting ? 'Submitting...' : 'Submit rental request'}
      </Button>
    </form>
  )
}
