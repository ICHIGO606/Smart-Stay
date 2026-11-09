import { Link, useLocation } from "react-router";
import {
  LayoutDashboard,
  Building2,
  CalendarCheck,
  Package,
  ShieldCheck,
  Settings,
  ArrowLeft,
  Globe,
} from "lucide-react";

const AdminSidebar = () => {
  const location = useLocation();

  const links = [
    { to: "/admin", label: "Dashboard overview", icon: LayoutDashboard },
    { to: "/admin/hotels", label: "Hotels & rooms", icon: Building2 },
    { to: "/admin/organization", label: "Brand & Hosted Site", icon: Globe },
    { to: "/admin/bookings", label: "Reservations", icon: CalendarCheck },
    { to: "/admin/packages", label: "Curated packages", icon: Package },
    {
      to: "/admin/verifications",
      label: "ID verifications",
      icon: ShieldCheck,
    },
    { to: "/admin/profile", label: "Settings", icon: Settings },
  ];

  const isActive = (path) => {
    if (path === "/admin") return location.pathname === "/admin";
    return location.pathname.startsWith(path);
  };

  return (
    <aside className="w-64 flex-shrink-0 bg-[#12151D] text-stone-300 min-h-screen border-r border-stone-800 p-4 sticky top-0 flex flex-col justify-between">
      <div>
        {/* Brand context header */}
        <div className="px-3 pt-2 pb-6 border-b border-stone-800/80 mb-6">
          <div className="flex items-center gap-2.5">
            <span className="w-6 h-6 rounded-[5px] bg-stone-100 text-stone-900 flex items-center justify-center text-xs font-semibold">
              SS
            </span>
            <div className="flex flex-col">
              <span className="text-xs font-semibold tracking-tight text-white leading-tight">
                SmartStay Admin
              </span>
              <span className="font-mono text-[9px] text-stone-400 uppercase tracking-wider">
                Operations console
              </span>
            </div>
          </div>
        </div>

        {/* Section label */}
        <p className="px-3 text-[10px] font-mono uppercase tracking-wider text-stone-400 mb-2">
          Management
        </p>

        {/* Nav Links */}
        <nav>
          <ul className="space-y-1">
            {links.map((link) => {
              const Icon = link.icon;
              const active = isActive(link.to);
              return (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className={`flex items-center gap-2.5 h-9 px-3 rounded-control text-xs transition-colors ${
                      active
                        ? "bg-stone-800/90 text-white font-medium border border-stone-700/60"
                        : "text-stone-400 hover:text-stone-200 hover:bg-stone-850"
                    }`}
                  >
                    <Icon
                      size={15}
                      className={active ? "text-white" : "text-stone-400"}
                    />
                    <span>{link.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      {/* Return to public site link */}
      <div className="pt-4 border-t border-stone-800/80">
        <Link
          to="/"
          className="flex items-center gap-2 px-3 py-2 text-xs text-stone-400 hover:text-stone-200 transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Back to public site</span>
        </Link>
      </div>
    </aside>
  );
};

export default AdminSidebar;
