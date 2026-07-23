import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useState } from 'react'
import { z } from 'zod'
import type { CategoryPayload } from '../../api/categories'
import { Button } from '../../components/Button'
import { ErrorBanner } from '../../components/ErrorBanner'
import { Field, inputClass } from '../../components/Field'
import { Modal } from '../../components/Modal'
import { SegmentedControl } from '../../components/SegmentedControl'
import type { Category } from '../../types/domain'

const schema = z.object({
  name: z.string().min(1, 'Informe um nome'),
  parentUuid: z.string().optional(),
  type: z.enum(['EXPENSE', 'INCOME']),
})

type FormValues = z.infer<typeof schema>

interface CategoryFormModalProps {
  rootCategories: Category[]
  onClose: () => void
  onSubmit: (payload: CategoryPayload) => Promise<void>
}

export function CategoryFormModal({ rootCategories, onClose, onSubmit }: CategoryFormModalProps) {
  const [submitError, setSubmitError] = useState<unknown>(null)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', parentUuid: '', type: 'EXPENSE' },
  })

  const selectedType = watch('type')
  const parentUuid = watch('parentUuid')
  const hasParent = Boolean(parentUuid)

  const submit = async (values: FormValues) => {
    setSubmitError(null)
    try {
      await onSubmit({
        name: values.name,
        parentUuid: values.parentUuid || null,
        type: values.parentUuid ? undefined : values.type,
      })
      onClose()
    } catch (error) {
      setSubmitError(error)
    }
  }

  return (
    <Modal title="Nova categoria" onClose={onClose}>
      <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-4">
        <Field label="Nome" htmlFor="name" error={errors.name?.message}>
          <input id="name" className={inputClass} placeholder="Ex.: Academia" {...register('name')} />
        </Field>

        <Field label="Categoria-pai (opcional)" htmlFor="parentUuid">
          <select id="parentUuid" className={inputClass} {...register('parentUuid')}>
            <option value="">Nenhuma — categoria raiz</option>
            {rootCategories.map((category) => (
              <option key={category.uuid} value={category.uuid}>
                {category.name}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Tipo" htmlFor="type">
          <SegmentedControl
            name="type"
            value={selectedType}
            onChange={(value) => setValue('type', value)}
            options={[
              { value: 'EXPENSE', label: 'Despesa' },
              { value: 'INCOME', label: 'Receita' },
            ]}
            className={`w-full ${hasParent ? 'pointer-events-none opacity-50' : ''}`}
          />
          <span className="text-[11.5px] text-ink/55">
            Ao escolher uma categoria-pai, o tipo é herdado automaticamente.
          </span>
        </Field>

        {Boolean(submitError) && <ErrorBanner error={submitError} />}

        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            Salvar
          </Button>
        </div>
      </form>
    </Modal>
  )
}
