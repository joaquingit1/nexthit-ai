"use client";

export default function ProfilePage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-slate-900">Profile</h1>
        <p className="mt-1 text-slate-600">Administra tu perfil de usuario</p>
      </div>

      <div className="max-w-2xl space-y-6">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-200 text-2xl font-semibold text-slate-600">
              U
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Usuario</h2>
              <p className="text-sm text-slate-500">usuario@gmail.com</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Informacion Personal</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nombre</label>
              <input
                type="text"
                defaultValue="Usuario"
                className="w-full rounded-lg border border-slate-300 px-4 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input
                type="email"
                defaultValue="usuario@gmail.com"
                className="w-full rounded-lg border border-slate-300 px-4 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Empresa</label>
              <input
                type="text"
                placeholder="Nombre de tu empresa"
                className="w-full rounded-lg border border-slate-300 px-4 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
          <button className="mt-6 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 transition">
            Guardar cambios
          </button>
        </div>
      </div>
    </div>
  );
}
