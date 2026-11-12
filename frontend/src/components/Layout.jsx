import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FilePlus2,
  FileText,
  Package,
  BarChart3,
  Settings,
  Menu,
  X,
  Plus,
  Globe,
  Store,
  ClipboardList,
  Search,
  ExternalLink,
} from 'lucide-react';
import { api } from '../api/client.js';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/bookings', label: 'Bookings / Orders', icon: ClipboardList, badgeKey: 'bookings' },
  { to: '/invoices/new', label: 'New Invoice', icon: FilePlus2 },
  { to: '/invoices', label: 'Invoice List', icon: FileText, end: true },
  { to: '/products', label: 'Products', icon: Package },
  { to: '/reports', label: 'GST Reports', icon: BarChart3 },
  { to: '/cms', label: 'Storefront CMS', icon: Globe },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pendingBookings, setPendingBookings] = useState(0);
  const [companyInfo, setCompanyInfo] = useState({
    name: 'IJAZ TRADERS',
    gstin: '33BTNPM5744E1ZK',
    stateName: 'Tamil Nadu',
    stateCode: '33',
  });
  const [globalSearch, setGlobalSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    api
      .getBookings({ status: 'Pending' })
      .then((list) => setPendingBookings(list.length))
      .catch(() => {});
    api
      .getSettings()
      .then((s) => setCompanyInfo(s))
      .catch(() => {});

    const onUpdated = (e) => {
      if (e.detail) setCompanyInfo(e.detail);
    };
    window.addEventListener('settings-updated', onUpdated);
    return () => window.removeEventListener('settings-updated', onUpdated);
  }, []);

  const handleGlobalSearch = (e) => {
    if (e.key !== 'Enter' || !globalSearch.trim()) return;
    const q = globalSearch.trim();
    if (/^BK-/i.test(q)) {
      navigate('/bookings');
    } else {
      navigate('/invoices');
    }
  };

  const NavContent = () => (
    <div className="flex h-full flex-col bg-[#0B1120] text-slate-200">
      <div className="flex items-center justify-between border-b border-slate-800/80 px-5 py-4">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white text-xs shadow-sm">
            {(companyInfo.name || 'IT').slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="text-base font-bold tracking-wide text-white leading-tight">
              {companyInfo.name || 'IJAZ TRADERS'}
            </div>
            <div className="text-[10px] font-medium text-slate-400">
              Billing &amp; Storefront CMS
            </div>
          </div>
        </div>
        <button
          onClick={() => setSidebarOpen(false)}
          className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white lg:hidden"
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                }`
              }
            >
              <span className="flex items-center gap-3">
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
              </span>
              {item.badgeKey === 'bookings' && pendingBookings > 0 && (
                <span className="rounded-full bg-indigo-500 px-2 py-0.5 text-[10px] font-bold text-white">
                  {pendingBookings}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="border-t border-slate-800/80 p-4 space-y-2.5">
        <a
          href="/store"
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-center gap-2 rounded-lg bg-slate-800 hover:bg-slate-700 px-3 py-2 text-xs font-semibold text-white transition-colors"
        >
          <Store className="h-3.5 w-3.5 text-indigo-400" /> View Live Storefront
        </a>
        <div className="rounded-lg bg-slate-900/90 border border-slate-800 px-3 py-2.5 text-xs text-slate-300">
          <div className="font-semibold text-white">GSTIN: {companyInfo.gstin}</div>
          <div className="mt-0.5 text-slate-400">
            {companyInfo.stateName} (Code: {companyInfo.stateCode})
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      {/* Desktop Dark Navy Sidebar */}
      <aside className="no-print hidden w-64 shrink-0 lg:block">
        <div className="fixed inset-y-0 left-0 w-64">
          <NavContent />
        </div>
      </aside>

      {/* Mobile Drawer */}
      {sidebarOpen && (
        <div className="no-print fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="relative z-10 w-64 max-w-[80vw]">
            <NavContent />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex flex-1 flex-col min-w-0">
        <header className="no-print sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-2.5 sm:px-6">
          <div className="flex items-center gap-3 flex-1 max-w-md">
            <button
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="hidden sm:flex items-center gap-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5">
              <Search className="h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                onKeyDown={handleGlobalSearch}
                placeholder="Search anything... (Invoice, Booking BK-1001)"
                className="w-full bg-transparent text-xs outline-none text-slate-700"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="/store"
              target="_blank"
              rel="noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              <ExternalLink className="h-3.5 w-3.5 text-indigo-600" /> Storefront
            </a>
            <button
              onClick={() => navigate('/invoices/new')}
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 transition-colors cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>New Invoice</span>
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-5 lg:p-6 max-w-[1440px] w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
