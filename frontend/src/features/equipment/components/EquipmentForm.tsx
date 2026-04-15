import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import { Select } from '../../../components/ui/select'
import { Textarea } from '../../../components/ui/textarea'
import type { CreateEquipmentDTO, Equipment, EquipmentStatus } from '../../../types/equipment'

const dateCls =
  'w-full h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-colors'

const schema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters.'),
  category: z.string().trim().min(2, 'Category is required.'),
  status: z.enum(['available', 'in_use', 'maintenance']),
  qrCode: z.string().trim().min(2, 'QR code is required.'),
  lastServiceDate: z.string().min(1, 'Last service date is required.'),
  nextServiceDueDate: z.string().optional(),
  maintenanceIntervalDays: z.string().optional(),
  notes: z.string().max(500, 'Notes must be under 500 characters.').optional(),
})

type EquipmentFormValues = z.infer<typeof schema>

type EquipmentFormProps = {
  initialValues?: Partial<Equipment>
  isSubmitting?: boolean
  submitLabel: string
  onSubmit: (values: CreateEquipmentDTO) => void
  onCancel?: () => void
}

const statusOptions: Array<{ label: string; value: EquipmentStatus }> = [
  { label: 'Available',    value: 'available'   },
  { label: 'In Use',       value: 'in_use'      },
  { label: 'Maintenance',  value: 'maintenance' },
]

export default function EquipmentForm({
  initialValues,
  isSubmitting,
  submitLabel,
  onSubmit,
  onCancel,
}: EquipmentFormProps) {
  const form = useForm<EquipmentFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: initialValues?.name ?? '',
      category: initialValues?.category ?? '',
      status: initialValues?.status ?? 'available',
      qrCode: initialValues?.qrCode ?? '',
      lastServiceDate: initialValues?.lastServiceDate ?? '',
      nextServiceDueDate: initialValues?.nextServiceDueDate ?? '',
      maintenanceIntervalDays:
        initialValues?.maintenanceIntervalDays !== undefined
          ? String(initialValues.maintenanceIntervalDays)
          : '',
      notes: initialValues?.notes ?? '',
    },
  })

  return (
    <form
      className="space-y-4"
      onSubmit={form.handleSubmit((values) =>
        onSubmit({
          ...values,
          nextServiceDueDate: values.nextServiceDueDate || undefined,
          maintenanceIntervalDays:
            values.maintenanceIntervalDays && values.maintenanceIntervalDays.trim().length > 0
              ? Number(values.maintenanceIntervalDays)
              : undefined,
          notes: values.notes || undefined,
        }),
      )}
    >
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" {...form.register('name')} />
        {form.formState.errors.name && (
          <p className="text-xs text-red-600">{form.formState.errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="category">Category</Label>
        <Input id="category" {...form.register('category')} />
        {form.formState.errors.category && (
          <p className="text-xs text-red-600">{form.formState.errors.category.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <Select id="status" {...form.register('status')}>
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="qrCode">QR Code / Asset Tag</Label>
        <Input id="qrCode" {...form.register('qrCode')} />
        {form.formState.errors.qrCode && (
          <p className="text-xs text-red-600">{form.formState.errors.qrCode.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="lastServiceDate">Last Service Date</Label>
        <input
          id="lastServiceDate"
          type="date"
          className={dateCls}
          {...form.register('lastServiceDate')}
        />
        {form.formState.errors.lastServiceDate && (
          <p className="text-xs text-red-600">{form.formState.errors.lastServiceDate.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="nextServiceDueDate">Next Service Due Date</Label>
        <input
          id="nextServiceDueDate"
          type="date"
          className={dateCls}
          {...form.register('nextServiceDueDate')}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="maintenanceIntervalDays">Maintenance Interval (days)</Label>
        <Input id="maintenanceIntervalDays" min={1} type="number" {...form.register('maintenanceIntervalDays')} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" placeholder="Optional notes" {...form.register('notes')} />
        {form.formState.errors.notes && (
          <p className="text-xs text-red-600">{form.formState.errors.notes.message}</p>
        )}
      </div>

      <div className="flex items-center justify-end gap-2">
        {onCancel && (
          <Button onClick={onCancel} type="button" variant="secondary">
            Cancel
          </Button>
        )}
        <Button disabled={isSubmitting} type="submit">
          {isSubmitting ? 'Saving…' : submitLabel}
        </Button>
      </div>
    </form>
  )
}
