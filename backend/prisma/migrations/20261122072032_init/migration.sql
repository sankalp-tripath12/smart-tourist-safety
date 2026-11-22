-- CreateTable
CREATE TABLE "Tourist" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "touristCode" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "emergencyContactName" TEXT NOT NULL,
    "emergencyContactPhone" TEXT NOT NULL,
    "itinerary" TEXT,
    "visitExpiry" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Tourist_touristCode_key" ON "Tourist"("touristCode");
