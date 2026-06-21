import { useLocation } from "react-router-dom";
import { Bell } from "lucide-react";
import { cn } from "@/lib/utils";

const routeNameMap: Record<string, string> = {
  "/overview": "总览大屏",
  "/channel": "渠道分析",
  "/funnel": "项目漏斗",
  "/personnel": "人员追踪",
  "/alert": "异常预警",
  "/report": "复盘报告",
};

export default function Header() {
  const location = useLocation();
  const pageName = routeNameMap[location.pathname] ?? "总览大屏";

  const today = new Date();
  const dateStr = `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日`;

  return (
    <header
      className={cn(
        "h-14 bg-brand-card border-b border-brand-border",
        "flex items-center justify-between px-6"
      )}
    >
      <div className="flex items-center gap-2 text-sm">
        <span className="text-brand-text-muted">驾驶舱</span>
        <span className="text-brand-text-muted">/</span>
        <span className="text-brand-text-primary">{pageName}</span>
      </div>

      <div className="flex items-center gap-5">
        <span className="text-brand-text-muted text-xs">{dateStr}</span>

        <div className="relative">
          <Bell className="w-[18px] h-[18px] text-brand-text-secondary cursor-pointer hover:text-brand-text-primary transition-colors" />
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-brand-red rounded-full text-[10px] text-white flex items-center justify-center leading-none">
            3
          </span>
        </div>

        <div className="w-8 h-8 rounded-full bg-brand-border flex items-center justify-center text-brand-text-secondary text-xs font-medium cursor-pointer hover:bg-brand-border-light transition-colors">
          U
        </div>
      </div>
    </header>
  );
}
