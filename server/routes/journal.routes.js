const express = require('express');
const router = express.Router();
const journalController = require('../controllers/journal.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.use(authenticate);

// Journal CRUD
router.get('/', journalController.getUserJournals);
router.post('/', journalController.createJournal);
router.get('/analytics/overview', journalController.getTripAnalytics);
router.get('/personalization/profile', journalController.getPersonalizationProfile);

router.get('/:id', journalController.getJournalById);
router.put('/:id', journalController.updateJournal);
router.delete('/:id', journalController.deleteJournal);

module.exports = router;
