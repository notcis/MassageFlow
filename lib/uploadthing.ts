import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { requireAdminSession } from "@/lib/auth";

const f = createUploadthing();

export const ourFileRouter = {
  staffAvatarUploader: f({
    image: {
      maxFileSize: "4MB",
      maxFileCount: 1,
    },
  })
    .middleware(async () => {
      const authCheck = await requireAdminSession();
      if (!authCheck.authorized) {
        throw new UploadThingError("Unauthorized");
      }
      return { userId: authCheck.session.user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      return { uploadedBy: metadata.userId, url: file.ufsUrl };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
