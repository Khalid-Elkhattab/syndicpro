import { z } from 'zod';

export const residenceSchema = z.object({
  nom: z.string().min(1, 'Le nom est obligatoire.').max(150),
  ville: z.string().min(1, 'La ville est obligatoire.').max(100),
  adresse: z.string().min(1, 'L\'adresse est obligatoire.').max(500),
});

export const immeubleSchema = z.object({
  residence_id: z.number({ required_error: 'La résidence est obligatoire.' }),
  nom: z.string().min(1, 'Le nom est obligatoire.').max(100),
});

export const appartementSchema = z.object({
  residence_id: z.number({ required_error: 'La résidence est obligatoire.' }),
  immeuble_id: z.number({ required_error: 'L\'immeuble est obligatoire.' }),
  numero: z.string().min(1, 'Le numéro est obligatoire.').max(20),
  etage: z.number().int().min(0, 'L\'étage doit être positif.'),
  tantieme: z.number().positive('Le tantième doit être supérieur à 0.'),
  coproprietaire_id: z.number().optional().nullable(),
});

export const coproprietaireSchema = z.object({
  name: z.string().min(1, 'Le nom est obligatoire.').max(100),
  email: z.string().email('L\'adresse email n\'est pas valide.'),
  phone: z.string().max(20).optional(),
  username: z
    .string()
    .min(1, 'Le nom d\'utilisateur est obligatoire.')
    .max(50)
    .regex(/^[a-zA-Z0-9._]+$/, 'Lettres, chiffres, points et underscores uniquement.'),
  password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères.'),
  password_confirmation: z.string(),
}).refine((d) => d.password === d.password_confirmation, {
  message: 'Les mots de passe ne correspondent pas.',
  path: ['password_confirmation'],
});

export const updateCoproprietaireSchema = z.object({
  name: z.string().min(1, 'Le nom est obligatoire.').max(100),
  email: z.string().email('L\'adresse email n\'est pas valide.'),
  phone: z.string().max(20).optional(),
  username: z
    .string()
    .min(1, 'Le nom d\'utilisateur est obligatoire.')
    .max(50)
    .regex(/^[a-zA-Z0-9._]+$/, 'Lettres, chiffres, points et underscores uniquement.'),
});

export const resetPasswordSchema = z.object({
  password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères.'),
  password_confirmation: z.string(),
}).refine((d) => d.password === d.password_confirmation, {
  message: 'Les mots de passe ne correspondent pas.',
  path: ['password_confirmation'],
});

export const compteChargeSchema = z.object({
  nom: z.string().min(1, 'Le nom est obligatoire.').max(150),
  description: z.string().max(500).optional().nullable(),
  is_active: z.boolean().optional(),
});

export const sousChargeSchema = z.object({
  nom: z.string().min(1, 'Le nom est obligatoire.').max(150),
  description: z.string().max(500).optional().nullable(),
});

export const depenseSchema = z.object({
  sous_charge_id: z.number({ required_error: 'La sous-charge est obligatoire.' }),
  date: z.string().min(1, 'La date est obligatoire.'),
  montant: z.number().positive('Le montant doit être supérieur à 0.'),
  description: z.string().min(1, 'La description est obligatoire.').max(1000),
  justificatif: z.instanceof(File).optional().nullable(),
});

export const horsBudgetSchema = z.object({
  date: z.string().min(1, 'La date est obligatoire.'),
  montant: z.number().positive('Le montant doit être supérieur à 0.'),
  description: z.string().min(1, 'La description est obligatoire.').max(1000),
  justificatif: z.instanceof(File).optional().nullable(),
});

export type ResidenceFormData = z.infer<typeof residenceSchema>;
export type ImmeubleFormData = z.infer<typeof immeubleSchema>;
export type AppartementFormData = z.infer<typeof appartementSchema>;
export type CoproprietaireFormData = z.infer<typeof coproprietaireSchema>;
export type UpdateCoproprietaireFormData = z.infer<typeof updateCoproprietaireSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
export type CompteChargeFormData = z.infer<typeof compteChargeSchema>;
export type SousChargeFormData = z.infer<typeof sousChargeSchema>;
export type DepenseFormData = z.infer<typeof depenseSchema>;
export type HorsBudgetFormData = z.infer<typeof horsBudgetSchema>;