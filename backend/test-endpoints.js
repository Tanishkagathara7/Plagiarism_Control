const axios = require('axios');

const API_BASE = 'http://127.0.0.1:8000';

async function testEndpoints() {
  try {
    console.log('🧪 Testing available endpoints...');
    
    // Test root endpoint
    console.log('1. Testing root endpoint...');
    const rootResponse = await axios.get(`${API_BASE}/api/`);
    console.log('✅ Root endpoint works');
    
    // Test health endpoint
    console.log('2. Testing health endpoint...');
    const healthResponse = await axios.get(`${API_BASE}/api/health`);
    console.log('✅ Health endpoint works');
    
    // Test compare endpoint with OPTIONS (preflight)
    console.log('3. Testing compare endpoint OPTIONS...');
    try {
      const optionsResponse = await axios.options(`${API_BASE}/api/compare`);
      console.log('✅ Compare OPTIONS works');
    } catch (error) {
      console.log('❌ Compare OPTIONS failed:', error.response?.status || error.message);
    }
    
    // Test compare endpoint with POST (no auth)
    console.log('4. Testing compare endpoint POST (no auth)...');
    try {
      const compareResponse = await axios.post(`${API_BASE}/api/compare`, {
        fileA_id: 'test1',
        fileB_id: 'test2'
      });
      console.log('✅ Compare POST works (unexpected)');
    } catch (error) {
      console.log(`❌ Compare POST failed: ${error.response?.status} - ${error.response?.data?.detail || error.message}`);
    }
    
    // Test a non-existent endpoint
    console.log('5. Testing non-existent endpoint...');
    try {
      const nonExistentResponse = await axios.get(`${API_BASE}/api/nonexistent`);
      console.log('❌ Non-existent endpoint should not work');
    } catch (error) {
      console.log(`✅ Non-existent endpoint correctly returns: ${error.response?.status} - ${error.response?.data?.detail}`);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testEndpoints();