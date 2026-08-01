"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import {
  CONSULTATION_REASONS,
  COVERAGE_OPTIONS,
  GENDER_OPTIONS,
  MODALITY_OPTIONS,
  PROFESSION_OPTIONS,
} from "@/features/professionals/constants";
import { useProvinces } from "@/features/professionals/hooks/useProvinces";
import { useCitiesByProvince } from "@/features/professionals/hooks/useCitiesByProvince";
import {
  isValidWhatsappNumber,
  sanitizeWhatsappDigits,
  WHATSAPP_NUMBER_LENGTH,
} from "@/lib/whatsapp";
import type { ProfessionalFormValues } from "@/features/professionals/types";

const EMPTY_VALUES: ProfessionalFormValues = {
  full_name: "",
  profession: PROFESSION_OPTIONS[0].value,
  license_number: "",
  gender: "",
  description: "",
  photo_url: "",
  whatsapp: "",
  province: "",
  city: "",
  coverage: [],
  modality: [],
  consultation_reasons: [],
  is_featured: false,
};

export interface ProfessionalFormSubmitValues extends ProfessionalFormValues {
  photoFile?: File | null;
  email?: string;
  password?: string;
}

const ALLOWED_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_PHOTO_SIZE = 5 * 1024 * 1024;

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

const selectClassName =
  "h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";
const textareaClassName =
  "rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

function ChipToggle({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
        active
          ? "border-brand-teal bg-brand-teal text-white"
          : "border-input bg-background text-muted-foreground hover:border-brand-teal/50",
      )}
    >
      {label}
    </button>
  );
}

