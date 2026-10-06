import type { ContentMeta } from '../domain/types'

const roleOrNone = (m: ContentMeta) => (m.status === 'reviewed' ? `Geprüft${m.reviewedBy ? ` von ${m.reviewedBy}` : ''}${m.reviewedAt ? `, ${new Date(m.reviewedAt).toLocaleDateString('de-DE')}` : ''}` : 'Entwurf, noch nicht fachlich geprüft')

/** Zeigt ehrlich den Prüfstatus eines Inhalts: Entwurf oder geprüft (Rolle, Datum). */
export function ReviewBadge({ meta }: { meta: ContentMeta }) {
  const draft = meta.status !== 'reviewed'
  return (
    <p className={`rounded-xl px-3 py-2 text-sm ${draft ? 'bg-amber-100 text-amber-950 dark:bg-amber-950 dark:text-amber-50' : 'bg-emerald-100 text-emerald-950 dark:bg-emerald-950 dark:text-emerald-50'}`}>
      <span aria-hidden="true">{draft ? '✎ ' : '✓ '}</span>
      {roleOrNone(meta)}. Nächste Prüfung: {new Date(meta.reviewDue).toLocaleDateString('de-DE')}
      {meta.sources.length > 0 ? `. Quellen: ${meta.sources.map((s) => s.title).join(', ')}` : ''}
    </p>
  )
}
