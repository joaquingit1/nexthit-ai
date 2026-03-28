"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const navSections = [
  {
    title: "Creativos",
    items: [
      {
        href: "/analisis",
        label: "Analisis",
        icon: (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        ),
      },
      {
        href: "/videos",
        label: "Videos",
        icon: (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        ),
      },
    ],
  },
  {
    title: "Admin",
    items: [
      {
        href: "/admin/prompts",
        label: "Prompts",
        icon: (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
        ),
      },
      {
        href: "/admin/generaciones",
        label: "Generaciones",
        icon: (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
          </svg>
        ),
      },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-slate-200/60 bg-white">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 border-b border-slate-200/60 px-6">
        <img src="/logo.svg" alt="NextHit" className="h-8 w-auto" />
        <span className="text-lg font-bold text-slate-900">NextHit</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-6 px-3 py-4">
        {navSections.map((section) => (
          <div key={section.title}>
            <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
              {section.title}
            </p>
            <div className="space-y-1">
              {section.items.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                      isActive
                        ? "bg-slate-100 text-slate-900"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Credits Card */}
      <div className="border-t border-slate-200/60 px-4 pt-4">
        <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-slate-500">Creditos usados</p>
            <p className="text-sm font-bold text-slate-900">5/10</p>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-blue-500"
              style={{ width: "50%" }}
            />
          </div>
        </div>
      </div>

      {/* New Video Button */}
      <div className="p-4 pt-3">
        <Link
          href="/app"
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nuevo video
        </Link>
      </div>

      {/* User Menu */}
      <div className="relative border-t border-slate-200/60 p-3">
        <button
          type="button"
          onClick={() => setUserMenuOpen(!userMenuOpen)}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-slate-50"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 text-sm font-bold text-white">
            U
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-medium text-slate-900">Usuario</p>
            <p className="truncate text-xs text-slate-500">usuario@email.com</p>
          </div>
          <svg
            className={`h-4 w-4 text-slate-400 transition-transform ${userMenuOpen ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        </button>

        {/* Dropdown Menu */}
        {userMenuOpen && (
          <div className="absolute bottom-full left-3 right-3 mb-2 rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
            <Link
              href="/perfil"
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
              onClick={() => setUserMenuOpen(false)}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Mi perfil
            </Link>
            <Link
              href="/settings"
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
              onClick={() => setUserMenuOpen(false)}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Configuracion
            </Link>
            <div className="my-1 border-t border-slate-100" />
            <div className="px-4 py-2">
              <p className="text-xs font-medium text-slate-500">Creditos disponibles</p>
              <p className="mt-1 text-lg font-bold text-slate-900">50 <span className="text-sm font-normal text-slate-500">videos</span></p>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
