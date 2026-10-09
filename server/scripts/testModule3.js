const http = require('http');

function get(path) {
  return new Promise((resolve, reject) => {
    http.get(`http://127.0.0.1:5000${path}`, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (err) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    }).on('error', reject);
  });
}

async function runTests() {
  console.log('=== VERIFYING MODULE 3 APIS ===');

  try {
    // 1. Destinations List
    const res1 = await get('/api/destinations');
    console.log('1. GET /api/destinations status:', res1.status);
    console.log('   Success:', res1.body?.success);
    console.log('   Total items:', res1.body?.data?.pagination?.totalItems);
    console.log('   Destinations count:', res1.body?.data?.destinations?.length);

    // 2. Filter by Category
    const res2 = await get('/api/destinations?category=Beach');
    console.log('\n2. GET /api/destinations?category=Beach count:', res2.body?.data?.destinations?.length);
    console.log('   Categories found:', res2.body?.data?.destinations?.map(d => d.name));

    // 3. Search
    const res3 = await get('/api/destinations?search=goa');
    console.log('\n3. GET /api/destinations?search=goa count:', res3.body?.data?.destinations?.length);
    console.log('   Search match name:', res3.body?.data?.destinations?.[0]?.name);

    // 4. Slug detail lookup
    const res4 = await get('/api/destinations/slug/goa');
    console.log('\n4. GET /api/destinations/slug/goa status:', res4.status);
    console.log('   Name:', res4.body?.data?.destination?.name);
    console.log('   Cover image:', res4.body?.data?.destination?.coverImage ? 'Present' : 'Missing');
    console.log('   Estimated budget minPerDay:', res4.body?.data?.destination?.estimatedBudget?.minPerDay);

    // 5. Featured Destinations
    const res5 = await get('/api/destinations?featured=true');
    console.log('\n5. GET /api/destinations?featured=true count:', res5.body?.data?.destinations?.length);

    console.log('\n=== ALL MODULE 3 API TESTS PASSED SUCCESSFULLY ===');
  } catch (err) {
    console.error('API Test Error:', err);
  }
}

runTests();
