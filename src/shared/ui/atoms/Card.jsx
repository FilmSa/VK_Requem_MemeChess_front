import { cn } from "../../lib/cn.js";

export default function Card({ children, compact = false, className, ...props }) {
  return (
    <div
      className={cn("ui-card", compact && "ui-card--compact", className)}
      {...props}
    >
      {children}
    </div>
  );
}
