const { MongoClient } = require('mongodb');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
require('dotenv').config();

async function addTestFiles() {
  let client;
  
  try {
    console.log('📁 Adding test files to database...');
    
    // Connect to database
    client = new MongoClient(process.env.MONGO_URL);
    await client.connect();
    const db = client.db(process.env.DB_NAME);
    
    const UPLOAD_DIR = path.join(__dirname, 'uploads');
    
    const testFiles = [
      {
        filename: 'test-student1.ipynb',
        student_name: 'Test Student 1',
        student_id: 'TS001'
      },
      {
        filename: 'test-student2.ipynb', 
        student_name: 'Test Student 2',
        student_id: 'TS002'
      },
      {
        filename: 'test-student3.ipynb',
        student_name: 'Test Student 3', 
        student_id: 'TS003'
      }
    ];
    
    let addedCount = 0;
    
    for (let i = 0; i < testFiles.length; i++) {
      const file = testFiles[i];
      const fileId = uuidv4();
      const filePath = path.join(UPLOAD_DIR, file.filename);
      
      const fileMetadata = {
        id: fileId,
        student_name: file.student_name,
        student_id: file.student_id,
        filename: file.filename,
        file_path: filePath,
        upload_timestamp: new Date().toISOString(),
        upload_order: i + 1
      };
      
      await db.collection('files').insertOne(fileMetadata);
      console.log(`✓ Added: ${file.student_name} - ${file.filename}`);
      addedCount++;
    }
    
    console.log(`\n✅ Successfully added ${addedCount} test files to database`);
    console.log('🚀 You can now run analysis from your web interface!');
    
  } catch (error) {
    console.error('❌ Error adding test files:', error);
  } finally {
    if (client) {
      await client.close();
    }
  }
}

addTestFiles().catch(console.error);