import { prisma } from "../../utils/db";
import { ServerError } from "../../utils/error";
import { exec } from "../../utils/utils";

export async function shareFileWithUser(
  userId: string,
  imageId: string,
  shareWith: string,
) {
  const imageDoc = await prisma.images.findUnique({
    where: {
      id: imageId,
    },
  });

  if (!imageDoc) {
    throw new ServerError("Image not found", 404);
  }

  // Only owners cam give share permissions to files
  if (imageDoc.ownerId !== userId) {
    throw new ServerError("Forbidden", 400);
  }

  if (imageDoc.ownerId === shareWith) {
    throw new ServerError("Can't share image with yourself", 400);
  }

  const shareWithUser = await prisma.users.findUnique({
    where: {
      id: shareWith,
    },
  });

  if (!shareWithUser) {
    throw new ServerError("User not found", 404);
  }

  // Verify if the user already has permission to the given image
  const permissionAlreadyExists = await prisma.imagePermissions.findMany({
    where: {
      imageId,
      userId: shareWith,
    },
  });

  // Sanity check, there should be at most one entry for a given user-image pair
  if (permissionAlreadyExists.length >= 1) {
    if (permissionAlreadyExists.length > 1) {
      console.warn({
        message: "Found more that one permission entry",
        user: shareWith,
        image: imageId,
        count: permissionAlreadyExists.length,
      });
      // TODO: Handle this accordingly
    }

    // No need to create the permission
    return {
      permissionId: permissionAlreadyExists[0]!.id,
    };
  }

  const permission = await prisma.imagePermissions.create({
    data: {
      imageId,
      userId: shareWith,
    },
  });

  return {
    permissionId: permission.id,
  };
}

export async function deleteSharingPermission(permissionId: string) {
  const [_, error] = await exec(prisma.imagePermissions.delete({
    where: {
      id: permissionId,
    },
  }));

  if (error) {
    throw new ServerError("Not found", 404);
  }
}
