import { geoService } from '../services/geoService.js';
import mongoose from 'mongoose';

async function testGeoService() {
  console.log('--- Testing IP Detection ---');
  
  // Nepal IP
  const npIp = '103.1.92.0'; 
  const npCountry = geoService.detectCountry(npIp);
  console.log(`IP: ${npIp} -> Country: ${npCountry}`);

  // UK IP
  const ukIp = '82.163.76.0';
  const ukCountry = geoService.detectCountry(ukIp);
  console.log(`IP: ${ukIp} -> Country: ${ukCountry}`);

  console.log('\n--- Testing Warehouse Assignment ---');
  try {
    const warehouse1 = await geoService.assignWarehouse(npCountry || 'NP');
    console.log(`Warehouse assigned for NP: ${warehouse1.name} (${warehouse1.countryCode})`);

    const warehouse2 = await geoService.assignWarehouse(ukCountry || 'GB');
    console.log(`Warehouse assigned for GB: ${warehouse2.name} (${warehouse2.countryCode})`);
    
    // Test fallback (e.g. US)
    const warehouse3 = await geoService.assignWarehouse('US');
    console.log(`Warehouse assigned for US: ${warehouse3.name} (${warehouse3.countryCode})`);

  } catch (error) {
    console.error('Error assigning warehouse:', error.message);
  } finally {
    mongoose.disconnect();
    process.exit(0);
  }
}

testGeoService();
