import { z } from "zod";
import {
  COVERAGE_OPTIONS,
  GENDER_OPTIONS,
  MODALITY_OPTIONS,
  PROFESSION_OPTIONS,
} from "@/features/professionals/constants";
import { getPhoneCountry, isValidPhoneNumber, PHONE_COUNTRIES } from "@/lib/whatsapp";

const professionValues = PROFESSION_OPTIONS.map((o) => o.value) as [string, ...string[]];
const genderValues = GENDER_OPTIONS.map((o) => o.value) as [string, ...string[]];
const coverageValues = COVERAGE_OPTIONS.map((o) => o.value) as [string, ...string[]];
const modalityValues = MODALITY_OPTIONS.map((o) => o.value) as [string, ...string[]];
const phoneCountryValues = PHONE_COUNTRIES.map((c) => c.code) as [string, ...string[]];

// email/password quedan como string simples acá: se validan condicionalmente en
// buildProfessionalFormSchema según el modo, para que el tipo inferido (ProfessionalFormSchema)
// sea el mismo en "create" y en "edit" y el formulario pueda usar un solo useForm<...>.
const baseShape = {
  full_name: z.string().trim().min(1, "Ingresá el nombre y apellido."),
  profession: z.enum(professionValues),
  license_number: z.string(),
  gender: z.union([z.enum(genderValues), z.literal("")]),
  description: z.string(),
  photo_url: z.string(),
  whatsapp: z.string(),
  whatsapp_country: z.enum(phoneCountryValues),
  instagram_url: z.string(),
  linkedin_url: z.string(),
  province: z.string(),
  city: z.string(),
  coverage: z.array(z.enum(coverageValues)),
  modality: z.array(z.enum(modalityValues)),
  consultation_reasons: z.array(z.string()),
  email: z.string(),
  password: z.string(),
};

export function buildProfessionalFormSchema(mode: "create" | "edit") {
  return z.object(baseShape).superRefine((values, ctx) => {
    if (values.whatsapp !== "" && !isValidPhoneNumber(values.whatsapp, values.whatsapp_country)) {
      const country = getPhoneCountry(values.whatsapp_country);
      ctx.addIssue({
        code: "custom",
        path: ["whatsapp"],
        message: `Deben ser ${country.numberLength} números para ${country.label}.`,
      });
    }

    if (mode !== "create") return;

    if (!z.string().trim().email().safeParse(values.email).success) {
      ctx.addIssue({ code: "custom", path: ["email"], message: "Ingresá un email válido." });
    }
    if (values.password.length < 6) {
      ctx.addIssue({
        code: "custom",
        path: ["password"],
        message: "La contraseña debe tener al menos 6 caracteres.",
      });
    }
  });
}

export type ProfessionalFormSchema = z.infer<ReturnType<typeof buildProfessionalFormSchema>>;
