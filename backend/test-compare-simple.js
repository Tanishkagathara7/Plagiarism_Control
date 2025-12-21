const axios = require('axios');

const API_BASE = 'http://127.0.0.1:8000/api';

async function testCompareSimple() {
  try {
    console.log('🧪 Testing compare endpoint (no auth)...');
    
    // Test compare endpoint with POST (no auth)
    console.log('🔍 Making compare request...');
    const compareResponse = await axios.post(`${API_BASE}/compare`, {
      fileA_id: 'e093fcdc-6b75-46fd-9798-28bff5dbb827',
      fileB_id: 'd0b105dc-d502-4901-8a1f-cd9ac1862c0b'
    }, {
      headers: { 
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

testCompareSimple();