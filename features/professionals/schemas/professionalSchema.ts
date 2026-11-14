import { z } from "zod";
import {
  COVERAGE_OPTIONS,
  GENDER_OPTIONS,
  LICENSE_TYPE_OPTIONS,
  MODALITY_OPTIONS,
  PROFESSION_OPTIONS,
} from "@/features/professionals/constants";
import { isPhoneCountry, isValidSplitPhone } from "@/features/appointments/lib/phone";

const professionValues = PROFESSION_OPTIONS.map((o) => o.value) as [string, ...string[]];
const genderValues = GENDER_OPTIONS.map((o) => o.value) as [string, ...string[]];
const coverageValues = COVERAGE_OPTIONS.map((o) => o.value) as [string, ...string[]];
const modalityValues = MODALITY_OPTIONS.map((o) => o.value) as [string, ...string[]];
const licenseTypeValues = LICENSE_TYPE_OPTIONS.map((o) => o.value) as [string, ...string[]];

// email/password quedan como string simples acá: se validan condicionalmente en
// buildProfessionalFormSchema según el modo, para que el tipo inferido (ProfessionalFormSchema)
// sea el mismo en "create" y en "edit" y el formulario pueda usar un solo useForm<...>.
const baseShape = {
  full_name: z.string().trim().min(1, "Ingresá el nombre y apellido."),
  profession: z.enum(professionValues),
  license_number: z.string(),
  license_type: z.enum(licenseTypeValues),
  license_province: z.string(),
  gender: z.union([z.enum(genderValues), z.literal("")]),
  consultation_fee: z.string(),
  description: z.string(),
  photo_url: z.string(),
  // El WhatsApp se carga igual que en la reserva de turnos del paciente: cualquier país,
  // código de área y número por separado. Al enviar se guardan juntos en `whatsapp`.
  whatsapp_country: z.string().refine(isPhoneCountry, "Elegí un país válido."),
  whatsapp_area: z.string(),
  whatsapp_number: z.string(),
  instagram_url: z.string(),
  linkedin_url: z.string(),
  province: z.string(),
  city: z.string(),
  coverage: z.array(z.enum(coverageValues)),
  modality: z.array(z.enum(modalityValues)),
  consultation_reasons: z.array(z.string()),
  health_insurances: z.array(z.string()),
  orientations: z.array(z.string()),
  email: z.string(),
  password: z.string(),
};

export function buildProfessionalFormSchema(mode: "create" | "edit") {
  return z.object(baseShape).superRefine((values, ctx) => {
    // El WhatsApp del profesional es opcional: solo se valida si se completó algo.
    const hasWhatsapp = values.whatsapp_area !== "" || values.whatsapp_number !== "";
    if (
      hasWhatsapp &&
      !isValidSplitPhone(values.whatsapp_area, values.whatsapp_number, values.whatsapp_country)
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["whatsapp_number"],
        message: "Ingresá un WhatsApp válido para el país seleccionado.",
      });
    }

    if (values.license_type === "provincial" && values.license_province.trim() === "") {
      ctx.addIssue({
        code: "custom",
        path: ["license_province"],
        message: "Elegí la provincia de la matrícula.",
      });
    }

    if (values.consultation_fee !== "") {
      const fee = Number(values.consultation_fee);
      if (!Number.isFinite(fee) || fee < 0) {
        ctx.addIssue({
          code: "custom",
          path: ["consultation_fee"],
          message: "Ingresá un precio válido.",
        });
      }
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
