import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import z from "zod";
import { auth } from "~/server/auth";
import { db } from "~/server/db";

const f = createUploadthing();

// FileRouter for your app, can contain multiple FileRoutes
export const ourFileRouter = {
  // Define as many FileRoutes as you like, each with a unique routeSlug
  imageUploader: f({
    image: {
      /**
       * For full list of options and defaults, see the File Route API reference
       * @see https://docs.uploadthing.com/file-routes#route-config
       */
      maxFileSize: "4MB",
      maxFileCount: 1,
    },
  })
    .input(z.object({ recipeId: z.string() }))
    // Set permissions and file types for this FileRoute
    .middleware(async ({ req, input }) => {
      // This code runs on your server before upload
      const session = await auth();

      // If you throw, the session will not be able to upload
      if (!session) throw new UploadThingError("Unauthorized");

      // Whatever is returned here is accessible in onUploadComplete as `metadata`
      return { userId: session.user.id, recipeId: input.recipeId };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      await db.recipe.update({
        where: { id: metadata.recipeId, userId: metadata.userId },
        data: { imageUrl: file.ufsUrl },
      });

      return { imageUrl: file.ufsUrl };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
