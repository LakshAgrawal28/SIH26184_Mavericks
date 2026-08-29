import Link from "next/link";
import type { ReactNode } from "react";

type NavProps = {
  title: string;
  children?: ReactNode;
};

export default function Nav({ title, children }: NavProps) {
  return (
    <header className="nav">
      <div className="nav-brand">
        <Link href="/dashboard" className="logo">
          <span className="logo-mark">E</span>
          <span className="logo-text">ECDAT</span>
        </Link>
        <h1>{title}</h1>
      </div>
      <div className="nav-actions">{children}</div>
    </header>
  );
}
