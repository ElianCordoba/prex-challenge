import { Response } from "express";

export class ServerError {
  constructor(public message = "Unexpected error", public code = 500) {}
}

export function respondWithError(res: Response, error?: any) {
  return res.status(error?.code || 500).json({
    message: error.message || "Unknown error",
  });
}
