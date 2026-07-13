import * as z from "zod";

const passwordRequirements = z.string()
    .min(8, "La password deve essere lunga almeno 8 caratteri")
    .max(128, "La password è troppo lunga")
    .refine((password) => /[A-Z]/.test(password), {
        message: "Deve contenere almeno una lettera maiuscola",
    })
    .refine((password) => /[a-z]/.test(password), {
        message: "Deve contenere almeno una lettera minuscola",
    })
    .refine((password) => /[0-9]/.test(password), {
        message: "Deve contenere almeno un numero"
    })
    .refine((password) => /[!@#$%^&*]/.test(password), {
        message: "Deve contenere almeno un carattere speciale (!@#$%^&*)",
    })

export const changePasswordRequirements = z.object({
    body: z.object({
        // La password attuale si confronta con l'hash: basta che non sia vuota.
        currentPassword: z.string().min(1, "Password attuale richiesta"),
        newPassword: passwordRequirements,
    })
});


export type changePasswordDTO = z.infer<typeof changePasswordRequirements>['body'];