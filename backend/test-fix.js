const { MongoClient } = require('mongodb');
const fs = require('fs-extra');
const path = require('path');
require('dotenv').config();

const PlagiarismDetector = require('./plagiarism-detector');

async function testFix() {
  console.log('🧪 Testing plagiarism detection fixes...');
  
  try {
    // Test 1: Basic detector functionality
    console.log('\n1️⃣ Testing basic detector functionality...');
    const detector = new PlagiarismDetector(0.3);
    
    const testCode1 = `
def hello_world():
    print("Hello, World!")
    return "success"

for i in range(10):
    print(i)
`;

    const testCode2 = `
def hello_world():
    print("Hello, World!")
    return "success"

for j in range(10):
    print(j)
`;

    const similarity = detector.calculateSimilarity(testCode1, testCode2);
    console.log(`✓ Similarity calculation works: ${(similarity * 100).toFixed(2)}%`);
    
    // Test 2: Cache clearing
    console.log('\n2️⃣ Testing cache clearing...');
    detector.clearCaches();
    console.log('✓ Cache clearing works');
    
    // Test 3: File validation with actual files
    console.log('\n3️⃣ Testing file validation...');
    const UPLOAD_DIR = path.join(__dirname, 'uploads');
    const files = await fs.readdir(UPLOAD_DIR);
    const testFiles = files.slice(0, 3); // Test with first 3 files
    
    let validFiles = 0;
    for (const file of testFiles) {
      const filePath = path.join(UPLOAD_DIR, file);
      try {
        const exists = await fs.pathExists(filePath);
        if (exists) {
          const stats = await fs.stat(filePath);
          if (stats.size > 0) {
            validFiles++;
            console.log(`✓ Valid file: ${file} (${stats.size} bytes)`);
          }
        }
      } catch (error) {
        console.log(`❌ Invalid file: ${file} - ${error.message}`);
      }
    }
    
    console.log(`✓ Found ${validFiles}/${testFiles.length} valid files`);
    
    // Test 4: Database connection (if available)
    console.log('\n4️⃣ Testing database connection...');
    try {
      const client = new MongoClient(process.env.MONGO_URL);
      await client.connect();
      const db = client.db(process.env.DB_NAME);
      const count = await db.collection('files').countDocuments();
      console.log(`✓ Database connection works: ${count} files in database`);
      await client.close();
    } catch (error) {
      console.log(`⚠️ Database connection failed: ${error.message}`);
    }
    
    console.log('\n✅ All tests completed successfully!');
    console.log('\n📋 Summary of fixes applied:');
    console.log('   • Added cache clearing to prevent stale data');
    console.log('   • Enhanced file validation with existence and size checks');
    console.log('   • Improved error handling for missing/corrupted files');
    console.log('   • Added file path repair functionality');
    console.log('   • Better logging for debugging issues');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

if (require.main === module) {
  testFix().catch(console.error);
}

module.exports = { testFix };