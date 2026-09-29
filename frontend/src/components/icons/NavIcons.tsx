import type { SVGProps } from "react";

const stroke = {
  stroke: "currentColor",
  strokeWidth: 1.5,
  fill: "none",
  strokeLinecap: "square" as const,
  strokeLinejoin: "miter" as const,
};

type IconProps = SVGProps<SVGSVGElement>;

export function IconDashboard(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={20} height={20} aria-hidden {...props}>
      <path d="M3 3h8v8H3zM13 3h8v5h-8zM13 10h8v11h-8zM3 13h8v8H3z" {...stroke} />
      <path d="M5 5h4v4H5zM15 5h4v1h-4z" {...stroke} opacity={0.5} />
    </svg>
  );
}

export function IconScans(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={20} height={20} aria-hidden {...props}>
      <rect x="4" y="3" width="12" height="16" {...stroke} />
      <path d="M8 7h4M8 10h6M8 13h5" {...stroke} />
      <circle cx="17" cy="17" r="4.5" {...stroke} />
      <path d="M19.5 19.5L21 21" {...stroke} />
    </svg>
  );
}

export function IconArtefacts(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={20} height={20} aria-hidden {...props}>
      <path
        d="M12 2v3M9 5h6M8 8h8v3c0 4-2 6-4 9-2-3-4-5-4-9V8z"
        {...stroke}
      />
      <path d="M10 11c0 2 1 3.5 2 5M14 11c0 2-1 3.5-2 5" {...stroke} />
      <circle cx="12" cy="14" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconTrust(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={20} height={20} aria-hidden {...props}>
      <path d="M12 3l8 3v6c0 5-3.5 8.5-8 9-4.5-.5-8-4-8-9V6l8-3z" {...stroke} />
      <path d="M9 12l2 2 4-4" {...stroke} />
    </svg>
  );
}

export function IconExecutive(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={20} height={20} aria-hidden {...props}>
      <path d="M4 19V5h16v14H4z" {...stroke} />
      <path d="M8 15h8M8 11h5M8 7h3" {...stroke} />
    </svg>
  );
}

export function IconSettings(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={20} height={20} aria-hidden {...props}>
      <circle cx="12" cy="12" r="3" {...stroke} />
      <path
        d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"
        {...stroke}
      />
    </svg>
  );
}

export function IconLogoMark(props: IconProps) {
  return (
    <svg viewBox="0 0 32 32" width={32} height={32} aria-hidden {...props}>
      <rect x="4" y="6" width="14" height="20" {...stroke} />
      <path d="M8 10h6M8 14h8M8 18h5" {...stroke} />
      <path
        d="M20 14c2 0 4 1.5 4 4v6c0 2-1.5 3.5-4 3.5s-4-1.5-4-3.5v-6c0-2.5 2-4 4-4z"
        {...stroke}
      />
      <path d="M18 20h4M20 18v4" {...stroke} />
    </svg>
  );
}

export function IconArchiveUpload(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={24} height={24} aria-hidden {...props}>
      <path d="M4 6h16v14H4zM4 6l2-3h12l2 3" {...stroke} />
      <path d="M12 10v6M9 13l3-3 3 3" {...stroke} />
    </svg>
  );
}

export function IconLockScan(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={16} height={16} aria-hidden {...props}>
      <rect x="5" y="11" width="14" height="10" {...stroke} />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" {...stroke} />
      <circle cx="12" cy="16" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconEmptyScans(props: IconProps) {
  return (
    <svg viewBox="0 0 48 48" width={48} height={48} aria-hidden {...props}>
      <rect x="10" y="8" width="22" height="28" {...stroke} strokeWidth={1.5} />
      <path d="M14 14h14M14 20h18M14 26h12" stroke="currentColor" strokeWidth={1.5} fill="none" />
      <circle cx="34" cy="34" r="8" stroke="currentColor" strokeWidth={1.5} fill="none" />
      <path d="M36.5 36.5L40 40" stroke="currentColor" strokeWidth={1.5} />
    </svg>
  );
}
