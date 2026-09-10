import type { ReactNode } from "react";

type PageHeaderProps = {
  title: string;
  description?: string;
  breadcrumb?: string[];
  actions?: ReactNode;
};

export default function PageHeader({ title, description, breadcrumb, actions }: PageHeaderProps) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        {breadcrumb && breadcrumb.length > 0 && (
          <p className="mb-1 text-xs font-medium text-zinc-500">
            {breadcrumb.join(" / ")}
          </p>
        )}
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">{title}</h1>
        {description && (
          <p className="mt-1.5 max-w-2xl text-sm text-zinc-500">{description}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}
