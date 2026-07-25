import type { FlowType } from '../types/domain'

interface FlowTone {
  text: string
  sign: string
}

const TONES: Record<FlowType, FlowTone> = {
  EXPENSE: { text: 'text-expense', sign: '-' },
  INCOME: { text: 'text-income', sign: '+' },
  TRANSFER: { text: 'text-brand-700', sign: '' },
}

export function flowTone(type: FlowType): FlowTone {
  return TONES[type]
}
