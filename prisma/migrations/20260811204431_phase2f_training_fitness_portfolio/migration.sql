-- CreateEnum
CREATE TYPE "GoalType" AS ENUM ('WEIGHT_LOSS', 'MUSCLE_GAIN', 'STRENGTH', 'ENDURANCE', 'BODY_RECOMPOSITION', 'FLEXIBILITY', 'GENERAL_FITNESS', 'CUSTOM');

-- CreateEnum
CREATE TYPE "GoalStatus" AS ENUM ('ACTIVE', 'ACHIEVED', 'PAUSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ExerciseOwnership" AS ENUM ('GLOBAL', 'BRANCH');

-- CreateEnum
CREATE TYPE "WorkoutPlanStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ExerciseType" AS ENUM ('STRENGTH', 'REPETITION', 'DURATION', 'DISTANCE', 'BODYWEIGHT', 'CUSTOM');

-- CreateEnum
CREATE TYPE "WorkoutSessionStatus" AS ENUM ('STARTED', 'COMPLETED', 'ABANDONED');

-- CreateEnum
CREATE TYPE "PhotoType" AS ENUM ('FRONT', 'BACK', 'LEFT', 'RIGHT', 'OTHER');

-- CreateEnum
CREATE TYPE "VisibilityLevel" AS ENUM ('PRIVATE', 'TRAINER_ONLY', 'MEMBER_ONLY', 'PORTFOLIO');

-- CreateTable
CREATE TABLE "FitnessGoal" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "goalType" "GoalType" NOT NULL DEFAULT 'GENERAL_FITNESS',
    "targetValue" DECIMAL(65,30),
    "targetUnit" TEXT,
    "targetDate" TIMESTAMP(3),
    "status" "GoalStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "FitnessGoal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Exercise" (
    "id" TEXT NOT NULL,
    "ownershipType" "ExerciseOwnership" NOT NULL DEFAULT 'GLOBAL',
    "branchId" TEXT,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "muscleGroups" TEXT[],
    "equipment" TEXT[],
    "difficulty" TEXT,
    "instructions" TEXT,
    "videoUrl" TEXT,
    "imageUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Exercise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkoutPlan" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "trainerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "goal" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "status" "WorkoutPlanStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkoutPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkoutDay" (
    "id" TEXT NOT NULL,
    "workoutPlanId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "dayNumber" INTEGER NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkoutDay_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkoutExercise" (
    "id" TEXT NOT NULL,
    "workoutDayId" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL,
    "exerciseType" "ExerciseType" NOT NULL DEFAULT 'STRENGTH',
    "sets" INTEGER,
    "reps" INTEGER,
    "targetWeight" DECIMAL(65,30),
    "targetDurationSeconds" INTEGER,
    "restSeconds" INTEGER,
    "tempo" TEXT,
    "notes" TEXT,

    CONSTRAINT "WorkoutExercise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkoutSession" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "workoutPlanId" TEXT,
    "workoutDayId" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "status" "WorkoutSessionStatus" NOT NULL DEFAULT 'STARTED',
    "trainerNotes" TEXT,
    "memberNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkoutSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkoutSessionExercise" (
    "id" TEXT NOT NULL,
    "workoutSessionId" TEXT NOT NULL,
    "sourceWorkoutExerciseId" TEXT,
    "exerciseId" TEXT,
    "exerciseNameSnapshot" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL,
    "exerciseTypeSnapshot" "ExerciseType" NOT NULL DEFAULT 'STRENGTH',
    "targetSetsSnapshot" INTEGER,
    "targetRepsSnapshot" INTEGER,
    "targetWeightSnapshot" DECIMAL(65,30),
    "targetDurationSnapshot" INTEGER,
    "restSecondsSnapshot" INTEGER,
    "tempoSnapshot" TEXT,
    "notesSnapshot" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkoutSessionExercise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkoutSet" (
    "id" TEXT NOT NULL,
    "workoutSessionExerciseId" TEXT NOT NULL,
    "setNumber" INTEGER NOT NULL,
    "repsCompleted" INTEGER,
    "weightUsed" DECIMAL(65,30),
    "durationSeconds" INTEGER,
    "distance" DECIMAL(65,30),
    "rpe" INTEGER,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkoutSet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Measurement" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "recordedBy" TEXT,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "weight" DECIMAL(65,30),
    "weightUnit" TEXT NOT NULL DEFAULT 'KG',
    "bodyFatPercentage" DECIMAL(65,30),
    "bmi" DECIMAL(65,30),
    "chest" DECIMAL(65,30),
    "waist" DECIMAL(65,30),
    "hips" DECIMAL(65,30),
    "leftArm" DECIMAL(65,30),
    "rightArm" DECIMAL(65,30),
    "leftThigh" DECIMAL(65,30),
    "rightThigh" DECIMAL(65,30),
    "lengthUnit" TEXT NOT NULL DEFAULT 'CM',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Measurement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProgressPhoto" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "uploadedBy" TEXT NOT NULL,
    "photoUrl" TEXT,
    "storageKey" TEXT NOT NULL,
    "photoType" "PhotoType" NOT NULL DEFAULT 'FRONT',
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "visibility" "VisibilityLevel" NOT NULL DEFAULT 'PRIVATE',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProgressPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Portfolio" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "headline" TEXT,
    "bio" TEXT,
    "customUrlAlias" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Portfolio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PortfolioContent" (
    "id" TEXT NOT NULL,
    "portfolioId" TEXT NOT NULL,
    "progressPhotoId" TEXT,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PortfolioContent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FitnessGoal_memberId_status_idx" ON "FitnessGoal"("memberId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Exercise_slug_key" ON "Exercise"("slug");

-- CreateIndex
CREATE INDEX "Exercise_branchId_idx" ON "Exercise"("branchId");

-- CreateIndex
CREATE INDEX "WorkoutPlan_memberId_status_idx" ON "WorkoutPlan"("memberId", "status");

-- CreateIndex
CREATE INDEX "WorkoutPlan_trainerId_status_idx" ON "WorkoutPlan"("trainerId", "status");

-- CreateIndex
CREATE INDEX "WorkoutDay_workoutPlanId_idx" ON "WorkoutDay"("workoutPlanId");

-- CreateIndex
CREATE INDEX "WorkoutExercise_workoutDayId_orderIndex_idx" ON "WorkoutExercise"("workoutDayId", "orderIndex");

-- CreateIndex
CREATE INDEX "WorkoutSession_memberId_startedAt_idx" ON "WorkoutSession"("memberId", "startedAt");

-- CreateIndex
CREATE INDEX "WorkoutSession_workoutPlanId_startedAt_idx" ON "WorkoutSession"("workoutPlanId", "startedAt");

-- CreateIndex
CREATE INDEX "WorkoutSessionExercise_workoutSessionId_orderIndex_idx" ON "WorkoutSessionExercise"("workoutSessionId", "orderIndex");

-- CreateIndex
CREATE INDEX "WorkoutSet_workoutSessionExerciseId_setNumber_idx" ON "WorkoutSet"("workoutSessionExerciseId", "setNumber");

-- CreateIndex
CREATE INDEX "Measurement_memberId_recordedAt_idx" ON "Measurement"("memberId", "recordedAt");

-- CreateIndex
CREATE INDEX "ProgressPhoto_memberId_capturedAt_idx" ON "ProgressPhoto"("memberId", "capturedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Portfolio_memberId_key" ON "Portfolio"("memberId");

-- CreateIndex
CREATE UNIQUE INDEX "Portfolio_customUrlAlias_key" ON "Portfolio"("customUrlAlias");

-- CreateIndex
CREATE INDEX "Portfolio_memberId_idx" ON "Portfolio"("memberId");

-- CreateIndex
CREATE INDEX "PortfolioContent_portfolioId_idx" ON "PortfolioContent"("portfolioId");

-- AddForeignKey
ALTER TABLE "FitnessGoal" ADD CONSTRAINT "FitnessGoal_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "MemberProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exercise" ADD CONSTRAINT "Exercise_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkoutPlan" ADD CONSTRAINT "WorkoutPlan_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "MemberProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkoutPlan" ADD CONSTRAINT "WorkoutPlan_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "TrainerProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkoutDay" ADD CONSTRAINT "WorkoutDay_workoutPlanId_fkey" FOREIGN KEY ("workoutPlanId") REFERENCES "WorkoutPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkoutExercise" ADD CONSTRAINT "WorkoutExercise_workoutDayId_fkey" FOREIGN KEY ("workoutDayId") REFERENCES "WorkoutDay"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkoutSession" ADD CONSTRAINT "WorkoutSession_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "MemberProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkoutSession" ADD CONSTRAINT "WorkoutSession_workoutPlanId_fkey" FOREIGN KEY ("workoutPlanId") REFERENCES "WorkoutPlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkoutSessionExercise" ADD CONSTRAINT "WorkoutSessionExercise_workoutSessionId_fkey" FOREIGN KEY ("workoutSessionId") REFERENCES "WorkoutSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkoutSet" ADD CONSTRAINT "WorkoutSet_workoutSessionExerciseId_fkey" FOREIGN KEY ("workoutSessionExerciseId") REFERENCES "WorkoutSessionExercise"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Measurement" ADD CONSTRAINT "Measurement_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "MemberProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgressPhoto" ADD CONSTRAINT "ProgressPhoto_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "MemberProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Portfolio" ADD CONSTRAINT "Portfolio_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "MemberProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PortfolioContent" ADD CONSTRAINT "PortfolioContent_portfolioId_fkey" FOREIGN KEY ("portfolioId") REFERENCES "Portfolio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PortfolioContent" ADD CONSTRAINT "PortfolioContent_progressPhotoId_fkey" FOREIGN KEY ("progressPhotoId") REFERENCES "ProgressPhoto"("id") ON DELETE CASCADE ON UPDATE CASCADE;
