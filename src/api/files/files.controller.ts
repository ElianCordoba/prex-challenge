import { Readable } from "stream";
import express from "express";
const router = express.Router();

import multer from "multer";
const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 1000000 } }); // 1mb max size

import { S3Client as _S3Client } from "@aws-sdk/client-s3";
import { validateToken } from "../../middlewares/authentication";
import { validateRequestParams } from "zod-express-middleware";
import { ImageIdSchema } from "./files.schema";
import { exec } from "../../utils/utils";
import {
  deleteFile,
  getAllFilesForUser,
  getFileById,
  uploadFile,
} from "./files.service";
import { respondWithError } from "../../utils/error";

router.post("/file", validateToken, upload.single("file"), async (req, res) => {
  const currentUser = (req as any).user.userId as string;

  const [response, error] = await exec(
    uploadFile(currentUser, req.file?.mimetype!, req.file!.buffer),
  );

  if (error) {
    return respondWithError(res, error);
  }

  return res.json(response);
});

router.delete(
  "/file/:imageId",
  validateToken,
  validateRequestParams(ImageIdSchema),
  async (req, res) => {
    const currentUser = (req as any).user.userId;
    const imageId = req.params.imageId;

    const [response, error] = await exec(deleteFile(currentUser, imageId));

    if (error) {
      return respondWithError(res, error);
    }

    return res.json(response);
  },
);

router.get("/file/all", validateToken, async (req, res) => {
  const currentUser = (req as any).user.userId;

  const [response, error] = await exec(getAllFilesForUser(currentUser));

  if (error) {
    return respondWithError(res, error);
  }

  return res.json(response);
});

router.get(
  "/file/:imageId",
  validateToken,
  validateRequestParams(ImageIdSchema),
  async (req, res) => {
    const currentUser = (req as any).user.userId;
    const imageId = req.params.imageId;

    const [fileStream, error] = await exec(getFileById(currentUser, imageId));

    if (error) {
      return respondWithError(res, error);
    }

    return (fileStream.Body as Readable).pipe(res);
  },
);

export const filesRoutes = router;
