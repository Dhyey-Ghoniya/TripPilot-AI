require('dotenv').config({ path: './.env' });
const mongoose = require('mongoose');

const LOCAL_URI = process.env.LOCAL_MONGODB_URI || 'mongodb://localhost:27017/trippilot';
const ATLAS_URI = process.env.MONGODB_URI;

async function migrate() {
  if (!ATLAS_URI) throw new Error('Set MONGODB_URI in the environment before migrating.');
  console.log('--- Starting Migration from Localhost to MongoDB Atlas ---');
  console.log(`Source: ${LOCAL_URI}`);
  console.log(`Target: ${ATLAS_URI.replace(/:[^:]*@/, ':****@')}`);

  let localConn, atlasConn;
  try {
    console.log('\n[1/4] Connecting to databases...');
    localConn = await mongoose.createConnection(LOCAL_URI, { serverSelectionTimeoutMS: 5000 }).asPromise();
    console.log('✓ Connected to Local MongoDB');

    atlasConn = await mongoose.createConnection(ATLAS_URI, { serverSelectionTimeoutMS: 10000 }).asPromise();
    console.log('✓ Connected to MongoDB Atlas');

    const localDb = localConn.db;
    const atlasDb = atlasConn.db;

    console.log('\n[2/4] Fetching collection list from Local MongoDB...');
    const collections = await localDb.listCollections().toArray();
    console.log(`Found ${collections.length} collection(s) to process.`);

    const report = [];

    console.log('\n[3/4] Migrating data and indexes...');
    for (const colInfo of collections) {
      const colName = colInfo.name;
      if (colName.startsWith('system.')) continue;

      const localCol = localDb.collection(colName);
      const atlasCol = atlasDb.collection(colName);

      const localCount = await localCol.countDocuments();

      // Check existing documents in Atlas
      const atlasExistingCount = await atlasCol.countDocuments();
      if (atlasExistingCount > 0) {
        console.log(`  Cleaning existing ${atlasExistingCount} documents in Atlas collection "${colName}" for clean migration...`);
        await atlasCol.deleteMany({});
      }

      let insertedCount = 0;
      if (localCount > 0) {
        const batchSize = 500;
        const cursor = localCol.find({});
        let batch = [];

        while (await cursor.hasNext()) {
          const doc = await cursor.next();
          batch.push(doc);
          if (batch.length >= batchSize) {
            await atlasCol.insertMany(batch, { ordered: true });
            insertedCount += batch.length;
            batch = [];
          }
        }

        if (batch.length > 0) {
          await atlasCol.insertMany(batch, { ordered: true });
          insertedCount += batch.length;
        }
      }

      // Migrate indexes
      try {
        const indexes = await localCol.indexes();
        const nonIdIndexes = indexes.filter(idx => idx.name !== '_id_');
        if (nonIdIndexes.length > 0) {
          const indexSpecs = nonIdIndexes.map(idx => {
            const spec = { key: idx.key };
            if (idx.name) spec.name = idx.name;
            if (idx.unique) spec.unique = idx.unique;
            if (idx.sparse) spec.sparse = idx.sparse;
            if (idx.expireAfterSeconds !== undefined) spec.expireAfterSeconds = idx.expireAfterSeconds;
            return spec;
          });
          await atlasCol.createIndexes(indexSpecs);
        }
      } catch (indexErr) {
        console.warn(`  [Warning] Index migration for "${colName}": ${indexErr.message}`);
      }

      const atlasFinalCount = await atlasCol.countDocuments();
      report.push({
        collection: colName,
        local: localCount,
        atlas: atlasFinalCount,
        status: localCount === atlasFinalCount ? 'MATCH' : 'MISMATCH'
      });
      console.log(`  ✓ ${colName}: Migrated ${insertedCount}/${localCount} doc(s) -> Atlas count: ${atlasFinalCount}`);
    }

    console.log('\n[4/4] Verification Summary:');
    console.table(report);

    const allMatched = report.every(r => r.status === 'MATCH');
    if (allMatched) {
      console.log('\n✅ All collections successfully migrated and verified with 100% document parity!');
    } else {
      console.warn('\n⚠️ Some collections had mismatches. Please review the summary table.');
    }
  } catch (err) {
    console.error('\n❌ Migration failed:', err);
    process.exit(1);
  } finally {
    if (localConn) await localConn.close();
    if (atlasConn) await atlasConn.close();
    console.log('\nDatabase connections closed.');
  }
}

migrate();
