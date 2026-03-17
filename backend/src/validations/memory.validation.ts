import { z } from "zod";

export const addMemorySchema = z.object({
  content: z.string().min(1, "Content is required").transform((s) => s.trim()),
  key: z
    .string()
    .optional()
    .transform((s) => s?.trim() || undefined)
    .refine((val) => !val || val.length <= 16, "Key must be at most 16 characters"),
});

export const deleteMemorySchema = z.object({
  id: z.string().uuid("Invalid memory ID"),
});
