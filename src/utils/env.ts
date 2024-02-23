import { config } from "dotenv";
config();

const _env = process.env as any;

export const ENV = {
  SERVER_PORT: Number(_env.SERVER_PORT),
  DATABASE_URL: _env.DATABASE_URL as string,
  JWT_SECRET: _env.JWT_SECRET as string,
  AWS_REGION: _env.AWS_REGION as string,
  AWS_S3_ACCESS_KEY_ID: _env.AWS_S3_ACCESS_KEY_ID as string,
  AWS_S3_SECRET_ACCESS_KEY: _env.AWS_S3_SECRET_ACCESS_KEY as string,
  AWS_BUCKET_NAME: _env.AWS_BUCKET_NAME as string,
};
