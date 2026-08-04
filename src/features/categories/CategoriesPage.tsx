import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { categoriesApi, type CategoryPayload } from '../../api/categories'
import { Badge } from '../../components/Badge'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { ErrorBanner } from '../../components/ErrorBanner'
import { CategoryIconBadge } from '../../lib/categoryIcons'
import type { Category, FlowType } from '../../types/domain'
import { CategoryFormModal } from './CategoryFormModal'

function groupByType(categories: Category[], type: FlowType) {
  const ofType = categories.filter((c) => c.type === type)
  const roots = ofType.filter((c) => c.parentUuid === null)
  return roots.map((root) => ({
    root,
    children: ofType.filter((c) => c.parentUuid === root.uuid),
  }))
}

export function CategoriesPage() {
  const queryClient = useQueryClient()
  const [isCreating, setIsCreating] = useState(false)

  const categoriesQuery = useQuery({ queryKey: ['categories'], queryFn: categoriesApi.list })

  const createMutation = useMutation({
    mutationFn: (payload: CategoryPayload) => categoriesApi.create(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] }),
  })

  const renameMutation = useMutation({
    mutationFn: ({ uuid, name }: { uuid: string; name: string }) => categoriesApi.rename(uuid, name),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] }),
  })

  const archiveMutation = useMutation({
    mutationFn: (uuid: string) => categoriesApi.archive(uuid),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] }),
  })

  const categories = useMemo(() => categoriesQuery.data ?? [], [categoriesQuery.data])
  const rootCategories = useMemo(() => categories.filter((c) => c.parentUuid === null), [categories])
  const expenseGroups = useMemo(() => groupByType(categories, 'EXPENSE'), [categories])
  const incomeGroups = useMemo(() => groupByType(categories, 'INCOME'), [categories])

  const handleRename = (category: Category) => {
    const name = window.prompt('Novo nome da categoria', category.name)
    if (name && name.trim() && name !== category.name) {
      renameMutation.mutate({ uuid: category.uuid, name: name.trim() })
    }
  }

  const renderRow = (category: Category, indented: boolean) => (
    <div
      key={category.uuid}
      className={`flex items-center gap-2.5 border-b border-ink/[.06] px-3.5 py-2.5 last:border-b-0 ${
        indented ? 'pl-8' : ''
      }`}
    >
      {!indented && <CategoryIconBadge name={category.name} type={category.type} size="sm" />}
      <span className={`flex-1 text-[13px] ${indented ? 'text-ink/80' : 'text-ink'}`}>
        {indented && '↳ '}
        {category.name}
      </span>
      <Badge variant={category.origin === 'SYSTEM' ? 'outline' : 'income'}>
        {category.origin === 'SYSTEM' ? 'Sistema' : 'Própria'}
      </Badge>
      {category.origin === 'USER' && (
        <Button variant="ghost" className="px-2 py-1 text-[11.5px]" onClick={() => handleRename(category)}>
          Renomear
        </Button>
      )}
      <Button
        variant="ghost"
        className="px-2 py-1 text-[11.5px]"
        isLoading={archiveMutation.isPending && archiveMutation.variables === category.uuid}
        onClick={() => archiveMutation.mutate(category.uuid)}
      >
        Arquivar
      </Button>
    </div>
  )

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-ink">Categorias</h1>
        <Button onClick={() => setIsCreating(true)} aria-label="Nova categoria">
          <Plus size={15} />
          <span className="hidden sm:inline">Nova categoria</span>
        </Button>
      </div>

      {categoriesQuery.isError && <ErrorBanner error={categoriesQuery.error} />}
      {archiveMutation.isError && <ErrorBanner error={archiveMutation.error} />}
      {renameMutation.isError && <ErrorBanner error={renameMutation.error} />}

      {categoriesQuery.isLoading && (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="h-64 animate-pulse rounded-2xl bg-ink/[.06]" />
          <div className="h-64 animate-pulse rounded-2xl bg-ink/[.06]" />
        </div>
      )}

      {!categoriesQuery.isLoading && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <h6 className="mb-2.5 text-xs tracking-wide text-ink/60 uppercase">Despesas</h6>
            <Card className="p-0!">
              {expenseGroups.map(({ root, children }) => (
                <div key={root.uuid}>
                  {renderRow(root, false)}
                  {children.map((child) => renderRow(child, true))}
                </div>
              ))}
            </Card>
          </div>
          <div>
            <h6 className="mb-2.5 text-xs tracking-wide text-ink/60 uppercase">Receitas</h6>
            <Card className="p-0!">
              {incomeGroups.map(({ root, children }) => (
                <div key={root.uuid}>
                  {renderRow(root, false)}
                  {children.map((child) => renderRow(child, true))}
                </div>
              ))}
            </Card>
            <p className="mt-2.5 text-[11.5px] text-ink/55">
              Categorias do sistema só podem ser arquivadas. Categorias próprias podem ser renomeadas ou arquivadas —
              inclusive suas subcategorias, com máximo de 2 níveis.
            </p>
          </div>
        </div>
      )}

      {isCreating && (
        <CategoryFormModal
          rootCategories={rootCategories}
          onClose={() => setIsCreating(false)}
          onSubmit={async (payload) => {
            await createMutation.mutateAsync(payload)
          }}
        />
      )}
    </div>
  )
}
