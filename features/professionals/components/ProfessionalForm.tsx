"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  CONSULTATION_REASONS,
  COVERAGE_OPTIONS,
  MODALITY_OPTIONS,
  PROFESSION_OPTIONS,
} from "@/features/professionals/constants";
import type { ProfessionalFormValues } from "@/features/professionals/types";

const EMPTY_VALUES: ProfessionalFormValues = {
  full_name: "",
  profession: PROFESSION_OPTIONS[0].value,
  license_number: "",
  gender: "",
  description: "",
  photo_url: "",
  whatsapp: "",
  location: "",
  coverage: [],
  modality: [],
  consultation_reasons: [],
  is_featured: false,
};

export interface ProfessionalFormSubmitValues extends ProfessionalFormValues {
  email?: string;
  password?: string;
}

interface ProfessionalFormProps {
  mode: "create" | "edit";
  initialValues?: Partial<ProfessionalFormValues>;
  onSubmit: (values: ProfessionalFormSubmitValues) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  submitLabel: string;
  /** El profesional editando su propio perfil no puede marcarse como destacado. */
  hideFeaturedToggle?: boolean;
}

export function ProfessionalForm({
  mode,
  initialValues,
  onSubmit,
  isLoading,
  error,
  submitLabel,
  hideFeaturedToggle = false,
}: ProfessionalFormProps) {
  const [values, setValues] = useState<ProfessionalFormValues>({
    ...EMPTY_VALUES,
    ...initialValues,
  });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function toggleArrayValue(field: "coverage" | "modality" | "consultation_reasons", value: string) {
    setValues((prev) => {
      const current = prev[field];
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      return { ...prev, [field]: next };
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await onSubmit(mode === "create" ? { ...values, email, password } : values);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 max-w-2xl">
      <div className="grid gap-2">
        <Label htmlFor="full_name">Nombre y apellido</Label>
        <Input
          id="full_name"
          required
          value={values.full_name}
          onChange={(e) => setValues((v) => ({ ...v, full_name: e.target.value }))}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="profession">Profesión</Label>
        <select
          id="profession"
          className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm"
          value={values.profession}
          onChange={(e) => setValues((v) => ({ ...v, profession: e.target.value }))}
        >
          {PROFESSION_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="license_number">Matrícula</Label>
        <Input
          id="license_number"
          value={values.license_number}
          onChange={(e) => setValues((v) => ({ ...v, license_number: e.target.value }))}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="gender">Género</Label>
        <Input
          id="gender"
          value={values.gender}
          onChange={(e) => setValues((v) => ({ ...v, gender: e.target.value }))}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="description">Descripción</Label>
        <textarea
          id="description"
          rows={3}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
          value={values.description}
          onChange={(e) => setValues((v) => ({ ...v, description: e.target.value }))}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="photo_url">URL de foto</Label>
        <Input
          id="photo_url"
          value={values.photo_url}
          onChange={(e) => setValues((v) => ({ ...v, photo_url: e.target.value }))}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="whatsapp">WhatsApp</Label>
        <Input
          id="whatsapp"
          value={values.whatsapp}
          onChange={(e) => setValues((v) => ({ ...v, whatsapp: e.target.value }))}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="location">Ubicación</Label>
        <Input
          id="location"
          value={values.location}
          onChange={(e) => setValues((v) => ({ ...v, location: e.target.value }))}
        />
      </div>

      <div className="grid gap-2">
        <Label>Cobertura</Label>
        <div className="flex gap-4">
          {COVERAGE_OPTIONS.map((o) => (
            <label key={o.value} className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={values.coverage.includes(o.value)}
                onCheckedChange={() => toggleArrayValue("coverage", o.value)}
              />
              {o.label}
            </label>
          ))}
        </div>
      </div>

      <div className="grid gap-2">
        <Label>Modalidad</Label>
        <div className="flex gap-4">
          {MODALITY_OPTIONS.map((o) => (
            <label key={o.value} className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={values.modality.includes(o.value)}
                onCheckedChange={() => toggleArrayValue("modality", o.value)}
              />
              {o.label}
            </label>
          ))}
        </div>
      </div>

      <div className="grid gap-2">
        <Label>Motivos de consulta</Label>
        <div className="flex flex-col gap-2">
          {CONSULTATION_REASONS.map((reason) => (
            <label key={reason} className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={values.consultation_reasons.includes(reason)}
                onCheckedChange={() => toggleArrayValue("consultation_reasons", reason)}
              />
              {reason}
            </label>
          ))}
        </div>
      </div>

      {!hideFeaturedToggle && (
        <label className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={values.is_featured}
            onCheckedChange={(checked) =>
              setValues((v) => ({ ...v, is_featured: checked === true }))
            }
          />
          Destacado
        </label>
      )}

      {mode === "create" && (
        <>
          <div className="grid gap-2">
            <Label htmlFor="email">Email de acceso</Label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Contraseña provisoria</Label>
            <Input
              id="password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}

      <Button type="submit" disabled={isLoading}>
        {isLoading ? "Guardando..." : submitLabel}
      </Button>
    </form>
  );
}
