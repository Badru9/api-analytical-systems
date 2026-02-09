-- CreateEnum
CREATE TYPE "Term" AS ENUM ('GANJIL', 'GENAP');

-- CreateEnum
CREATE TYPE "RoleName" AS ENUM ('DOSEN', 'KAPRODI', 'LPPM', 'LPM', 'DEKAN', 'ADMIN');

-- CreateEnum
CREATE TYPE "RpsStatus" AS ENUM ('DRAFT', 'FINAL', 'APPROVED');

-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('PLANNED', 'ONGOING', 'COMPLETED');

-- CreateEnum
CREATE TYPE "OutputType" AS ENUM ('JOURNAL', 'PROCEEDING', 'HKI', 'BOOK', 'PATENT', 'DATASET', 'OTHER');

-- CreateEnum
CREATE TYPE "TargetIndex" AS ENUM ('SINTA', 'SCOPUS', 'WOS', 'NONE');

-- CreateEnum
CREATE TYPE "OutputStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'ACCEPTED', 'PUBLISHED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ProgramStatus" AS ENUM ('PLANNED', 'ONGOING', 'COMPLETED');

-- CreateEnum
CREATE TYPE "VerifiedStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ReviewerRole" AS ENUM ('KAPRODI', 'LPPM', 'LPM', 'DEKAN');

-- CreateEnum
CREATE TYPE "ReviewType" AS ENUM ('VERIFICATION', 'APPROVAL', 'AUDIT', 'INTERVENTION');

-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('OPEN', 'COMPLETED');

-- CreateEnum
CREATE TYPE "ReviewDecision" AS ENUM ('APPROVED', 'NEED_REVISION', 'REJECTED', 'MONITORING');

-- CreateEnum
CREATE TYPE "EvidenceEntityType" AS ENUM ('TEACHING_ACTIVITY', 'RESEARCH_OUTPUT', 'SERVICE_PROGRAM', 'SERVICE_IMPACT', 'OTHER');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'VERIFY', 'APPROVE');

-- CreateTable
CREATE TABLE "Institution" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Institution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Faculty" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Faculty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudyProgram" (
    "id" TEXT NOT NULL,
    "facultyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudyProgram_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL,
    "name" "RoleName" NOT NULL,
    "description" TEXT,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserRole" (
    "userId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,

    CONSTRAINT "UserRole_pkey" PRIMARY KEY ("userId","roleId")
);

