const mongoose = require('mongoose');
const { loadEnvConfig } = require('@next/env');

const projectDir = process.cwd();
loadEnvConfig(projectDir);

// Must define barebones schema since we bypass mongoose validations for raw updates
const warehouseSchema = new mongoose.Schema({}, { strict: false });
const Warehouse = mongoose.models.Warehouse || mongoose.model('Warehouse', warehouseSchema);

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');

    const result = await Warehouse.collection.updateMany(
      {},
      { 
        $set: { 
          status: 'Active',
          code: 'GEN-' + Math.floor(Math.random() * 10000), // temp fallback
          geofenceRadiusKM: 50,
          capabilities: ['Standard']
        },
        $unset: { isActive: "" }
      }
    );

    console.log(`Updated ${result.modifiedCount} legacy warehouses.`);
    
    // Now loop through to give them proper unique codes if they clash
    const warehouses = await Warehouse.find({});
    for (let i = 0; i < warehouses.length; i++) {
      const w = warehouses[i];
      let codeStr = w.name ? w.name.substring(0, 3).toUpperCase() + '-' + String(i + 1).padStart(2, '0') : 'WH-' + i;
      // also if manager exists move to managerId
      let updateSet = { code: codeStr };
      if (w.manager && !w.managerId) {
        updateSet.managerId = w.manager;
      }
      
      let updateUnset = { isActive: "" };
      if (w.manager) {
        updateUnset.manager = "";
      }
      
      await Warehouse.collection.updateOne({ _id: w._id }, { $set: updateSet, $unset: updateUnset });
    }
    
    console.log('Codes assigned and managers migrated.');
  } catch (err) {
    console.error('Migration error:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected');
  }
}

run();
