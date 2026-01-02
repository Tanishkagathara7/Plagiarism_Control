const { MongoClient } = require('mongodb');
const fs = require('fs-extra');
const path = require('path');
require('dotenv').config();

const MONGO_URL = process.env.MONGO_URL;
const DB_NAME = process.env.DB_NAME;
const UPLOAD_DIR = path.join(__dirname, 'uploads');

async function fixFilePaths() {
  let client;
  
  try {
    console.log('🔧 Starting file path validation and repair...');
    
    // Connect to database
    client = new MongoClient(MONGO_URL);
    await client.connect();
    const db = client.db(DB_NAME);
    
    console.log('✓ Connected to MongoDB');
    
    // Get all files from database
    const files = await db.collection('files').find({}).toArray();
    console.log(`📁 Found ${files.length} files in database`);
    
    let fixedCount = 0;
    let removedCount = 0;
    let validCount = 0;
    
    for (const file of files) {
      try {
        const currentPath = file.file_path;
        const exists = await fs.pathExists(currentPath);
        
        if (exists) {
          // Check if file has content
          const stats = await fs.stat(currentPath);
          if (stats.size > 0) {
            validCount++;
            console.log(`✓ Valid: ${file.student_name} - ${path.basename(currentPath)}`);
          } else {
            console.log(`⚠️ Empty file: ${currentPath}`);
            // Remove empty files from database
            await db.collection('files').deleteOne({ id: file.id });
            removedCount++;
          }
        } else {
          // Try to find the file in uploads directory
          const filename = path.basename(currentPath);
          const expectedPath = path.join(UPLOAD_DIR, filename);
          
          if (await fs.pathExists(expectedPath)) {
            // Update the path in database
            await db.collection('files').updateOne(
              { id: file.id },
              { $set: { file_path: expectedPath } }
            );
            console.log(`🔧 Fixed path: ${currentPath} → ${expectedPath}`);
            fixedCount++;
          } else {
            // File doesn't exist anywhere, remove from database
            console.log(`❌ File not found, removing: ${currentPath}`);
            await db.collection('files').deleteOne({ id: file.id });
            removedCount++;
          }
        }
      } catch (error) {
        console.error(`❌ Error processing ${file.file_path}: ${error.message}`);
        // Remove problematic entries
        await db.collection('files').deleteOne({ id: file.id });
        removedCount++;
      }
    }
    
    console.log('\n📊 Summary:');
    console.log(`   ✓ Valid files: ${validCount}`);
    console.log(`   🔧 Fixed paths: ${fixedCount}`);
    console.log(`   ❌ Removed invalid: ${removedCount}`);
    console.log(`   📁 Total remaining: ${validCount + fixedCount}`);
    
    // Clean up orphaned files in uploads directory
    console.log('\n🧹 Cleaning up orphaned files...');
    const uploadedFiles = await fs.readdir(UPLOAD_DIR);
    const dbFiles = await db.collection('files').find({}).toArray();
    const dbFilenames = new Set(dbFiles.map(f => path.basename(f.file_path)));
    
    let orphanedCount = 0;
    for (const uploadedFile of uploadedFiles) {
      if (uploadedFile.endsWith('.ipynb') && !dbFilenames.has(uploadedFile)) {
        const orphanPath = path.join(UPLOAD_DIR, uploadedFile);
        await fs.remove(orphanPath);
        console.log(`🗑️ Removed orphaned file: ${uploadedFile}`);
        orphanedCount++;
      }
    }
    
    console.log(`🧹 Removed ${orphanedCount} orphaned files`);
    
    console.log('\n✅ File path repair completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during file path repair:', error);
  } finally {
    if (client) {
      await client.close();
      console.log('✓ Database connection closed');
    }
  }
}

// Run the repair if this script is executed directly
if (require.main === module) {
  fixFilePaths().catch(console.error);
}

module.exports = { fixFilePaths };