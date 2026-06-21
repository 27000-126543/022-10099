import { NavLink } from "react-router-dom";
import {
  Activity,
  LayoutDashboard,
  BarChart3,
  Filter,
  Users,
  AlertTriangle,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/overview", icon: LayoutDashboard, label: "总览大屏" },
  { to: "/channel", icon: BarChart3, label: "渠道分析" },
  { to: "/funnel", icon: Filter, label: "项目漏斗" },
  { to: "/personnel", icon: Users, label: "人员追踪" },
  { to: "/alert", icon: AlertTriangle, label: "异常预警" },
  { to: "/report", icon: FileText, label: "复盘报告" },
];

export default function Sidebar() {
  const today = new Date();
  const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  return (
    <aside className="fixed left-0 top-0 h-screen w-[220px] bg-brand-card border-r border-brand-border flex flex-col z-50">
      <div className="flex items-center gap-2.5 px-5 h-16 border-b border-brand-border shrink-0">
        <Activity className="w-5 h-5 text-brand-emerald" />
        <span className="text-brand-text-primary font-semibold text-[15px] tracking-wide">
          美营驾驶舱
        </span>
      </div>

      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200",
                isActive
                  ? "bg-brand-emerald/10 text-brand-emerald border-l-2 border-brand-emerald"
                  : "text-brand-text-muted hover:text-brand-text-secondary hover:bg-white/[0.04] border-l-2 border-transparent"
              )
            }
          >
            <item.icon className="w-[18px] h-[18px] shrink-0" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="px-5 py-4 border-t border-brand-border shrink-0">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-brand-emerald animate-pulse-slow" />
          <span className="text-brand-text-muted text-xs">{dateStr}</span>
        </div>
      </div>
    </aside>
  );
}
