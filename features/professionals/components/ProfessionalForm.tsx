"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus, Save, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  CONSULTATION_REASONS,
  COVERAGE_OPTIONS,
  GENDER_OPTIONS,
  LICENSE_TYPE_OPTIONS,
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
  license_type: "nacional",
  license_province: "",
  gender: "",
  consultation_fee: "",
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

const fieldClassName =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm";
const textareaClassName =
  "flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

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
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
        active
          ? "border-brand-teal bg-brand-teal text-white"
          : "border-input bg-background text-muted-foreground hover:border-brand-teal/50 hover:text-brand-navy",
      )}
    >
      {label}
    </button>
  );
}

function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-base text-brand-navy">{title}</CardTitle>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </CardHeader>
      <CardContent className="flex flex-col gap-4">{children}</CardContent>
    </Card>
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
    reset,
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
  // Guarda contra doble-click: ver misma justificación en BookingForm.
  const isSubmittingRef = useRef(false);

  const photoUrl = watch("photo_url");
  const whatsappCountry = watch("whatsapp_country");
  const licenseType = watch("license_type");
  const licenseProvince = watch("license_province");
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
    if (isSubmittingRef.current || isLoading) return;
    isSubmittingRef.current = true;
    try {
      const base = { ...values, photoFile, photoRemoved };
      await onSubmit(mode === "create" ? { ...base, email, password } : base);
      if (mode === "create") {
        // Si el navegador reutiliza la instancia del formulario al volver a "nuevo"
        // (cache de navegación de Next.js), evita que queden los datos del alta anterior.
        reset(EMPTY_VALUES);
        setPhotoFile(null);
        setPhotoRemoved(false);
        setPhotoError(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    } catch {
      // El error ya quedó expuesto vía la prop `error`; no se limpia el formulario.
    } finally {
      isSubmittingRef.current = false;
    }
  });

  return (
    <form onSubmit={onValid} className="flex flex-col gap-6 max-w-3xl">
      <SectionCard title="Datos del profesional">
        <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-2">
          <div className="grid gap-1.5">
            <Label htmlFor="full_name">Nombre y apellido</Label>
            <Input
              id="full_name"
              autoComplete="name"
              aria-invalid={!!errors.full_name}
              aria-describedby={errors.full_name ? "full_name-error" : undefined}
              {...register("full_name")}
            />
            {errors.full_name && (
              <p id="full_name-error" role="alert" className="text-xs text-red-600">
                {errors.full_name.message}
              </p>
            )}
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="profession">Profesión</Label>
            <select id="profession" className={fieldClassName} {...register("profession")}>
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
            <Label>Tipo de matrícula</Label>
            <div className="flex flex-wrap gap-2">
              {LICENSE_TYPE_OPTIONS.map((o) => (
                <ChipToggle
                  key={o.value}
                  label={o.label}
                  active={licenseType === o.value}
                  onClick={() => {
                    setValue("license_type", o.value, { shouldValidate: true });
                    if (o.value === "nacional") {
                      setValue("license_province", "", { shouldValidate: true });
                    }
                  }}
                />
              ))}
            </div>
          </div>

          {licenseType === "provincial" && (
            <div className="grid gap-1.5">
              <Label htmlFor="license_province">Provincia de la matrícula</Label>
              <select
                id="license_province"
                className={fieldClassName}
                value={licenseProvince}
                onChange={(e) =>
                  setValue("license_province", e.target.value, { shouldValidate: true })
                }
              >
                <option value="">Elegí una provincia</option>
                {provinces.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
              {errors.license_province && (
                <p role="alert" className="text-xs text-red-600">
                  {errors.license_province.message}
                </p>
              )}
            </div>
          )}

          <div className="grid gap-1.5">
            <Label htmlFor="consultation_fee">Precio de la sesión</Label>
            <Input
              id="consultation_fee"
              type="number"
              inputMode="decimal"
              min="0"
              step="1"
              placeholder="Ej: 15000"
              aria-invalid={!!errors.consultation_fee}
              aria-describedby={errors.consultation_fee ? "consultation_fee-error" : undefined}
              {...register("consultation_fee")}
            />
            {errors.consultation_fee && (
              <p id="consultation_fee-error" role="alert" className="text-xs text-red-600">
                {errors.consultation_fee.message}
              </p>
            )}
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="gender">Género</Label>
            <select id="gender" className={fieldClassName} {...register("gender")}>
              <option value="">Sin especificar</option>
              {GENDER_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="province">Provincia</Label>
            {/* Select controlado (value + onChange) en vez de register(): sus <option> se */}
            {/* cargan async vía useProvinces, y el defaultValue por ref de RHF se pierde */}
            {/* si el valor inicial se setea antes de que esas opciones existan en el DOM. */}
            <select
              id="province"
              className={fieldClassName}
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
              className={fieldClassName}
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

          <div className="grid gap-1.5 md:col-span-2">
            <Label>Foto de perfil</Label>
            <div className="flex items-center gap-4">
              {photoPreview || photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photoPreview || photoUrl}
                  alt="Foto de perfil"
                  className="h-20 w-20 shrink-0 rounded-full border-2 border-brand-teal/30 object-cover"
                />
              ) : (
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border border-dashed bg-muted px-1 text-center text-xs text-muted-foreground">
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
                    <Upload className="size-3.5" aria-hidden="true" />
                    {photoPreview || photoUrl ? "Cambiar foto" : "Subir foto"}
                  </Button>
                  {(photoPreview || photoUrl) && (
                    <Button type="button" variant="ghost" size="sm" onClick={handleRemovePhoto}>
                      <Trash2 className="size-3.5" aria-hidden="true" />
                      Quitar foto
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">JPG, PNG o WEBP. Máximo 5MB.</p>
                {photoError && (
                  <p role="alert" className="text-xs text-red-600">
                    {photoError}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="whatsapp">WhatsApp</Label>
            <div className="flex gap-2">
              <select
                id="whatsapp_country"
                aria-label="País"
                className={cn(fieldClassName, "w-40 shrink-0")}
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
                autoComplete="tel-national"
                maxLength={getPhoneCountry(whatsappCountry).numberLength}
                placeholder={whatsappCountry === "AR" ? "Ej: 3411234567" : "Ej: 666155767"}
                aria-invalid={!!errors.whatsapp}
                aria-describedby="whatsapp-hint"
                {...register("whatsapp")}
                onChange={(e) =>
                  setValue("whatsapp", sanitizePhoneDigits(e.target.value, whatsappCountry), {
                    shouldValidate: true,
                  })
                }
              />
            </div>
            <p id="whatsapp-hint" className="text-xs text-muted-foreground">
              {whatsappCountry === "AR" ? "Solo números, sin 0 ni 15." : "Solo números."}
            </p>
            {errors.whatsapp && (
              <p role="alert" className="text-xs text-red-600">
                {errors.whatsapp.message}
              </p>
            )}
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
      </SectionCard>

      <SectionCard title="Atención" description="Cobertura, modalidad y motivos que atiende.">
        <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-2">
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
      </SectionCard>

      {mode === "create" && (
        <SectionCard title="Acceso" description="Credenciales para que el profesional pueda ingresar.">
          <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="email">Email de acceso</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? "email-error" : undefined}
                {...register("email")}
              />
              {errors.email && (
                <p id="email-error" role="alert" className="text-xs text-red-600">
                  {errors.email.message}
                </p>
              )}
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="password">Contraseña provisoria</Label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                aria-invalid={!!errors.password}
                aria-describedby={errors.password ? "password-error" : undefined}
                {...register("password")}
              />
              {errors.password && (
                <p id="password-error" role="alert" className="text-xs text-red-600">
                  {errors.password.message}
                </p>
              )}
            </div>
          </div>
        </SectionCard>
      )}

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}

      <Button
        type="submit"
        disabled={isLoading}
        aria-busy={isLoading}
        className="w-full sm:w-auto sm:self-start"
      >
        {isLoading ? (
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        ) : mode === "create" ? (
          <Plus className="size-4" aria-hidden="true" />
        ) : (
          <Save className="size-4" aria-hidden="true" />
        )}
        {isLoading ? "Guardando..." : submitLabel}
      </Button>
    </form>
  );
}
