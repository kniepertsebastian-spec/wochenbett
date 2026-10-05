import type { EquipmentId } from './types'

export const EQUIPMENT: { id: EquipmentId; label: string }[] = [
  { id: 'chair', label: 'Stuhl' },
  { id: 'gymball', label: 'Gymnastikball' },
  { id: 'band', label: 'Theraband / Gymnastikband' },
  { id: 'weight', label: 'Leichtes Gewicht (z. B. Wasserflasche)' },
]

export const equipmentLabel = (id: EquipmentId) => EQUIPMENT.find((e) => e.id === id)?.label ?? id

/** Haushaltsdinge, die fast jede hat. Ball und Band müssen aktiv angegeben werden. */
export const DEFAULT_EQUIPMENT: EquipmentId[] = ['chair', 'weight']
