import { z } from "zod";

export const ShareFileSchema = z.object({
  imageId: z.string(),
  shareWith: z.string(),
});

export const DeleteSharingPermission = z.object({
  permissionId: z.string(),
});
