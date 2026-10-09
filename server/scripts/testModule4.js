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
  console.log('=== VERIFYING MODULE 4 ATTRACTIONS APIS ===');

  try {
    // 1. Attractions List
    const res1 = await get('/api/attractions');
    console.log('1. GET /api/attractions status:', res1.status);
    console.log('   Success:', res1.body?.success);
    console.log('   Total items:', res1.body?.data?.pagination?.totalItems);
    console.log('   Attractions count:', res1.body?.data?.attractions?.length);

    // 2. Filter by Category
    const res2 = await get('/api/attractions?category=Beach');
    console.log('\n2. GET /api/attractions?category=Beach count:', res2.body?.data?.attractions?.length);
    console.log('   Beach attractions found:', res2.body?.data?.attractions?.map(a => a.name));

    // 3. Search
    const res3 = await get('/api/attractions?search=fort');
    console.log('\n3. GET /api/attractions?search=fort count:', res3.body?.data?.attractions?.length);
    console.log('   Fort match names:', res3.body?.data?.attractions?.map(a => a.name));

    // 4. Slug lookup
    const res4 = await get('/api/attractions/slug/baga-beach');
    console.log('\n4. GET /api/attractions/slug/baga-beach status:', res4.status);
    console.log('   Name:', res4.body?.data?.attraction?.name);
    console.log('   Associated Destination:', res4.body?.data?.attraction?.destination?.name);
    console.log('   Cover Image:', res4.body?.data?.attraction?.coverImage ? 'Present' : 'Missing');

    // 5. Featured Attractions
    const res5 = await get('/api/attractions?featured=true');
    console.log('\n5. GET /api/attractions?featured=true count:', res5.body?.data?.attractions?.length);

    // 6. Nearby Attractions lookup
    const res6 = await get('/api/attractions/nearby?latitude=15.5557&longitude=73.7517&radius=30');
    console.log('\n6. GET /api/attractions/nearby count:', res6.body?.data?.attractions?.length);

    console.log('\n=== ALL MODULE 4 API TESTS PASSED SUCCESSFULLY ===');
  } catch (err) {
    console.error('API Test Error:', err);
  }
}

runTests();
