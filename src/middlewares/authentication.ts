import type { NextFunction, Request, Response } from "express";
import { verifyToken } from "../api/auth/auth.service";

export function validateToken(req: Request, res: Response, next: NextFunction) {
  const token = (req.headers.authorization || "").split("Bearer ")[1];

  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const decodedToken = verifyToken(token);
    (req as any).user = decodedToken;
    return next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
}
