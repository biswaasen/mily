import { z } from "zod";

export const loginSchema = z.object({
  idToken: z.string(),
});
