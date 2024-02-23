import { PrismaClient } from "@prisma/client";
export const prisma = new PrismaClient();

export function getUUID() {
  return crypto.randomUUID();
}
