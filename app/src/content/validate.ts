import type { ContentMeta, Exercise } from '../domain/types'

/** Gibt Fehlermeldungen zurück (leer = gültig). */
export function validateMeta(meta: ContentMeta, label: string, today = new Date().toISOString().slice(0, 10)): string[] {
  const errs: string[] = []
  if (meta.evidenceLevel !== 'practical_tip' && meta.sources.length === 0) errs.push(`${label}: Quelle fehlt (Evidenz ${meta.evidenceLevel})`)
  if (meta.status === 'reviewed' && (!meta.reviewedAt || !meta.reviewedBy)) errs.push(`${label}: reviewed ohne reviewedAt/reviewedBy`)
  if (!meta.reviewDue) errs.push(`${label}: reviewDue fehlt`)
  else if (meta.reviewDue < today) errs.push(`${label}: Review überfällig (${meta.reviewDue})`)
  return errs
}

export function validateExercises(list: Exercise[], today?: string): string[] {
  const errs: string[] = []
  const ids = new Set(list.map((e) => e.id))
  if (ids.size !== list.length) errs.push('Doppelte Übungs-IDs')
  for (const e of list) {
    errs.push(...validateMeta(e.meta, e.id, today))
    if (e.stopCriteria.length === 0) errs.push(`${e.id}: Abbruchkriterien fehlen`)
    if (e.redFlags.length === 0) errs.push(`${e.id}: Red Flags fehlen`)
    if (e.instructions.length === 0) errs.push(`${e.id}: Anleitung fehlt`)
    if (e.difficulty >= 2 && e.regressions.length === 0) errs.push(`${e.id}: Regression fehlt`)
    for (const r of [...e.regressions, ...e.progressions]) if (!ids.has(r)) errs.push(`${e.id}: unbekannte Referenz ${r}`)
    for (const r of e.regressions) {
      const t = list.find((x) => x.id === r)
      if (t && t.difficulty > e.difficulty) errs.push(`${e.id}: Regression ${r} ist schwerer`)
    }
  }
  return errs
}

/** In Produktions-Builds nur fachlich geprüfte Inhalte ausspielen. */
export const isServable = (meta: ContentMeta, production: boolean) => !production || meta.status === 'reviewed'
