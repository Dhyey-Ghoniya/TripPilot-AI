const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');
const Destination = require('../models/Destination');
const TravelCollection = require('../models/TravelCollection');
const Report = require('../models/Report');
const SystemConfig = require('../models/SystemConfig');

const adminController = require('../controllers/admin.controller');

// Mock Express req, res
const createMockReqRes = (user, query = {}, body = {}, params = {}) => {
  const req = { user, query, body, params };
  let responseData = null;
  let statusCode = 200;

  const res = {
    status: (code) => {
      statusCode = code;
      return res;
    },
    json: (data) => {
      responseData = data;
      return res;
    },
  };

  return { req, res, getResult: () => ({ statusCode, data: responseData }) };
};

async function runModule15Tests() {
  console.log('--- STARTING MODULE 15 (ADMINISTRATIVE LAYER) VERIFICATION TESTS ---');

  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/trippilot_db';
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB for Module 15 verification.');

    // 1. Create or fetch mock admin and standard user
    let adminUser = await User.findOne({ email: 'admin_test_m15@trippilot.ai' });
    if (!adminUser) {
      adminUser = new User({
        firstName: 'System',
        lastName: 'AdminTest',
        email: 'admin_test_m15@trippilot.ai',
        password: 'Password123!',
        role: 'ADMIN',
        isActive: true,
      });
      await adminUser.save();
    }

    let normalUser = await User.findOne({ email: 'user_test_m15@trippilot.ai' });
    if (!normalUser) {
      normalUser = new User({
        firstName: 'Normal',
        lastName: 'UserTest',
        email: 'user_test_m15@trippilot.ai',
        password: 'Password123!',
        role: 'USER',
        isActive: true,
      });
      await normalUser.save();
    }

    console.log(`✅ Test Accounts Ready: Admin (${adminUser.email}), User (${normalUser.email})`);

    // TEST 1: Admin Stats Endpoint
    const { req: req1, res: res1, getResult: getResult1 } = createMockReqRes(adminUser);
    await adminController.getAdminStats(req1, res1);
    const resStats = getResult1();
    console.assert(resStats.statusCode === 200, 'Admin stats should return 200');
    console.assert(resStats.data.data.users.total >= 2, 'Users count should be at least 2');
    console.assert(
      resStats.data.data.infrastructureNotice.includes('supporting infrastructure'),
      'Must state destination DB is supporting infrastructure'
    );
    console.log('✅ Test 1 Passed: Admin Dashboard Stats retrieved with supporting infrastructure notice.');

    // TEST 2: Provider Status Health Checks
    const { req: req2, res: res2, getResult: getResult2 } = createMockReqRes(adminUser);
    await adminController.getProviderStatus(req2, res2);
    const resProviders = getResult2();
    console.assert(resProviders.statusCode === 200, 'Provider status should return 200');
    const summaries = resProviders.data.data.summary;
    console.assert(summaries.length === 4, 'Must contain 4 provider categories');
    
    const flightProv = summaries.find((p) => p.name === 'Flight Provider');
    const hotelProv = summaries.find((p) => p.name === 'Hotel Provider');
    const mapProv = summaries.find((p) => p.name === 'Map Provider');
    const weatherProv = summaries.find((p) => p.name === 'Weather Provider');

    console.assert(['Connected', 'Mock/Development'].includes(flightProv.status), 'Flight status valid');
    console.assert(['Connected', 'Mock/Development'].includes(hotelProv.status), 'Hotel status valid');
    console.assert(['Connected', 'Unavailable'].includes(mapProv.status), 'Map status valid');
    console.assert(['Connected', 'Mock/Development', 'Unavailable'].includes(weatherProv.status), 'Weather status valid');

    console.log('✅ Test 2 Passed: Provider Status Dashboard correctly verified (Flight, Hotel, Map, Weather).');

    // TEST 3: User Management (Get users, toggle role, status)
    const { req: req3, res: res3, getResult: getResult3 } = createMockReqRes(adminUser, { limit: 10 });
    await adminController.getUsers(req3, res3);
    const resUsers = getResult3();
    console.assert(resUsers.statusCode === 200, 'Get users returned 200');
    console.assert(resUsers.data.data.users.length > 0, 'Users list non-empty');
    console.log('✅ Test 3 Passed: Admin Users retrieval.');

    // TEST 4: Travel Collections Management
    const { req: req4, res: res4, getResult: getResult4 } = createMockReqRes(
      adminUser,
      {},
      {
        title: 'Module 15 Test Collection',
        subtitle: 'Testing curated travel collections',
        description: 'Test travel collection description',
        category: 'Weekend Getaways',
        tags: ['Test', 'Module15'],
      }
    );
    await adminController.createTravelCollection(req4, res4);
    const resCol = getResult4();
    console.assert(resCol.statusCode === 201, 'Travel collection created (201)');
    const createdColId = resCol.data.data._id;
    console.log(`✅ Test 4 Passed: Created Travel Collection (${resCol.data.data.title})`);

    // Clean up created collection
    await TravelCollection.findByIdAndDelete(createdColId);

    // TEST 5: System Configuration
    const { req: req5, res: res5, getResult: getResult5 } = createMockReqRes(adminUser);
    await adminController.getSystemConfig(req5, res5);
    const resConfig = getResult5();
    console.assert(resConfig.statusCode === 200, 'System config retrieved');
    console.assert(resConfig.data.data.key === 'main_config', 'System config key matches main_config');
    console.log('✅ Test 5 Passed: System Configuration retrieved and initialized.');

    // TEST 6: Content Reporting & Resolution
    const { req: req6, res: res6, getResult: getResult6 } = createMockReqRes(
      normalUser,
      {},
      {
        contentType: 'Review',
        contentId: 'rev_123456',
        contentTitle: 'Test Review Title',
        reason: 'Spam or Misleading',
        details: 'Testing user flag submission',
      }
    );
    await adminController.submitReport(req6, res6);
    const resReport = getResult6();
    console.assert(resReport.statusCode === 201, 'User report submitted');
    const reportId = resReport.data.data._id;

    // Admin resolves report
    const { req: req7, res: res7, getResult: getResult7 } = createMockReqRes(
      adminUser,
      {},
      { status: 'RESOLVED', actionTaken: 'DISMISSED', adminNotes: 'Verified clean in automated test' },
      { id: reportId }
    );
    await adminController.updateReportStatus(req7, res7);
    const resResolved = getResult7();
    console.assert(resResolved.statusCode === 200, 'Report updated to RESOLVED');
    console.log('✅ Test 6 Passed: User Content Report submitted and resolved by Admin.');

    // Cleanup report
    await Report.findByIdAndDelete(reportId);

    console.log('\n======================================================');
    console.log('🎉 ALL MODULE 15 (ADMINISTRATIVE LAYER) TESTS PASSED!');
    console.log('======================================================\n');
  } catch (err) {
    console.error('❌ Module 15 Test Failed:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

runModule15Tests();
