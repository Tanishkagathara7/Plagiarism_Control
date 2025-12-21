const axios = require('axios');

const API_BASE = 'http://127.0.0.1:8000/api';

async function testCompareEndpoint() {
  try {
    console.log('🧪 Testing compare endpoint...');
    
    // Step 1: Register a test user
    console.log('📝 Registering test user...');
    try {
      await axios.post(`${API_BASE}/auth/register`, {
        username: 'testuser',
        password: 'testpass123'
      });
      console.log('✅ User registered successfully');
    } catch (error) {
      if (error.response?.data?.detail?.includes('already exists')) {
        console.log('ℹ️ User already exists, continuing...');
      } else {
        throw error;
      }
    }
    
    // Step 2: Login to get token
    console.log('🔐 Logging in...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      username: 'testuser',
      password: 'testpass123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login successful, token obtained');
    
    // Step 3: Get available files
    console.log('📁 Getting available files...');
    const filesResponse = await axios.get(`${API_BASE}/files`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const files = filesResponse.data;
    console.log(`📊 Found ${files.length} files`);
    
    if (files.length < 2) {
      console.log('❌ Need at least 2 files to test compare');
      return;
    }
    
    // Step 4: Test compare endpoint
    const fileA = files[0];
    const fileB = files[1];
    
    console.log(`🔍 Comparing files:`);
    console.log(`  File A: ${fileA.student_name} (${fileA.id})`);
    console.log(`  File B: ${fileB.student_name} (${fileB.id})`);
    
    console.log('🔍 Making compare request...');
    const compareResponse = await axios.post(`${API_BASE}/compare`, {
      fileA_id: fileA.id,
      fileB_id: fileB.id
    }, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Compare endpoint successful!');
    console.log('📋 Response data:');
    console.log(`  File A: ${compareResponse.data.fileA.student_name} (${compareResponse.data.fileA.code.length} chars)`);
    console.log(`  File B: ${compareResponse.data.fileB.student_name} (${compareResponse.data.fileB.code.length} chars)`);
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    if (error.response?.status) {
      console.error(`   Status: ${error.response.status}`);
    }
  }
}

testCompareEndpoint();