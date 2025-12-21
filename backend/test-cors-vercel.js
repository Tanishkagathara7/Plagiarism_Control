const axios = require('axios');

const API_BASE = 'https://plagiarism-control.onrender.com/api';

async function testCorsWithVercelOrigin() {
  try {
    console.log('🧪 Testing CORS with Vercel origin...');
    
    // Test with Vercel origin header
    const response = await axios.get(`${API_BASE}/health`, {
      headers: {
        'Origin': 'https://plagiarism-control.vercel.app'
      }
    });
    
    console.log('✅ CORS test successful!');
    console.log('📋 Response:', response.data);
    console.log('🔧 CORS Headers:');
    console.log('  Access-Control-Allow-Origin:', response.headers['access-control-allow-origin']);
    console.log('  Access-Control-Allow-Credentials:', response.headers['access-control-allow-credentials']);
    
  } catch (error) {
    console.error('❌ CORS test failed:', error.response?.data || error.message);
    if (error.response?.status) {
      console.error(`   Status: ${error.response.status}`);
    }
  }
}

testCorsWithVercelOrigin();