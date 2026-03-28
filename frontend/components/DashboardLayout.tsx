"use client";

import Sidebar from "./Sidebar";
import { useAuth } from "@/lib/useAuth";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { loading } = useAuth("/login");

  if (loading) {
    return (
      <div className="ml-64 flex min-h-screen items-center justify-center px-8 py-6">
        <div className="text-center">
          <svg className="mx-auto h-8 w-8 animate-spin text-slate-400" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="mt-4 text-slate-500">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Sidebar />
      <main className="ml-64 min-h-screen px-8 py-6">
        {children}
      </main>
    </div>
  );
}
