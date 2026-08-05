"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Save, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  DEFAULT_PHONE_COUNTRY,
  getPhoneCountry,
  PHONE_COUNTRIES,
  sanitizePhoneDigits,
} from "@/lib/whatsapp";
import {
  buildProfessionalFormSchema,
  type ProfessionalFormSchema,
} from "@/features/professionals/schemas/professionalSchema";
import type { ProfessionalFormValues } from "@/features/professionals/types";

const EMPTY_VALUES: ProfessionalFormSchema = {
  full_name: "",
  profession: PROFESSION_OPTIONS[0].value,
  license_number: "",
  gender: "",
  description: "",
  photo_url: "",
  whatsapp: "",
  whatsapp_country: DEFAULT_PHONE_COUNTRY,
  instagram_url: "",
  linkedin_url: "",
  province: "",
  city: "",
  coverage: [],
  modality: [],
  consultation_reasons: [],
  email: "",
  password: "",
};

export interface ProfessionalFormSubmitValues extends ProfessionalFormValues {
  photoFile?: File | null;
  photoRemoved?: boolean;
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
}: ProfessionalFormProps) {
  const {
    register,
    handleSubmit: handleFormSubmit,
    watch,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<ProfessionalFormSchema>({
    resolver: zodResolver(buildProfessionalFormSchema(mode)),
    defaultValues: { ...EMPTY_VALUES, ...initialValues },
  });

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoRemoved, setPhotoRemoved] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const photoUrl = watch("photo_url");
  const whatsappCountry = watch("whatsapp_country");
  const province = watch("province");
  const city = watch("city");
  const coverage = watch("coverage");
  const modality = watch("modality");
  const consultationReasons = watch("consultation_reasons");

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
    setPhotoRemoved(false);
    setPhotoFile(file);
  }

  function handleRemovePhoto() {
    setPhotoFile(null);
    setPhotoError(null);
    setPhotoRemoved(true);
    setValue("photo_url", "");
  }

  function toggleArrayValue(
    field: "coverage" | "modality" | "consultation_reasons",
    value: string,
  ) {
    const current = getValues(field);
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    // RHF tipa setValue por path literal; con un field de tipo unión no distribuye el tipo
    // automáticamente aunque los 3 campos sean todos string[].
    setValue(field, next as never, { shouldValidate: true });
  }

  const { provinces } = useProvinces();
  const { cities: ciudadesDisponibles, status: citiesStatus } = useCitiesByProvince(province);

  const onValid = handleFormSubmit(async ({ email, password, ...values }) => {
    const base = { ...values, photoFile, photoRemoved };
    await onSubmit(mode === "create" ? { ...base, email, password } : base);
  });

  return (
    <form onSubmit={onValid} className="flex flex-col gap-6 max-w-3xl">
      <div className="flex flex-col gap-3">
        <FieldGroupLabel>Datos del profesional</FieldGroupLabel>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="full_name">Nombre y apellido</Label>
            <Input id="full_name" {...register("full_name")} />
            {errors.full_name && (
              <p className="text-xs text-red-500">{errors.full_name.message}</p>
            )}
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="profession">Profesión</Label>
            <select id="profession" className={selectClassName} {...register("profession")}>
              {PROFESSION_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="license_number">Matrícula</Label>
            <Input id="license_number" {...register("license_number")} />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="gender">Género</Label>
            <select id="gender" className={selectClassName} {...register("gender")}>
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
              {photoPreview || photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photoPreview || photoUrl}
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
                    <Upload className="size-3.5" />
                    {photoPreview || photoUrl ? "Cambiar foto" : "Subir foto"}
                  </Button>
                  {(photoPreview || photoUrl) && (
                    <Button type="button" variant="ghost" size="sm" onClick={handleRemovePhoto}>
                      <Trash2 className="size-3.5" />
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
            <div className="flex gap-2">
              <select
                id="whatsapp_country"
                className={cn(selectClassName, "w-40 shrink-0")}
                {...register("whatsapp_country")}
                onChange={(e) => {
                  setValue("whatsapp_country", e.target.value);
                  setValue("whatsapp", sanitizePhoneDigits(getValues("whatsapp"), e.target.value), {
                    shouldValidate: true,
                  });
                }}
              >
                {PHONE_COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.label}
                  </option>
                ))}
              </select>
              <Input
                id="whatsapp"
                inputMode="numeric"
                maxLength={getPhoneCountry(whatsappCountry).numberLength}
                placeholder={whatsappCountry === "AR" ? "Ej: 3411234567" : "Ej: 666155767"}
                {...register("whatsapp")}
                onChange={(e) =>
                  setValue("whatsapp", sanitizePhoneDigits(e.target.value, whatsappCountry), {
                    shouldValidate: true,
                  })
                }
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {whatsappCountry === "AR" ? "Solo números, sin 0 ni 15." : "Solo números."}
            </p>
            {errors.whatsapp && <p className="text-xs text-red-500">{errors.whatsapp.message}</p>}
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="instagram_url">Instagram</Label>
            <Input
              id="instagram_url"
              placeholder="Ej: usuario o https://instagram.com/usuario"
              {...register("instagram_url")}
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="linkedin_url">LinkedIn</Label>
            <Input
              id="linkedin_url"
              placeholder="Ej: usuario o https://linkedin.com/in/usuario"
              {...register("linkedin_url")}
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="province">Provincia</Label>
            {/* Select controlado (value + onChange) en vez de register(): sus <option> se */}
            {/* cargan async vía useProvinces, y el defaultValue por ref de RHF se pierde */}
            {/* si el valor inicial se setea antes de que esas opciones existan en el DOM. */}
            <select
              id="province"
              className={selectClassName}
              value={province}
              onChange={(e) => {
                setValue("province", e.target.value);
                setValue("city", "");
              }}
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
              value={city}
              onChange={(e) => setValue("city", e.target.value, { shouldValidate: true })}
              disabled={!province}
            >
              <option value="">
                {!province
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
              {province && citiesStatus === "ready" && ciudadesDisponibles.length === 0 && (
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
            {...register("description")}
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
                  active={coverage.includes(o.value)}
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
                  active={modality.includes(o.value)}
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
                active={consultationReasons.includes(reason)}
                onClick={() => toggleArrayValue("consultation_reasons", reason)}
              />
            ))}
          </div>
        </div>
      </div>

      {mode === "create" && (
        <div className="flex flex-col gap-3 border-t pt-4">
          <FieldGroupLabel>Acceso</FieldGroupLabel>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="email">Email de acceso</Label>
              <Input id="email" type="email" {...register("email")} />
              {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="password">Contraseña provisoria</Label>
              <Input id="password" type="password" {...register("password")} />
              {errors.password && (
                <p className="text-xs text-red-500">{errors.password.message}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}

      <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
        {mode === "create" ? <Plus className="size-4" /> : <Save className="size-4" />}
        {isLoading ? "Guardando..." : submitLabel}
      </Button>
    </form>
  );
}
