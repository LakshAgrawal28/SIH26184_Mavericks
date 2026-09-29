import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type PageHeaderProps = {
  title: string;
  description?: string;
  breadcrumb?: string[];
  actions?: ReactNode;
  className?: string;
};

export default function PageHeader({ title, description, breadcrumb, actions, className }: PageHeaderProps) {
  return (
    <div className={cn("mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="max-w-[68ch]">
        {breadcrumb && breadcrumb.length > 0 && (
          <p className="mb-2 text-xs font-medium tracking-wide text-ink-muted uppercase">
            {breadcrumb.join(" · ")}
          </p>
        )}
        <h1 className="text-display text-xl font-medium tracking-tight text-foreground sm:text-2xl">{title}</h1>
        {description && (
          <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">{description}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
