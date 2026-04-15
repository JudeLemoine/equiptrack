import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Button } from '../../../components/ui/button'
import { Label } from '../../../components/ui/label'
import { Textarea } from '../../../components/ui/textarea'
import type { CreateRentalRequestDTO } from '../../../types/rental'

const dateCls =
  'w-full h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-colors'

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
      <div className="space-y-1.5">
        <Label htmlFor="startDate">Start Date</Label>
        <input
          id="startDate"
          type="date"
          className={dateCls}
          {...form.register('startDate')}
        />
        {form.formState.errors.startDate && (
          <p className="text-xs text-red-600">{form.formState.errors.startDate.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="endDate">End Date <span className="text-slate-400 font-normal">(optional)</span></Label>
        <input
          id="endDate"
          type="date"
          className={dateCls}
          {...form.register('endDate')}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" placeholder="Optional context for admin" {...form.register('notes')} />
        {form.formState.errors.notes && (
          <p className="text-xs text-red-600">{form.formState.errors.notes.message}</p>
        )}
      </div>

      <Button className="w-full" disabled={isSubmitting} type="submit">
        {isSubmitting ? 'Submitting…' : 'Submit rental request'}
      </Button>
    </form>
  )
}
