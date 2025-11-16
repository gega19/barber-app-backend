-- CreateTable
CREATE TABLE "barber_courses" (
    "id" TEXT NOT NULL,
    "barberId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "institution" TEXT,
    "description" TEXT,
    "completedAt" TIMESTAMP(3),
    "duration" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "barber_courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "barber_course_media" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "thumbnail" TEXT,
    "caption" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "barber_course_media_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "barber_courses_barberId_idx" ON "barber_courses"("barberId");

-- CreateIndex
CREATE INDEX "barber_course_media_courseId_idx" ON "barber_course_media"("courseId");

-- AddForeignKey
ALTER TABLE "barber_courses" ADD CONSTRAINT "barber_courses_barberId_fkey" FOREIGN KEY ("barberId") REFERENCES "barbers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "barber_course_media" ADD CONSTRAINT "barber_course_media_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "barber_courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
