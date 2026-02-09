const express = require('express');
const router = express.Router();

// Import all routers
const authRouter = require('./auth/router');
const institutionRouter = require('./institution/router');
const facultyRouter = require('./faculty/router');
const studyProgramRouter = require('./study-program/router');
const userRouter = require('./user/router');
const roleRouter = require('./role/router');
const lecturerRouter = require('./lecturer/router');
const academicYearRouter = require('./academic-year/router');
const academicPeriodRouter = require('./academic-period/router');
const courseRouter = require('./course/router');
const courseOfferingRouter = require('./course-offering/router');
const teachingActivityRouter = require('./teaching-activity/router');
const researchProjectRouter = require('./research-project/router');
const researchOutputRouter = require('./research-output/router');
const serviceProgramRouter = require('./service-program/router');
const serviceImpactRouter = require('./service-impact/router');
const evidenceTypeRouter = require('./evidence-type/router');
const evidenceRouter = require('./evidence/router');
const reviewRouter = require('./review/router');
const noteRouter = require('./note/router');
const kpiSnapshotRouter = require('./kpi-snapshot/router');
const auditLogRouter = require('./audit-log/router');

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
  });
});

// Mount routers
router.use('/auth', authRouter);
router.use('/institutions', institutionRouter);
router.use('/faculties', facultyRouter);
router.use('/study-programs', studyProgramRouter);
router.use('/users', userRouter);
router.use('/roles', roleRouter);
router.use('/lecturers', lecturerRouter);
router.use('/academic-years', academicYearRouter);
router.use('/academic-periods', academicPeriodRouter);
router.use('/courses', courseRouter);
router.use('/course-offerings', courseOfferingRouter);
router.use('/teaching-activities', teachingActivityRouter);
router.use('/research-projects', researchProjectRouter);
router.use('/research-outputs', researchOutputRouter);
router.use('/service-programs', serviceProgramRouter);
router.use('/service-impacts', serviceImpactRouter);
router.use('/evidence-types', evidenceTypeRouter);
router.use('/evidences', evidenceRouter);
router.use('/reviews', reviewRouter);
router.use('/notes', noteRouter);
router.use('/kpi-snapshots', kpiSnapshotRouter);
router.use('/audit-logs', auditLogRouter);

// 404 handler for API routes
router.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
  });
});

module.exports = router;
