import { userDb, companyDb, attestationCampaignDb, attestationRecordDb } from './database.js';
import { generateToken } from './auth.js';

async function verify() {
  const timestamp = Date.now();
  
  try {
    // Create test users
    console.log('Creating test users...');
    
    await userDb.create({
      email: `verify-manager-${timestamp}@test.com`,
      name: 'Verify Manager',
      first_name: 'Verify',
      last_name: 'Manager',
      password_hash: 'dummy-hash',
      role: 'manager'
    });
    const manager = await userDb.getByEmail(`verify-manager-${timestamp}@test.com`);
    
    await userDb.create({
      email: `verify-employee-${timestamp}@test.com`,
      name: 'Verify Employee',
      first_name: 'Verify',
      last_name: 'Employee',
      password_hash: 'dummy-hash',
      role: 'employee',
      manager_email: manager.email
    });
    const employee = await userDb.getByEmail(`verify-employee-${timestamp}@test.com`);
    
    await userDb.create({
      email: `verify-admin-${timestamp}@test.com`,
      name: 'Verify Admin',
      first_name: 'Verify',
      last_name: 'Admin',
      password_hash: 'dummy-hash',
      role: 'admin'
    });
    const admin = await userDb.getByEmail(`verify-admin-${timestamp}@test.com`);
    
    // Create campaign
    console.log('Creating test campaign...');
    const startDate = new Date();
    const dueDate = new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000);
    const campaign = await attestationCampaignDb.create({
      name: `Verify Campaign ${timestamp}`,
      description: 'Verification test',
      start_date: startDate.toISOString(),
      due_date: dueDate.toISOString(),
      status: 'active',
      created_by: admin.id
    });
    
    // Create attestation record
    console.log('Creating attestation record...');
    await attestationRecordDb.create({
      campaign_id: campaign.id,
      user_id: employee.id,
      status: 'pending'
    });
    
    console.log('\n✅ Test data created successfully!');
    console.log(`Campaign ID: ${campaign.id}`);
    console.log(`Manager email: ${manager.email}`);
    console.log(`Employee email: ${employee.email}`);
    
    // Generate a token for testing
    const token = generateToken(admin);
    console.log(`\nAdmin token: ${token}`);
    
    // Make API call using fetch
    console.log('\n📡 Making API call to dashboard endpoint...\n');
    const response = await fetch(`http://localhost:3001/api/attestation/campaigns/${campaign.id}/dashboard`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    
    if (data.success && data.records && data.records.length > 0) {
      console.log('✅ API Response received successfully!');
      console.log('\n📋 Record structure:');
      const record = data.records[0];
      console.log(JSON.stringify(record, null, 2));
      
      if (record.manager_email) {
        console.log(`\n✅ SUCCESS: manager_email field is present in the response!`);
        console.log(`   Value: ${record.manager_email}`);
        console.log(`   Expected: ${manager.email}`);
        if (record.manager_email === manager.email) {
          console.log(`\n🎉 PERFECT: manager_email matches the expected value!`);
        }
      } else {
        console.log('\n❌ FAILURE: manager_email field is missing from the response!');
      }
    } else {
      console.log('❌ API call failed or returned no records');
      console.log(JSON.stringify(data, null, 2));
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
  
  process.exit(0);
}

verify();
