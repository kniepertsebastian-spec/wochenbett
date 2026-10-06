import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { BottomNavigation, type NavItem } from '../components'
import { SyncBanner } from './SyncBanner'

// Kernnavigation: Hauptpfad Heute → Übungen → Mein Weg, alles Weitere unter "Mehr" (nach Lebenssituation gruppiert)
const items: (NavItem & { path: string; also?: string[] })[] = [
  { id: 'today', label: 'Heute', icon: '🏠', path: '/' },
  { id: 'library', label: 'Übungen', icon: '🧘', path: '/library', also: ['/pelvic-floor'] },
  { id: 'progress', label: 'Mein Weg', icon: '🌱', path: '/progress' },
  { id: 'more', label: 'Mehr', icon: '☰', path: '/more', also: ['/diastasis'] },
]

export function Layout() {
  const { pathname } = useLocation()
  const nav = useNavigate()
  const active = items.find((i) => (i.path === '/' ? pathname === '/' : [i.path, ...(i.also ?? [])].some((p) => pathname.startsWith(p))))?.id ?? ''
  const hideNav = pathname === '/workout'
  return (
    <>
      <div className={hideNav ? '' : 'pb-16'}>
        <SyncBanner />
        <Outlet />
      </div>
      {!hideNav && <BottomNavigation items={items} activeId={active} onSelect={(id) => nav(items.find((i) => i.id === id)!.path)} />}
    </>
  )
}
