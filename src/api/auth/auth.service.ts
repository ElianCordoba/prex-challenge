import { sign, verify } from "jsonwebtoken";
import { compare, hash } from "bcrypt";
import { ENV } from "../../utils/env";
import { prisma } from "../../utils/db";
import { ServerError } from "../../utils/error";

export async function createUser(
  name: string,
  email: string,
  password: string,
) {
  const isEmailTaken = await prisma.users.findMany({
    where: {
      email,
    },
  });

  if (isEmailTaken.length !== 0) {
    throw new ServerError("Email already taken", 400);
  }

  const hashedPassword = await hashPassword(password);

  const userDoc = await prisma.users.create({
    data: {
      name,
      email,
      password: hashedPassword,
    },
  });

  return {
    message: `Successfully created user ${name}`,
    id: userDoc.id,
  };
}

export async function loginUser(email: string, password: string) {
  const user = await prisma.users.findUnique({
    where: {
      email,
    },
  });

  if (!user) {
    throw new ServerError("Wrong credentials", 400);
  }

  const isCorrectPassword = await verifyPassword(password, user.password);

  if (!isCorrectPassword) {
    throw new ServerError("Wrong credentials", 400);
  }

  const token = createToken(user.id);

  return {
    token,
    userId: user.id,
  };
}

// Utils

function createToken(userId: string) {
  return sign({ userId }, ENV.JWT_SECRET);
}

export function verifyToken(token: string) {
  return verify(token, ENV.JWT_SECRET);
}

async function hashPassword(password: string) {
  try {
    const hashedPassword = await hash(password, 10);

    return hashedPassword;
  } catch (error) {
    throw new Error("Error hashing password");
  }
}

function verifyPassword(password: string, hashedPassword: string) {
  try {
    return compare(password, hashedPassword);
  } catch (error) {
    return false;
  }
}
