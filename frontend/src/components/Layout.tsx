import { NavLink, Outlet } from 'react-router-dom'

interface NavItem {
  to: string
  label: string
  end?: boolean
}

const links: NavItem[] = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/income', label: 'Income' },
  { to: '/expense', label: 'Expense' },
  { to: '/income-categories', label: 'Income categories' },
  { to: '/expense-categories', label: 'Expense categories' },
]

export default function Layout() {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">₹</span>
          <div>
            <p className="brand-name">Ledgerly</p>
            <p className="brand-tag">Budget desk</p>
          </div>
        </div>

        <nav className="nav">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <p className="sidebar-foot">Connected to FastAPI · PostgreSQL</p>
      </aside>

      <main className="main">
        <Outlet />
      </main>
    </div>
  )
}
