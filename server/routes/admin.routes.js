const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const { authorizeRoles } = require('../middleware/role.middleware');
const adminController = require('../controllers/admin.controller');

// User report submission (authenticated users can report content)
router.post('/reports/submit', authenticate, adminController.submitReport);

// All subsequent routes require ADMIN privileges
router.use(authenticate, authorizeRoles('ADMIN', 'admin'));

// 1. Dashboard & Provider Status
router.get('/stats', adminController.getAdminStats);
router.get('/providers', adminController.getProviderStatus);

// 2. User Management
router.get('/users', adminController.getUsers);
router.patch('/users/:userId/role', adminController.updateUserRole);
router.patch('/users/:userId/status', adminController.toggleUserStatus);
router.delete('/users/:userId', adminController.deleteUser);

// 3. Travel Collections Management
router.get('/collections', adminController.getTravelCollections);
router.post('/collections', adminController.createTravelCollection);
router.put('/collections/:id', adminController.updateTravelCollection);
router.delete('/collections/:id', adminController.deleteTravelCollection);

// 4. Reported Content Management
router.get('/reports', adminController.getReports);
router.patch('/reports/:id', adminController.updateReportStatus);

// 5. System Configuration
router.get('/config', adminController.getSystemConfig);
router.put('/config', adminController.updateSystemConfig);

module.exports = router;
