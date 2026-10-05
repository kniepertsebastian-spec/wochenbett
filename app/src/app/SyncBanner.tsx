import { Link } from 'react-router-dom'
import { useSync } from '../sync/SyncProvider'

/** Erscheint nur, wenn die Nutzerin etwas entscheiden muss. */
export function SyncBanner() {
  const { status } = useSync()
  if (status !== 'conflict' && status !== 'login_required') return null
  return (
    <Link to="/more/sync" className="pt-safe block bg-amber-100 p-3 text-center font-medium text-amber-950 underline dark:bg-amber-950 dark:text-amber-50">
      {status === 'conflict' ? 'Sync: Bitte entscheide, welcher Stand gelten soll →' : 'Sync: Bitte melde dich erneut an →'}
    </Link>
  )
}
