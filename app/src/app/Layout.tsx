import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { BottomNavigation, type NavItem } from '../components'
import { SyncBanner } from './SyncBanner'

const items: (NavItem & { path: string })[] = [
  { id: 'today', label: 'Heute', icon: '🏠', path: '/' },
  { id: 'library', label: 'Übungen', icon: '🧘', path: '/library' },
  { id: 'pelvic', label: 'Beckenboden', icon: '🌸', path: '/pelvic-floor' },
  { id: 'progress', label: 'Verlauf', icon: '📈', path: '/progress' },
  { id: 'more', label: 'Mehr', icon: '⚙️', path: '/more' },
]

export function Layout() {
  const { pathname } = useLocation()
  const nav = useNavigate()
  const active = items.find((i) => (i.path === '/' ? pathname === '/' : pathname.startsWith(i.path)))?.id ?? ''
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
