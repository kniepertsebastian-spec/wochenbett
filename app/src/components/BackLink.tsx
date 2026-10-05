import { Link } from 'react-router-dom'

export function BackLink({ to, children, className = '' }: { to: string; children: string; className?: string }) {
  return (
    <Link to={to} className={`-ml-2 inline-flex min-h-12 items-center px-2 underline ${className}`}>
      {children}
    </Link>
  )
}
