"use client";

import Link from "next/link";

export default function PreciosPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      {/* Navbar */}
      <nav className="fixed left-1/2 top-4 z-50 flex w-[calc(100%-2rem)] max-w-5xl -translate-x-1/2 items-center justify-between rounded-2xl border border-slate-200/60 bg-white/80 px-4 py-3 shadow-[0_8px_30px_rgba(0,0,0,0.06)] backdrop-blur-md md:px-6">
        <Link href="/" className="flex items-center gap-2">
          <img src="/logo.svg" alt="NextHit" className="h-8 w-auto" />
          <span className="text-lg font-bold text-slate-900">NextHit</span>
        </Link>

        <div className="flex flex-1 items-center gap-6 pl-8">
          <Link
            href="/funcionalidades"
            className="text-sm font-medium text-slate-600 transition hover:text-slate-900"
          >
            Funcionalidades
          </Link>
          <Link
            href="/casos-de-uso"
            className="text-sm font-medium text-slate-600 transition hover:text-slate-900"
          >
            Casos de Uso
          </Link>
          <Link
            href="/precios"
            className="text-sm font-medium text-slate-900"
          >
            Precios
          </Link>
        </div>

        <Link
          href="/app"
          className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Analizar video
        </Link>
      </nav>

      {/* Pricing Section */}
      <section className="px-6 pb-24 pt-32">
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
              Precios
            </span>
            <h1 className="mt-6 font-display text-4xl font-semibold tracking-[-0.04em] text-slate-950 md:text-5xl">
              Simple y transparente
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-lg text-slate-600">
              Paga solo por lo que usas. Sin suscripciones, sin compromisos.
            </p>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {/* Starter */}
            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900">Starter</h3>
              <p className="mt-2 text-sm text-slate-500">Para probar la plataforma</p>
              <div className="mt-6">
                <span className="text-4xl font-bold text-slate-900">$9</span>
                <span className="text-slate-500"> / 5 videos</span>
              </div>
              <ul className="mt-8 space-y-4">
                <li className="flex items-center gap-3 text-sm text-slate-600">
                  <svg className="h-5 w-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  5 analisis de video
                </li>
                <li className="flex items-center gap-3 text-sm text-slate-600">
                  <svg className="h-5 w-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Simulacion de 100 personas
                </li>
                <li className="flex items-center gap-3 text-sm text-slate-600">
                  <svg className="h-5 w-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Curva de retencion
                </li>
              </ul>
              <Link
                href="/app"
                className="mt-8 block w-full rounded-xl border border-slate-200 bg-white py-3 text-center text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
              >
                Empezar
              </Link>
            </div>

            {/* Pro - Featured */}
            <div className="relative rounded-2xl border-2 border-blue-500 bg-white p-8 shadow-lg">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-blue-500 px-4 py-1 text-xs font-semibold text-white">
                Popular
              </div>
              <h3 className="text-lg font-semibold text-slate-900">Pro</h3>
              <p className="mt-2 text-sm text-slate-500">Para creadores activos</p>
              <div className="mt-6">
                <span className="text-4xl font-bold text-slate-900">$29</span>
                <span className="text-slate-500"> / 20 videos</span>
              </div>
              <ul className="mt-8 space-y-4">
                <li className="flex items-center gap-3 text-sm text-slate-600">
                  <svg className="h-5 w-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  20 analisis de video
                </li>
                <li className="flex items-center gap-3 text-sm text-slate-600">
                  <svg className="h-5 w-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Simulacion de 100 personas
                </li>
                <li className="flex items-center gap-3 text-sm text-slate-600">
                  <svg className="h-5 w-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Curva de retencion
                </li>
                <li className="flex items-center gap-3 text-sm text-slate-600">
                  <svg className="h-5 w-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Recomendaciones avanzadas
                </li>
              </ul>
              <Link
                href="/app"
                className="mt-8 block w-full rounded-xl bg-blue-500 py-3 text-center text-sm font-semibold text-white transition hover:bg-blue-600"
              >
                Empezar
              </Link>
            </div>

            {/* Agency */}
            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900">Agency</h3>
              <p className="mt-2 text-sm text-slate-500">Para equipos y agencias</p>
              <div className="mt-6">
                <span className="text-4xl font-bold text-slate-900">$79</span>
                <span className="text-slate-500"> / 60 videos</span>
              </div>
              <ul className="mt-8 space-y-4">
                <li className="flex items-center gap-3 text-sm text-slate-600">
                  <svg className="h-5 w-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  60 analisis de video
                </li>
                <li className="flex items-center gap-3 text-sm text-slate-600">
                  <svg className="h-5 w-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Simulacion de 100 personas
                </li>
                <li className="flex items-center gap-3 text-sm text-slate-600">
                  <svg className="h-5 w-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Curva de retencion
                </li>
                <li className="flex items-center gap-3 text-sm text-slate-600">
                  <svg className="h-5 w-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Soporte prioritario
                </li>
              </ul>
              <Link
                href="/app"
                className="mt-8 block w-full rounded-xl border border-slate-200 bg-white py-3 text-center text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
              >
                Empezar
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
