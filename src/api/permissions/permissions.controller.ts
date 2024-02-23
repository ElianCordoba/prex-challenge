import express from "express";
import {
  validateRequestBody,
  validateRequestParams,
} from "zod-express-middleware";
import { validateToken } from "../../middlewares/authentication";
import { DeleteSharingPermission, ShareFileSchema } from "./permissions.schema";
import {
  deleteSharingPermission,
  shareFileWithUser,
} from "./permissions.service";
import { exec } from "../../utils/utils";
import { respondWithError } from "../../utils/error";
const router = express.Router();

router.post(
  "/share-file",
  validateToken,
  validateRequestBody(ShareFileSchema),
  async (req, res) => {
    const { imageId, shareWith } = req.body;
    const currentUser = (req as any).user.userId;

    const [response, error] = await exec(
      shareFileWithUser(currentUser, imageId, shareWith),
    );

    if (error) {
      return respondWithError(res, error);
    }

    return res.json(response);
  },
);

router.delete(
  "/share-file/:permissionId",
  validateToken,
  validateRequestParams(DeleteSharingPermission),
  async (req, res) => {
    const { permissionId } = req.params;

    const [_, error] = await exec(
      deleteSharingPermission(permissionId),
    );

    if (error) {
      return respondWithError(res, error);
    }

    return res.json({ ok: true });
  },
);

export const permissionRoutes = router;
