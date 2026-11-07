import {
  LayoutDashboard,
  Users,
  Calendar,
  ShieldCheck,
  UserCog,
  ArrowLeft,
} from "lucide-react";
import { Link } from "react-router";

const UserSidebar = ({ onTabChange, activeTab }) => {
  const tabs = [
    { id: "dashboard", label: "Account overview", icon: LayoutDashboard },
    { id: "bookings", label: "My reservations", icon: Calendar },
    { id: "family", label: "Registered guests", icon: Users },
    { id: "verification", label: "Identity verification", icon: ShieldCheck },
    { id: "settings", label: "Profile settings", icon: UserCog },
  ];

  return (
    <aside className="w-60 flex-shrink-0 bg-[#12151D] text-stone-300 min-h-screen border-r border-stone-800 p-4 sticky top-0 flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="px-3 pt-2 pb-6 border-b border-stone-800/80 mb-6">
          <div className="flex items-center gap-2.5">
            <span className="w-6 h-6 rounded-[5px] bg-stone-100 text-stone-900 flex items-center justify-center text-xs font-semibold">
              SS
            </span>
            <div className="flex flex-col">
              <span className="text-xs font-semibold tracking-tight text-white leading-tight">
                Guest Portal
              </span>
              <span className="font-mono text-[9px] text-stone-400 uppercase tracking-wider">
                Member stays
              </span>
            </div>
          </div>
        </div>

        <p className="px-3 text-[10px] font-mono uppercase tracking-wider text-stone-400 mb-2">
          Navigation
        </p>

        {/* Tab List */}
        <nav>
          <ul className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <li key={tab.id}>
                  <button
                    onClick={() => onTabChange(tab.id)}
                    className={`w-full flex items-center gap-2.5 h-9 px-3 rounded-control text-xs transition-colors text-left ${
                      active
                        ? "bg-stone-800/90 text-white font-medium border border-stone-700/60"
                        : "text-stone-400 hover:text-stone-200 hover:bg-stone-850"
                    }`}
                  >
                    <Icon
                      size={15}
                      className={active ? "text-white" : "text-stone-400"}
                    />
                    <span>{tab.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      <div className="pt-4 border-t border-stone-800/80">
        <Link
          to="/"
          className="flex items-center gap-2 px-3 py-2 text-xs text-stone-400 hover:text-stone-200 transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Explore hotels</span>
        </Link>
      </div>
    </aside>
  );
};

export default UserSidebar;
