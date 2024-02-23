import { z } from "zod";

export const ImageIdSchema = z.object({
  imageId: z.string(),
});
