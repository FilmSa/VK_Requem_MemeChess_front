import { cn } from "../lib/cn.js";

export default function AppShell({
  sidebar,
  children,
  contentClassName,
  scrollable = false,
}) {
  return (
    <div className="app-shell">
      <div className="app-shell__grid">
        {sidebar}
        <main
          className={cn(
            "app-shell__content",
            scrollable && "app-shell__content--scroll",
            contentClassName
          )}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
