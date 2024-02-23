import express from "express";
const router = express.Router();

import { validateRequestBody } from "zod-express-middleware";

import { LoginSchema, SignupSchema } from "./auth.schema";
import { createUser, loginUser } from "./auth.service";
import { respondWithError } from "../../utils/error";
import { exec } from "../../utils/utils";

router.post("/signup", validateRequestBody(SignupSchema), async (req, res) => {
  const { name, email, password } = req.body;

  const [result, error] = await exec(createUser(name, email, password));

  if (error) {
    return respondWithError(res, error);
  }

  return res.json(result);
});

router.post("/login", validateRequestBody(LoginSchema), async (req, res) => {
  const { email, password } = req.body;

  const [result, error] = await exec(loginUser(email, password));

  if (error) {
    return respondWithError(res, error);
  }

  return res.json(result);
});

export const authRoutes = router;
