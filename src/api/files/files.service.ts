import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client as _S3Client,
} from "@aws-sdk/client-s3";

import { getUUID, prisma } from "../../utils/db";
import { ENV } from "../../utils/env";
import { ServerError } from "../../utils/error";
import { Images } from "@prisma/client";
import { exec } from "../../utils/utils";

const S3Client = new _S3Client({
  region: ENV.AWS_REGION,
  credentials: {
    accessKeyId: ENV.AWS_S3_ACCESS_KEY_ID,
    secretAccessKey: ENV.AWS_S3_SECRET_ACCESS_KEY,
  },
});

export async function uploadFile(
  userId: string,
  fileMimeType: string,
  fileBuffer: Buffer,
) {
  const imageId = getUUID();
  const imageFormat = getFileExtension(fileMimeType);

  // Store the image in S3 with the extension so that you can quickly open them up from the S3 dashboard.
  const imageName = `${imageId}.${imageFormat}`;

  const [, error] = await exec(S3Client.send(
    new PutObjectCommand({
      Bucket: ENV.AWS_BUCKET_NAME,
      Key: imageName,
      Body: fileBuffer,
      Metadata: {
        ownerId: userId,
      },
    }),
  ));

  if (error) {
    throw new ServerError();
  }

  const fileURL = getFullFilePath(imageName);

  await prisma.images.create({
    data: {
      id: imageId,
      ownerId: userId,
      url: fileURL,
      format: imageFormat!,
    },
  });

  return {
    imageId,
  };
}

// Deletes an image from S3 and the associated entries on the DB
export async function deleteFile(userId: string, imageId: string) {
  const image = await prisma.images.findFirst({
    where: {
      id: imageId,
    },
    select: {
      ownerId: true,
      format: true,
      ImagePermissions: {
        select: {
          id: true,
        },
      },
    },
  });

  if (!image) {
    throw new ServerError("File not found", 404);
  }

  if (image.ownerId !== userId) {
    throw new ServerError("Forbidden", 400);
  }

  const imageName = `${imageId}.${image.format}`;

  const imageDeletion = prisma.images.delete({
    where: {
      id: imageId,
    },
  });

  const permissionsDeletion = prisma.imagePermissions.deleteMany({
    where: {
      id: {
        in: image.ImagePermissions.map((x) => x.id),
      },
    },
  });

  const fileDeletion = S3Client.send(
    new DeleteObjectCommand({
      Bucket: ENV.AWS_BUCKET_NAME,
      Key: imageName,
    }),
  );

  // This isn't the best way to do it since it complicates error handling. Also, you may want to do something different
  // if, for example, the S3 deletion fails.
  await Promise.all([imageDeletion, permissionsDeletion, fileDeletion]);
}

export async function getAllFilesForUser(userId: string) {
  const [userOwnImages, sharedWithUserImages] = await Promise.all([
    getAllFilesFromUser(userId),
    getAllFilesSharedWithUser(userId),
  ]);

  // Sorting of images to be defined by business logic
  return {
    images: [...userOwnImages, ...sharedWithUserImages],
  };
}

export async function getFileById(userId: string, imageId: string) {
  const image = await prisma.images.findFirst({
    where: { id: imageId },
  });

  if (!image) {
    throw new ServerError("Not found", 404);
  }

  const userHasPermissions = await canUserGetImage(userId, image);

  if (!userHasPermissions) {
    throw new ServerError("Forbidden", 400);
  }

  const imageName = `${imageId}.${image.format}`;

  const fileStreamRequest = S3Client.send(
    new GetObjectCommand({
      Bucket: ENV.AWS_BUCKET_NAME,
      Key: imageName,
    }),
  );

  const [fileStream, error] = await exec(fileStreamRequest);

  if (error) {
    throw new ServerError("File not found", 404);
  }

  return fileStream;
}

// Utils

function getAllFilesFromUser(userId: string) {
  return prisma.images.findMany({
    where: {
      ownerId: userId,
    },
  });
}

async function getAllFilesSharedWithUser(userId: string) {
  const images = await prisma.imagePermissions.findMany({
    where: {
      userId,
    },
    // Only get the image back
    select: {
      image: true,
      id: false,
      imageId: false,
      user: false,
      userId: false,
    },
  });

  return images.map((x) => x.image);
}

async function canUserGetImage(userId: string, image: Images) {
  if (image.ownerId === userId) {
    return true;
  }

  // User requesting the image is not the owner but might have permissions to retrieve it
  const hasPermissions = await prisma.imagePermissions.findFirst({
    where: {
      userId,
      imageId: image.id,
    },
  });

  return hasPermissions;
}

function getFullFilePath(fileName: string) {
  return `https://${ENV.AWS_BUCKET_NAME}.s3.${ENV.AWS_REGION}.amazonaws.com/${fileName}`;
}

function getFileExtension(mimetype: string) {
  const [, format] = mimetype.split("/");

  return format;
}
