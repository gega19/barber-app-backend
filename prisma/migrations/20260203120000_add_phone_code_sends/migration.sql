-- CreateTable
CREATE TABLE "phone_code_sends" (
    "phone" TEXT NOT NULL,
    "lastSentAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "phone_code_sends_pkey" PRIMARY KEY ("phone")
);