-- CreateTable
CREATE TABLE "Lecturer" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "studyProgramId" TEXT NOT NULL,
    "nidn" TEXT NOT NULL,
    "academicRank" TEXT,
    "expertiseFocus" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lecturer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AcademicYear" (
    "id" TEXT NOT NULL,
    "yearStart" INTEGER NOT NULL,
    "yearEnd" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AcademicYear_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AcademicPeriod" (
    "id" TEXT NOT NULL,
    "academicYearId" TEXT NOT NULL,
    "term" "Term" NOT NULL,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "bkdDeadline" TIMESTAMP(3),
    "researchDeadline" TIMESTAMP(3),
    "serviceDeadline" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AcademicPeriod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Course" (
    "id" TEXT NOT NULL,
    "studyProgramId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "credits" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourseOffering" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "academicPeriodId" TEXT NOT NULL,
    "className" TEXT NOT NULL,
    "lecturerId" TEXT NOT NULL,
    "coLecturerId" TEXT,
    "studentCount" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CourseOffering_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeachingActivity" (
    "id" TEXT NOT NULL,
    "courseOfferingId" TEXT NOT NULL,
    "rpsStatus" "RpsStatus" NOT NULL DEFAULT 'DRAFT',
    "lmsHealthScore" DECIMAL(4,3),
    "assessmentOntimeScore" DECIMAL(4,3),
    "progressScore" DECIMAL(4,3),
    "studentFeedbackScore" DECIMAL(3,2),
    "attendanceRate" DECIMAL(4,3),
    "updatedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeachingActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResearchProject" (
    "id" TEXT NOT NULL,
    "lecturerId" TEXT NOT NULL,
    "academicPeriodId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "theme" TEXT,
    "status" "ProjectStatus" NOT NULL DEFAULT 'PLANNED',
    "fundingSource" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResearchProject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResearchOutput" (
    "id" TEXT NOT NULL,
    "researchProjectId" TEXT NOT NULL,
    "type" "OutputType" NOT NULL,
    "title" TEXT NOT NULL,
    "targetIndex" "TargetIndex" NOT NULL DEFAULT 'NONE',
    "status" "OutputStatus" NOT NULL DEFAULT 'DRAFT',
    "doi" TEXT,
    "publishDate" TIMESTAMP(3),
    "citationCountYtd" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResearchOutput_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceProgram" (
    "id" TEXT NOT NULL,
    "lecturerId" TEXT NOT NULL,
    "academicPeriodId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "location" TEXT,
    "partner" TEXT,
    "beneficiariesCount" INTEGER,
    "status" "ProgramStatus" NOT NULL DEFAULT 'PLANNED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceProgram_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceImpact" (
    "id" TEXT NOT NULL,
    "serviceProgramId" TEXT NOT NULL,
    "impactScore" DECIMAL(4,3),
    "baselineValue" DECIMAL(12,3),
    "endlineValue" DECIMAL(12,3),
    "outcomeSummary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceImpact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvidenceType" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "requiredForBkd" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "EvidenceType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Evidence" (
    "id" TEXT NOT NULL,
    "lecturerId" TEXT NOT NULL,
    "academicPeriodId" TEXT NOT NULL,
    "evidenceTypeId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "fileUrl" TEXT,
    "mimeType" TEXT,
    "issuedAt" TIMESTAMP(3),
    "verifiedStatus" "VerifiedStatus" NOT NULL DEFAULT 'DRAFT',
    "uploadedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Evidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvidenceLink" (
    "id" TEXT NOT NULL,
    "evidenceId" TEXT NOT NULL,
    "entityType" "EvidenceEntityType" NOT NULL,
    "entityId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EvidenceLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "academicPeriodId" TEXT NOT NULL,
    "lecturerId" TEXT NOT NULL,
    "reviewerUserId" TEXT NOT NULL,
    "reviewerRole" "ReviewerRole" NOT NULL,
    "type" "ReviewType" NOT NULL,
    "status" "ReviewStatus" NOT NULL DEFAULT 'OPEN',
    "decision" "ReviewDecision",
    "summary" TEXT,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Note" (
    "id" TEXT NOT NULL,
    "academicPeriodId" TEXT NOT NULL,
    "lecturerId" TEXT NOT NULL,
    "role" "ReviewerRole" NOT NULL,
    "noteText" TEXT NOT NULL,
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Note_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KpiSnapshot" (
    "id" TEXT NOT NULL,
    "academicPeriodId" TEXT NOT NULL,
    "lecturerId" TEXT NOT NULL,
    "teachingScore" DECIMAL(4,3),
    "researchScore" DECIMAL(4,3),
    "serviceScore" DECIMAL(4,3),
    "supportScore" DECIMAL(4,3),
    "tridharmaIndex" DECIMAL(4,3),
    "evidenceScore" DECIMAL(4,3),
    "bkdComplianceScore" DECIMAL(4,3),
    "riskScore" INTEGER NOT NULL DEFAULT 0,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "calculatedByUserId" TEXT,

    CONSTRAINT "KpiSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" "AuditAction" NOT NULL,
    "before" JSONB,
    "after" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Institution_code_key" ON "Institution"("code");

-- CreateIndex
CREATE INDEX "Faculty_institutionId_idx" ON "Faculty"("institutionId");

-- CreateIndex
CREATE UNIQUE INDEX "Faculty_institutionId_code_key" ON "Faculty"("institutionId", "code");

-- CreateIndex
CREATE INDEX "StudyProgram_facultyId_idx" ON "StudyProgram"("facultyId");

-- CreateIndex
CREATE UNIQUE INDEX "StudyProgram_facultyId_code_key" ON "StudyProgram"("facultyId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_institutionId_idx" ON "User"("institutionId");

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");

-- CreateIndex
CREATE INDEX "UserRole_roleId_idx" ON "UserRole"("roleId");

-- CreateIndex
CREATE UNIQUE INDEX "Lecturer_userId_key" ON "Lecturer"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Lecturer_nidn_key" ON "Lecturer"("nidn");

-- CreateIndex
CREATE INDEX "Lecturer_studyProgramId_idx" ON "Lecturer"("studyProgramId");

-- CreateIndex
CREATE UNIQUE INDEX "AcademicYear_yearStart_yearEnd_key" ON "AcademicYear"("yearStart", "yearEnd");

-- CreateIndex
CREATE INDEX "AcademicPeriod_academicYearId_idx" ON "AcademicPeriod"("academicYearId");

-- CreateIndex
CREATE UNIQUE INDEX "AcademicPeriod_academicYearId_term_key" ON "AcademicPeriod"("academicYearId", "term");

-- CreateIndex
CREATE INDEX "Course_studyProgramId_idx" ON "Course"("studyProgramId");

-- CreateIndex
CREATE UNIQUE INDEX "Course_studyProgramId_code_key" ON "Course"("studyProgramId", "code");

-- CreateIndex
CREATE INDEX "CourseOffering_academicPeriodId_idx" ON "CourseOffering"("academicPeriodId");

-- CreateIndex
CREATE INDEX "CourseOffering_lecturerId_idx" ON "CourseOffering"("lecturerId");

-- CreateIndex
CREATE INDEX "CourseOffering_coLecturerId_idx" ON "CourseOffering"("coLecturerId");

-- CreateIndex
CREATE UNIQUE INDEX "CourseOffering_courseId_academicPeriodId_className_lecturer_key" ON "CourseOffering"("courseId", "academicPeriodId", "className", "lecturerId");

-- CreateIndex
CREATE UNIQUE INDEX "TeachingActivity_courseOfferingId_key" ON "TeachingActivity"("courseOfferingId");

-- CreateIndex
CREATE INDEX "ResearchProject_lecturerId_idx" ON "ResearchProject"("lecturerId");

-- CreateIndex
CREATE INDEX "ResearchProject_academicPeriodId_idx" ON "ResearchProject"("academicPeriodId");

-- CreateIndex
CREATE INDEX "ResearchOutput_researchProjectId_idx" ON "ResearchOutput"("researchProjectId");

-- CreateIndex
CREATE INDEX "ServiceProgram_lecturerId_idx" ON "ServiceProgram"("lecturerId");

-- CreateIndex
CREATE INDEX "ServiceProgram_academicPeriodId_idx" ON "ServiceProgram"("academicPeriodId");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceImpact_serviceProgramId_key" ON "ServiceImpact"("serviceProgramId");

-- CreateIndex
CREATE UNIQUE INDEX "EvidenceType_code_key" ON "EvidenceType"("code");

-- CreateIndex
CREATE INDEX "Evidence_lecturerId_academicPeriodId_idx" ON "Evidence"("lecturerId", "academicPeriodId");

-- CreateIndex
CREATE INDEX "Evidence_evidenceTypeId_idx" ON "Evidence"("evidenceTypeId");

-- CreateIndex
CREATE INDEX "EvidenceLink_entityType_entityId_idx" ON "EvidenceLink"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "EvidenceLink_evidenceId_idx" ON "EvidenceLink"("evidenceId");

-- CreateIndex
CREATE INDEX "Review_academicPeriodId_idx" ON "Review"("academicPeriodId");

-- CreateIndex
CREATE INDEX "Review_lecturerId_idx" ON "Review"("lecturerId");

-- CreateIndex
CREATE INDEX "Review_reviewerUserId_idx" ON "Review"("reviewerUserId");

-- CreateIndex
CREATE INDEX "Note_academicPeriodId_lecturerId_idx" ON "Note"("academicPeriodId", "lecturerId");

-- CreateIndex
CREATE INDEX "KpiSnapshot_academicPeriodId_lecturerId_idx" ON "KpiSnapshot"("academicPeriodId", "lecturerId");

-- CreateIndex
CREATE INDEX "AuditLog_actorUserId_idx" ON "AuditLog"("actorUserId");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- AddForeignKey
ALTER TABLE "Faculty" ADD CONSTRAINT "Faculty_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudyProgram" ADD CONSTRAINT "StudyProgram_facultyId_fkey" FOREIGN KEY ("facultyId") REFERENCES "Faculty"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lecturer" ADD CONSTRAINT "Lecturer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lecturer" ADD CONSTRAINT "Lecturer_studyProgramId_fkey" FOREIGN KEY ("studyProgramId") REFERENCES "StudyProgram"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AcademicPeriod" ADD CONSTRAINT "AcademicPeriod_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Course" ADD CONSTRAINT "Course_studyProgramId_fkey" FOREIGN KEY ("studyProgramId") REFERENCES "StudyProgram"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseOffering" ADD CONSTRAINT "CourseOffering_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseOffering" ADD CONSTRAINT "CourseOffering_academicPeriodId_fkey" FOREIGN KEY ("academicPeriodId") REFERENCES "AcademicPeriod"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseOffering" ADD CONSTRAINT "CourseOffering_lecturerId_fkey" FOREIGN KEY ("lecturerId") REFERENCES "Lecturer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseOffering" ADD CONSTRAINT "CourseOffering_coLecturerId_fkey" FOREIGN KEY ("coLecturerId") REFERENCES "Lecturer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeachingActivity" ADD CONSTRAINT "TeachingActivity_courseOfferingId_fkey" FOREIGN KEY ("courseOfferingId") REFERENCES "CourseOffering"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeachingActivity" ADD CONSTRAINT "TeachingActivity_updatedByUserId_fkey" FOREIGN KEY ("updatedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResearchProject" ADD CONSTRAINT "ResearchProject_lecturerId_fkey" FOREIGN KEY ("lecturerId") REFERENCES "Lecturer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResearchProject" ADD CONSTRAINT "ResearchProject_academicPeriodId_fkey" FOREIGN KEY ("academicPeriodId") REFERENCES "AcademicPeriod"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResearchOutput" ADD CONSTRAINT "ResearchOutput_researchProjectId_fkey" FOREIGN KEY ("researchProjectId") REFERENCES "ResearchProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceProgram" ADD CONSTRAINT "ServiceProgram_lecturerId_fkey" FOREIGN KEY ("lecturerId") REFERENCES "Lecturer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceProgram" ADD CONSTRAINT "ServiceProgram_academicPeriodId_fkey" FOREIGN KEY ("academicPeriodId") REFERENCES "AcademicPeriod"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceImpact" ADD CONSTRAINT "ServiceImpact_serviceProgramId_fkey" FOREIGN KEY ("serviceProgramId") REFERENCES "ServiceProgram"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evidence" ADD CONSTRAINT "Evidence_lecturerId_fkey" FOREIGN KEY ("lecturerId") REFERENCES "Lecturer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evidence" ADD CONSTRAINT "Evidence_academicPeriodId_fkey" FOREIGN KEY ("academicPeriodId") REFERENCES "AcademicPeriod"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evidence" ADD CONSTRAINT "Evidence_evidenceTypeId_fkey" FOREIGN KEY ("evidenceTypeId") REFERENCES "EvidenceType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evidence" ADD CONSTRAINT "Evidence_uploadedByUserId_fkey" FOREIGN KEY ("uploadedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvidenceLink" ADD CONSTRAINT "EvidenceLink_evidenceId_fkey" FOREIGN KEY ("evidenceId") REFERENCES "Evidence"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_academicPeriodId_fkey" FOREIGN KEY ("academicPeriodId") REFERENCES "AcademicPeriod"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_lecturerId_fkey" FOREIGN KEY ("lecturerId") REFERENCES "Lecturer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_reviewerUserId_fkey" FOREIGN KEY ("reviewerUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_academicPeriodId_fkey" FOREIGN KEY ("academicPeriodId") REFERENCES "AcademicPeriod"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_lecturerId_fkey" FOREIGN KEY ("lecturerId") REFERENCES "Lecturer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KpiSnapshot" ADD CONSTRAINT "KpiSnapshot_academicPeriodId_fkey" FOREIGN KEY ("academicPeriodId") REFERENCES "AcademicPeriod"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KpiSnapshot" ADD CONSTRAINT "KpiSnapshot_lecturerId_fkey" FOREIGN KEY ("lecturerId") REFERENCES "Lecturer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KpiSnapshot" ADD CONSTRAINT "KpiSnapshot_calculatedByUserId_fkey" FOREIGN KEY ("calculatedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
