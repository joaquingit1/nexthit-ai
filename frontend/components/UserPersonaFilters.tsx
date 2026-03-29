"use client";

import { useState } from "react";

export interface PersonaFilters {
  ageRanges: string[];
  genders: string[];
  incomeBrackets: string[];
  purchaseIntents: string[];
  socialStatuses: string[];
  interests: string[];
  platforms: string[];
}

const defaultFilters: PersonaFilters = {
  ageRanges: [],
  genders: [],
  incomeBrackets: [],
  purchaseIntents: [],
  socialStatuses: [],
  interests: [],
  platforms: [],
};

const filterOptions = {
  ageRanges: [
    { value: "18-24", label: "18-24 años" },
    { value: "25-34", label: "25-34 años" },
    { value: "35-44", label: "35-44 años" },
    { value: "45-54", label: "45-54 años" },
    { value: "55+", label: "55+ años" },
  ],
  genders: [
    { value: "masculino", label: "Masculino" },
    { value: "femenino", label: "Femenino" },
    { value: "no-binario", label: "No binario" },
  ],
  incomeBrackets: [
    { value: "bajo", label: "Ingreso bajo" },
    { value: "medio", label: "Ingreso medio" },
    { value: "alto", label: "Ingreso alto" },
  ],
  purchaseIntents: [
    { value: "alta", label: "Alta intencion" },
    { value: "media", label: "Media intencion" },
    { value: "baja", label: "Baja intencion" },
    { value: "solo-informacion", label: "Solo busca info" },
  ],
  socialStatuses: [
    { value: "estudiante", label: "Estudiante" },
    { value: "profesional", label: "Profesional" },
    { value: "emprendedor", label: "Emprendedor" },
    { value: "freelancer", label: "Freelancer" },
    { value: "ejecutivo", label: "Ejecutivo" },
    { value: "retirado", label: "Retirado" },
  ],
  interests: [
    { value: "tecnologia", label: "Tecnologia" },
    { value: "fitness", label: "Fitness y salud" },
    { value: "moda", label: "Moda y belleza" },
    { value: "finanzas", label: "Finanzas" },
    { value: "entretenimiento", label: "Entretenimiento" },
    { value: "educacion", label: "Educacion" },
    { value: "viajes", label: "Viajes" },
    { value: "gastronomia", label: "Gastronomia" },
  ],
  platforms: [
    { value: "instagram", label: "Instagram" },
    { value: "tiktok", label: "TikTok" },
    { value: "youtube", label: "YouTube" },
    { value: "linkedin", label: "LinkedIn" },
    { value: "facebook", label: "Facebook" },
    { value: "twitter", label: "Twitter/X" },
  ],
};

interface FilterSectionProps {
  title: string;
  options: { value: string; label: string }[];
  selected: string[];
  onChange: (values: string[]) => void;
}

function FilterSection({ title, options, selected, onChange }: FilterSectionProps) {
  const toggleValue = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  return (
    <div>
      <p className="mb-2 text-sm font-semibold text-slate-700">{title}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const isSelected = selected.includes(option.value);
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => toggleValue(option.value)}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                isSelected
                  ? "bg-blue-500 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

interface UserPersonaFiltersProps {
  isOpen: boolean;
  onClose: () => void;
  filters: PersonaFilters;
  onFiltersChange: (filters: PersonaFilters) => void;
}

export default function UserPersonaFilters({
  isOpen,
  onClose,
  filters,
  onFiltersChange,
}: UserPersonaFiltersProps) {
  const [localFilters, setLocalFilters] = useState<PersonaFilters>(filters);

  const updateFilter = <K extends keyof PersonaFilters>(key: K, value: PersonaFilters[K]) => {
    setLocalFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleApply = () => {
    onFiltersChange(localFilters);
    onClose();
  };

  const handleReset = () => {
    setLocalFilters(defaultFilters);
  };

  const getActiveFiltersCount = () => {
    return Object.values(localFilters).reduce((acc, arr) => acc + arr.length, 0);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h2 className="font-display text-xl font-bold text-slate-900">
              Configurar AI Persona
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Define el perfil de audiencia para la simulacion
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Filters Content */}
        <div className="max-h-[60vh] space-y-6 overflow-y-auto px-6 py-6">
          <FilterSection
            title="Rango de edad"
            options={filterOptions.ageRanges}
            selected={localFilters.ageRanges}
            onChange={(v) => updateFilter("ageRanges", v)}
          />

          <FilterSection
            title="Genero"
            options={filterOptions.genders}
            selected={localFilters.genders}
            onChange={(v) => updateFilter("genders", v)}
          />

          <FilterSection
            title="Nivel de ingresos"
            options={filterOptions.incomeBrackets}
            selected={localFilters.incomeBrackets}
            onChange={(v) => updateFilter("incomeBrackets", v)}
          />

          <FilterSection
            title="Intencion de compra"
            options={filterOptions.purchaseIntents}
            selected={localFilters.purchaseIntents}
            onChange={(v) => updateFilter("purchaseIntents", v)}
          />

          <FilterSection
            title="Perfil social"
            options={filterOptions.socialStatuses}
            selected={localFilters.socialStatuses}
            onChange={(v) => updateFilter("socialStatuses", v)}
          />

          <FilterSection
            title="Intereses"
            options={filterOptions.interests}
            selected={localFilters.interests}
            onChange={(v) => updateFilter("interests", v)}
          />

          <FilterSection
            title="Plataformas principales"
            options={filterOptions.platforms}
            selected={localFilters.platforms}
            onChange={(v) => updateFilter("platforms", v)}
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-200 px-6 py-4">
          <div className="text-sm text-slate-500">
            {getActiveFiltersCount() > 0 ? (
              <span className="font-medium text-blue-600">
                {getActiveFiltersCount()} filtros activos
              </span>
            ) : (
              "Sin filtros (audiencia general)"
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleReset}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Resetear
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-600"
            >
              Aplicar filtros
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export { defaultFilters };
