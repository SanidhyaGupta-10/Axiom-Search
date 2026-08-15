-- AlterTable: Add supabaseId with a temporary default for existing rows
ALTER TABLE "User" ADD COLUMN "supabaseId" TEXT NOT NULL DEFAULT '';

-- Remove the default so future inserts must provide a value
ALTER TABLE "User" ALTER COLUMN "supabaseId" DROP DEFAULT;

-- CreateIndex: Make email unique
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
