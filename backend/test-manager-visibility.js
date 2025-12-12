import { assetDb, userDb, companyDb } from './database.js';

async function test() {
  try {
    await assetDb.init();
    
    // Create test users
    const timestamp = Date.now();
    const companyResult = await companyDb.create({
      name: `Test Company ${timestamp}`,
      description: 'Test company'
    });
    
    const emp1 = await userDb.create({
      email: `emp1-${timestamp}@test.com`,
      password_hash: 'hash',
      name: 'Employee One',
      role: 'employee',
      first_name: 'Employee',
      last_name: 'One'
    });
    
    const emp2 = await userDb.create({
      email: `emp2-${timestamp}@test.com`,
      password_hash: 'hash',
      name: 'Employee Two',
      role: 'employee',
      first_name: 'Employee',
      last_name: 'Two'
    });
    
    const mgr = await userDb.create({
      email: `mgr-${timestamp}@test.com`,
      password_hash: 'hash',
      name: 'Manager',
      role: 'manager',
      first_name: 'Manager',
      last_name: 'Test'
    });
    
    const company = await companyDb.getById(companyResult.id);
    
    // Create assets for both employees (not managed by the test manager)
    const asset1 = await assetDb.create({
      employee_first_name: 'Employee',
      employee_last_name: 'One',
      employee_email: `emp1-${timestamp}@test.com`,
      company_name: company.name,
      asset_type: 'laptop',
      serial_number: `SN1-${timestamp}`,
      asset_tag: `TAG1-${timestamp}`,
      status: 'active'
    });
    
    const asset2 = await assetDb.create({
      employee_first_name: 'Employee',
      employee_last_name: 'Two',
      employee_email: `emp2-${timestamp}@test.com`,
      company_name: company.name,
      asset_type: 'laptop',
      serial_number: `SN2-${timestamp}`,
      asset_tag: `TAG2-${timestamp}`,
      status: 'active'
    });
    
    // Get users
    const employee1 = await userDb.getByEmail(`emp1-${timestamp}@test.com`);
    const employee2 = await userDb.getByEmail(`emp2-${timestamp}@test.com`);
    const manager = await userDb.getByEmail(`mgr-${timestamp}@test.com`);
    
    // Test: Manager should see both employee assets (even though not their direct reports)
    const managerAssets = await assetDb.getScopedForUser(manager);
    console.log(`Manager sees ${managerAssets.length} assets (expected: at least 2)`);
    const hasAsset1 = managerAssets.find(a => a.id === asset1.id);
    const hasAsset2 = managerAssets.find(a => a.id === asset2.id);
    console.log(`Manager sees employee1 asset: ${!!hasAsset1}`);
    console.log(`Manager sees employee2 asset: ${!!hasAsset2}`);
    
    // Test: Employee should only see their own
    const emp1Assets = await assetDb.getScopedForUser(employee1);
    console.log(`Employee1 sees ${emp1Assets.length} assets (expected: 1)`);
    console.log(`Employee1 sees own asset: ${!!emp1Assets.find(a => a.id === asset1.id)}`);
    console.log(`Employee1 sees other asset: ${!!emp1Assets.find(a => a.id === asset2.id)}`);
    
    // Cleanup
    await assetDb.delete(asset1.id);
    await assetDb.delete(asset2.id);
    await userDb.delete(employee1.id);
    await userDb.delete(employee2.id);
    await userDb.delete(manager.id);
    await companyDb.delete(company.id);
    
    console.log('\nTest completed successfully!');
  } catch (err) {
    console.error('Test failed:', err);
    process.exit(1);
  }
}

test();
