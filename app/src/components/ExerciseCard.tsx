import { Card } from './Card'

type Props = {
  name: string
  description: string
  meta?: string // z. B. "8 Wiederholungen" oder "30 Sek."
  oneHandFriendly?: boolean
  onSelect?: () => void
}

export function ExerciseCard({ name, description, meta, oneHandFriendly, onSelect }: Props) {
  const content = (
    <>
      <h3 className="text-lg font-semibold">{name}</h3>
      <p className="mt-1 text-stone-600 dark:text-stone-400">{description}</p>
      <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">
        {[meta, oneHandFriendly ? 'Einhand-geeignet' : null].filter(Boolean).join(' · ')}
      </p>
    </>
  )
  return (
    <Card className="p-0">
      {onSelect ? (
        <button type="button" onClick={onSelect} className="min-h-12 w-full rounded-2xl p-4 text-left">
          {content}
        </button>
      ) : (
        <div className="p-4">{content}</div>
      )}
    </Card>
  )
}