function FieldGroupLabel({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-semibold uppercase tracking-wide text-brand-navy">
      {children}
    </h3>
  );
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
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!photoFile) {
      setPhotoPreview(null);
      return;
    }
    const url = URL.createObjectURL(photoFile);
    setPhotoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photoFile]);

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!ALLOWED_PHOTO_TYPES.includes(file.type)) {
      setPhotoError("Formato no admitido. Usá JPG, PNG o WEBP.");
      return;
    }
    if (file.size > MAX_PHOTO_SIZE) {
      setPhotoError("La imagen no puede pesar más de 5MB.");
      return;
    }
    setPhotoError(null);
    setPhotoFile(file);
  }

  function handleRemovePhoto() {
    setPhotoFile(null);
    setPhotoError(null);
    setValues((v) => ({ ...v, photo_url: "" }));
  }

  function toggleArrayValue(
    field: "coverage" | "modality" | "consultation_reasons",
    value: string,
  ) {
    setValues((prev) => {
      const current = prev[field];
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      return { ...prev, [field]: next };
    });
  }

  function handleProvinceChange(province: string) {
    setValues((v) => ({ ...v, province, city: "" }));
  }

  const { provinces } = useProvinces();
  const { cities: ciudadesDisponibles, status: citiesStatus } = useCitiesByProvince(
    values.province,
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const base = { ...values, photoFile };
    await onSubmit(mode === "create" ? { ...base, email, password } : base);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 max-w-3xl">
      <div className="flex flex-col gap-3">
        <FieldGroupLabel>Datos del profesional</FieldGroupLabel>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="full_name">Nombre y apellido</Label>
            <Input
              id="full_name"
              required
              value={values.full_name}
              onChange={(e) => setValues((v) => ({ ...v, full_name: e.target.value }))}
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="profession">Profesión</Label>
            <select
              id="profession"
              className={selectClassName}
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

          <div className="grid gap-1.5">
            <Label htmlFor="license_number">Matrícula</Label>
            <Input
              id="license_number"
              value={values.license_number}
              onChange={(e) => setValues((v) => ({ ...v, license_number: e.target.value }))}
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="gender">Género</Label>
            <select
              id="gender"
              className={selectClassName}
              value={values.gender}
              onChange={(e) => setValues((v) => ({ ...v, gender: e.target.value }))}
            >
              <option value="">Sin especificar</option>
              {GENDER_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-1.5 md:col-span-2">
            <Label>Foto de perfil</Label>
            <div className="flex items-center gap-4">
              {photoPreview || values.photo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photoPreview || values.photo_url}
                  alt="Foto de perfil"
                  className="w-20 h-20 rounded-full object-cover border"
                />
              ) : (
                <div className="w-20 h-20 shrink-0 rounded-full border bg-muted flex items-center justify-center text-xs text-muted-foreground text-center px-1">
                  Sin foto
                </div>
              )}
              <div className="flex flex-col gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handlePhotoChange}
                />
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {photoPreview || values.photo_url ? "Cambiar foto" : "Subir foto"}
                  </Button>
                  {(photoPreview || values.photo_url) && (
                    <Button type="button" variant="ghost" size="sm" onClick={handleRemovePhoto}>
                      Quitar foto
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">JPG, PNG o WEBP. Máximo 5MB.</p>
                {photoError && <p className="text-xs text-red-500">{photoError}</p>}
              </div>
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="whatsapp">WhatsApp</Label>
            <Input
              id="whatsapp"
              inputMode="numeric"
              maxLength={WHATSAPP_NUMBER_LENGTH}
              placeholder="Ej: 3411234567"
              value={values.whatsapp}
              onChange={(e) =>
                setValues((v) => ({ ...v, whatsapp: sanitizeWhatsappDigits(e.target.value) }))
              }
            />
            <p className="text-xs text-muted-foreground">Solo números, sin 0 ni 15.</p>
            {values.whatsapp && !isValidWhatsappNumber(values.whatsapp) && (
              <p className="text-xs text-red-500">
                Deben ser {WHATSAPP_NUMBER_LENGTH} números (código de área + línea).
              </p>
            )}
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="province">Provincia</Label>
            <select
              id="province"
              className={selectClassName}
              value={values.province}
              onChange={(e) => handleProvinceChange(e.target.value)}
            >
              <option value="">Sin especificar</option>
              {provinces.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="city">Ciudad / Localidad</Label>
            <select
              id="city"
              className={selectClassName}
              value={values.city}
              onChange={(e) => setValues((v) => ({ ...v, city: e.target.value }))}
              disabled={!values.province}
            >
              <option value="">
                {!values.province
                  ? "Elegí primero una provincia"
                  : citiesStatus === "loading"
                    ? "Cargando ciudades..."
                    : "Sin especificar"}
              </option>
              {ciudadesDisponibles.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
              {values.province && citiesStatus === "ready" && ciudadesDisponibles.length === 0 && (
                <option value="General">Toda la provincia</option>
              )}
            </select>
          </div>
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="description">Descripción</Label>
          <textarea
            id="description"
            rows={3}
            className={textareaClassName}
            value={values.description}
            onChange={(e) => setValues((v) => ({ ...v, description: e.target.value }))}
          />
        </div>
      </div>

      <div className="flex flex-col gap-3 border-t pt-4">
        <FieldGroupLabel>Atención</FieldGroupLabel>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="grid gap-1.5">
            <Label>Cobertura</Label>
            <div className="flex flex-wrap gap-2">
              {COVERAGE_OPTIONS.map((o) => (
                <ChipToggle
                  key={o.value}
                  label={o.label}
                  active={values.coverage.includes(o.value)}
                  onClick={() => toggleArrayValue("coverage", o.value)}
                />
              ))}
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label>Modalidad</Label>
            <div className="flex flex-wrap gap-2">
              {MODALITY_OPTIONS.map((o) => (
                <ChipToggle
                  key={o.value}
                  label={o.label}
                  active={values.modality.includes(o.value)}
                  onClick={() => toggleArrayValue("modality", o.value)}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-1.5">
          <Label>Motivos de consulta</Label>
          <div className="flex flex-wrap gap-2">
            {CONSULTATION_REASONS.map((reason) => (
              <ChipToggle
                key={reason}
                label={reason}
                active={values.consultation_reasons.includes(reason)}
                onClick={() => toggleArrayValue("consultation_reasons", reason)}
              />
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
      </div>

      {mode === "create" && (
        <div className="flex flex-col gap-3 border-t pt-4">
          <FieldGroupLabel>Acceso</FieldGroupLabel>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="email">Email de acceso</Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
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
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}

      <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
        {isLoading ? "Guardando..." : submitLabel}
      </Button>
    </form>
  );
}
