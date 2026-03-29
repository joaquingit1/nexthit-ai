"use client";

export default function SettingsPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-slate-900">Settings</h1>
        <p className="mt-1 text-slate-600">Configura tu cuenta y preferencias</p>
      </div>

      <div className="max-w-2xl space-y-6">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Notificaciones</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-900">Notificaciones por email</p>
                <p className="text-sm text-slate-500">Recibir actualizaciones sobre tus analisis</p>
              </div>
              <button className="relative h-6 w-11 rounded-full bg-blue-500 transition">
                <span className="absolute right-1 top-1 h-4 w-4 rounded-full bg-white shadow" />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-900">Resumen semanal</p>
                <p className="text-sm text-slate-500">Recibir un resumen semanal de tus metricas</p>
              </div>
              <button className="relative h-6 w-11 rounded-full bg-slate-200 transition">
                <span className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white shadow" />
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Preferencias de Analisis</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Idioma de reportes</label>
              <select className="w-full rounded-lg border border-slate-300 px-4 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
                <option value="es">Espanol</option>
                <option value="en">English</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Plataforma predeterminada</label>
              <select className="w-full rounded-lg border border-slate-300 px-4 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
                <option value="tiktok">TikTok</option>
                <option value="instagram">Instagram Reels</option>
                <option value="youtube">YouTube Shorts</option>
              </select>
            </div>
          </div>
          <button className="mt-6 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 transition">
            Guardar preferencias
          </button>
        </div>

        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <h3 className="text-lg font-semibold text-red-900 mb-2">Zona de peligro</h3>
          <p className="text-sm text-red-700 mb-4">Estas acciones son irreversibles</p>
          <button className="rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 transition">
            Eliminar cuenta
          </button>
        </div>
      </div>
    </div>
  );
}
