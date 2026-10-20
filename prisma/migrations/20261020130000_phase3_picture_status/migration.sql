-- Keep unavailable picture information explicitly unknown.
CREATE TYPE "PictureStatus" AS ENUM ('PRESENT', 'MISSING', 'UNKNOWN');

ALTER TABLE "Profile" ADD COLUMN "pictureStatus" "PictureStatus" NOT NULL DEFAULT 'UNKNOWN';

CREATE INDEX "Profile_pictureStatus_idx" ON "Profile"("pictureStatus");
