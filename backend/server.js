const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs-extra');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
require('dotenv').config();

const PlagiarismDetector = require('./plagiarism-detector');
const { extractStudentInfo } = require('./utils');

// Configuration
const PORT = process.env.PORT || 8000;
const HOST = process.env.PORT ? '0.0.0.0' : '127.0.0.1';
const MONGO_URL = process.env.MONGO_URL;
const DB_NAME = process.env.DB_NAME;
const JWT_SECRET = process.env.JWT_SECRET_KEY || 'your-secret-key-change-in-production';
const CORS_ORIGINS = process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : [
  'http://localhost:3000',
  'http://127.0.0.1:3000', 
  'https://plagiarism-control.vercel.app'
];

// Initialize Express app
const app = express();

// Security middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: false
}));
app.use(compression());

// CORS configuration - MUST be before other middleware
const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'https://plagiarism-control.vercel.app'
];

app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  // Set CORS headers for all requests
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  } else if (!origin) {
    // Allow requests with no origin (like mobile apps or curl)
    res.header('Access-Control-Allow-Origin', '*');
  }
  
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  next();
});

// Also use the cors middleware as backup
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization', 'Cache-Control'],
  optionsSuccessStatus: 200
}));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url} - Origin: ${req.headers.origin || 'none'}`);
  next();
});

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// File upload configuration
const UPLOAD_DIR = path.join(__dirname, 'uploads');
fs.ensureDirSync(UPLOAD_DIR);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const fileId = uuidv4();
    const ext = path.extname(file.originalname);
    cb(null, `${fileId}${ext}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.originalname.endsWith('.ipynb')) {
      cb(null, true);
    } else {
      cb(new Error('Only .ipynb files are allowed'), false);
    }
  }
});

// Database connection
let db;
let client;

async function connectToDatabase() {
  try {
    client = new MongoClient(MONGO_URL);
    await client.connect();
    db = client.db(DB_NAME);
    console.log('✓ Connected to MongoDB');
  } catch (error) {
    console.error('✗ MongoDB connection failed:', error);
    process.exit(1);
  }
}

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ detail: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(401).json({ detail: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// API Routes

// Root endpoint
app.get('/api/', (req, res) => {
  res.json({
    message: 'PlagiarismControl API',
    status: 'running',
    version: '1.0.0',
    platform: 'Node.js',
    cors_origins: CORS_ORIGINS,
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    cors_test: 'OK'
  });
});

// Handle OPTIONS requests for all API routes
app.options('/api/*', (req, res) => {
  const origin = req.headers.origin;
  const allowedOrigins = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'https://plagiarism-control.vercel.app'
  ];
  
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  } else if (!origin) {
    res.header('Access-Control-Allow-Origin', '*');
  }
  
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control');
  res.status(200).end();
});

// Debug endpoint to check files and test analysis
app.get('/api/debug/files', authenticateToken, async (req, res) => {
  try {
    const files = await db.collection('files').find({}).limit(10).toArray();
    
    const fileInfo = [];
    for (const file of files) {
      try {
        const exists = await fs.pathExists(file.file_path);
        let fileSize = 0;
        let content = '';
        
        if (exists) {
          const stats = await fs.stat(file.file_path);
          fileSize = stats.size;
          
          // Read a small sample of the file
          const fileContent = await fs.readFile(file.file_path, 'utf8');
          content = fileContent.substring(0, 200) + '...';
        }
        
        fileInfo.push({
          id: file.id,
          student_name: file.student_name,
          filename: file.filename,
          file_path: file.file_path,
          exists,
          size: fileSize,
          sample_content: content
        });
      } catch (error) {
        fileInfo.push({
          id: file.id,
          student_name: file.student_name,
          filename: file.filename,
          file_path: file.file_path,
          exists: false,
          error: error.message
        });
      }
    }
    
    res.json({
      total_files: files.length,
      files: fileInfo
    });
  } catch (error) {
    console.error('Debug files error:', error);
    res.status(500).json({ detail: error.message });
  }
});

// Test endpoint for plagiarism detection
app.post('/api/test-analysis', authenticateToken, async (req, res) => {
  try {
    console.log('🧪 Testing plagiarism detection...');
    
    // Create test data
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

    const PlagiarismDetector = require('./plagiarism-detector');
    const detector = new PlagiarismDetector(0.3);
    
    const similarity = detector.calculateSimilarity(testCode1, testCode2);
    
    res.json({
      message: 'Test completed',
      similarity: similarity,
      similarity_percent: Math.round(similarity * 100 * 100) / 100,
      test_passed: similarity > 0.5
    });
  } catch (error) {
    console.error('❌ Test analysis error:', error);
    res.status(500).json({ 
      detail: `Test failed: ${error.message}`,
      stack: error.stack
    });
  }
});

// Authentication routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ detail: 'Username and password are required' });
    }

    // Check if user already exists
    const existingUser = await db.collection('admins').findOne({ username });
    if (existingUser) {
      return res.status(400).json({ detail: 'Username already exists' });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create admin document
    const adminDoc = {
      id: uuidv4(),
      username,
      password: hashedPassword,
      created_at: new Date().toISOString()
    };

    await db.collection('admins').insertOne(adminDoc);

    res.json({ message: 'Admin registered successfully' });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ detail: 'Internal server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ detail: 'Username and password are required' });
    }

    // Find admin
    const admin = await db.collection('admins').findOne({ username });
    if (!admin) {
      return res.status(401).json({ detail: 'Invalid credentials' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, admin.password);
    if (!isValidPassword) {
      return res.status(401).json({ detail: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign({ sub: username }, JWT_SECRET, { expiresIn: '24h' });

    res.json({
      token,
      username
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ detail: 'Internal server error' });
  }
});

// Debug endpoint to check files and test analysis
app.get('/api/debug/files', authenticateToken, async (req, res) => {
  try {
    const files = await db.collection('files').find({}).limit(10).toArray();
    
    const fileInfo = [];
    for (const file of files) {
      try {
        const exists = await fs.pathExists(file.file_path);
        let fileSize = 0;
        let content = '';
        
        if (exists) {
          const stats = await fs.stat(file.file_path);
          fileSize = stats.size;
          
          // Read a small sample of the file
          const fileContent = await fs.readFile(file.file_path, 'utf8');
          content = fileContent.substring(0, 200) + '...';
        }
        
        fileInfo.push({
          id: file.id,
          student_name: file.student_name,
          filename: file.filename,
          file_path: file.file_path,
          exists,
          size: fileSize,
          sample_content: content
        });
      } catch (error) {
        fileInfo.push({
          id: file.id,
          student_name: file.student_name,
          filename: file.filename,
          file_path: file.file_path,
          exists: false,
          error: error.message
        });
      }
    }
    
    res.json({
      total_files: files.length,
      files: fileInfo
    });
  } catch (error) {
    console.error('Debug files error:', error);
    res.status(500).json({ detail: error.message });
  }
});

// Debug endpoint to check analysis results
app.get('/api/debug/results', authenticateToken, async (req, res) => {
  try {
    const count = await db.collection('analysis_results').countDocuments();
    const latest = await db.collection('analysis_results')
      .findOne({}, { 
        projection: { _id: 0, id: 1, analysis_timestamp: 1, total_matches: 1, total_files: 1 },
        sort: { analysis_timestamp: -1 }
      });
    
    const all = await db.collection('analysis_results')
      .find({}, { 
        projection: { _id: 0, id: 1, analysis_timestamp: 1, total_matches: 1, total_files: 1 }
      })
      .sort({ analysis_timestamp: -1 })
      .limit(5)
      .toArray();
    
    res.json({
      total_count: count,
      latest_result: latest,
      recent_results: all
    });
  } catch (error) {
    console.error('Debug results error:', error);
    res.status(500).json({ detail: error.message });
  }
});

// File upload routes
app.post('/api/upload', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ detail: 'No file uploaded' });
    }

    const { student_name, student_id } = req.body;

    if (!student_name || !student_id) {
      return res.status(400).json({ detail: 'Student name and ID are required' });
    }

    // Check file limit
    const filesCount = await db.collection('files').countDocuments();
    if (filesCount >= 300) {
      // Delete uploaded file
      await fs.remove(req.file.path);
      return res.status(400).json({ detail: 'Maximum file limit (300) reached' });
    }

    // Get upload order
    const uploadOrder = filesCount + 1;

    // Create file metadata
    const fileMetadata = {
      id: path.parse(req.file.filename).name, // Use the UUID from filename
      student_name,
      student_id,
      filename: req.file.originalname,
      file_path: req.file.path,
      upload_timestamp: new Date().toISOString(),
      upload_order: uploadOrder
    };

    await db.collection('files').insertOne(fileMetadata);

    res.json({
      message: 'File uploaded successfully',
      file_id: fileMetadata.id
    });
  } catch (error) {
    console.error('Upload error:', error);
    // Clean up uploaded file on error
    if (req.file) {
      await fs.remove(req.file.path).catch(() => {});
    }
    res.status(500).json({ detail: 'File upload failed' });
  }
});

app.post('/api/upload/bulk', authenticateToken, upload.array('files', 300), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ detail: 'No files provided' });
    }

    // Check current file count
    const currentCount = await db.collection('files').countDocuments();
    if (currentCount + req.files.length > 300) {
      // Clean up uploaded files
      for (const file of req.files) {
        await fs.remove(file.path).catch(() => {});
      }
      return res.status(400).json({
        detail: `Upload would exceed maximum limit. Current: ${currentCount}, Trying to add: ${req.files.length}, Max: 300`
      });
    }

    const uploadedFiles = [];
    const failedFiles = [];

    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      try {
        // Extract student info from filename
        const { studentName, studentId } = extractStudentInfo(file.originalname);

        // Get upload order
        const uploadOrder = currentCount + uploadedFiles.length + 1;

        // Create file metadata
        const fileMetadata = {
          id: path.parse(file.filename).name,
          student_name: studentName,
          student_id: studentId,
          filename: file.originalname,
          file_path: file.path,
          upload_timestamp: new Date().toISOString(),
          upload_order: uploadOrder
        };

        await db.collection('files').insertOne(fileMetadata);

        uploadedFiles.push({
          file_id: fileMetadata.id,
          filename: file.originalname,
          student_name: studentName,
          student_id: studentId
        });
      } catch (error) {
        failedFiles.push({
          filename: file.originalname,
          error: error.message
        });
        // Clean up failed file
        await fs.remove(file.path).catch(() => {});
      }
    }

    res.json({
      message: `Bulk upload completed. ${uploadedFiles.length} files uploaded successfully.`,
      uploaded_files: uploadedFiles,
      failed_files: failedFiles,
      total_uploaded: uploadedFiles.length,
      total_failed: failedFiles.length
    });
  } catch (error) {
    console.error('Bulk upload error:', error);
    // Clean up all uploaded files on error
    if (req.files) {
      for (const file of req.files) {
        await fs.remove(file.path).catch(() => {});
      }
    }
    res.status(500).json({ detail: 'Bulk upload failed' });
  }
});

// File management routes
app.get('/api/files', authenticateToken, async (req, res) => {
  try {
    const files = await db.collection('files')
      .find({}, {
        projection: {
          _id: 0,
          id: 1,
          student_name: 1,
          student_id: 1,
          filename: 1,
          upload_timestamp: 1,
          upload_order: 1
        }
      })
      .sort({ upload_order: 1 })
      .limit(300)
      .toArray();

    res.json(files);
  } catch (error) {
    console.error('Get files error:', error);
    res.status(500).json({ detail: 'Failed to retrieve files' });
  }
});

app.get('/api/files/count', authenticateToken, async (req, res) => {
  try {
    const count = await db.collection('files').countDocuments();
    res.json({ count, max: 300 });
  } catch (error) {
    console.error('Get files count error:', error);
    res.status(500).json({ detail: 'Failed to get file count' });
  }
});

app.delete('/api/files/:fileId', authenticateToken, async (req, res) => {
  try {
    const { fileId } = req.params;

    const file = await db.collection('files').findOne({ id: fileId });
    if (!file) {
      return res.status(404).json({ detail: 'File not found' });
    }

    // Delete physical file
    await fs.remove(file.file_path).catch(() => {});

    // Delete from database
    await db.collection('files').deleteOne({ id: fileId });

    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({ detail: 'Failed to delete file' });
  }
});

app.delete('/api/files', authenticateToken, async (req, res) => {
  try {
    // Get all files to delete physical files
    const files = await db.collection('files').find({}, { projection: { file_path: 1 } }).toArray();

    let deletedCount = 0;
    let failedCount = 0;

    // Delete physical files
    for (const file of files) {
      try {
        await fs.remove(file.file_path);
        deletedCount++;
      } catch (error) {
        failedCount++;
        console.error(`Failed to delete file ${file.file_path}:`, error);
      }
    }

    // Delete all records from database
    const result = await db.collection('files').deleteMany({});

    res.json({
      message: `Deleted ${result.deletedCount} file records`,
      deleted_files: deletedCount,
      failed_files: failedCount,
      total_records_deleted: result.deletedCount
    });
  } catch (error) {
    console.error('Delete all files error:', error);
    res.status(500).json({ detail: 'Failed to delete files' });
  }
});

// Analysis routes
app.post('/api/analyze', authenticateToken, async (req, res) => {
  try {
    let { threshold = 30 } = req.body; // Lower default threshold to 30%
    
    // Convert percentage to decimal if needed
    if (threshold > 1) {
      threshold = threshold / 100;
    }

    console.log(`🔍 Starting analysis with threshold: ${threshold} (${threshold * 100}%)`);

    // Validate threshold
    if (threshold < 0.05 || threshold > 1.0) {
      return res.status(400).json({ detail: 'Threshold must be between 5% and 100%' });
    }

    const files = await db.collection('files').find({}).limit(300).toArray();

    if (files.length < 2) {
      return res.status(400).json({ detail: 'At least 2 files are required for analysis' });
    }

    console.log(`📁 Found ${files.length} files in database`);

    // Check if files exist and have content
    let validFiles = 0;
    for (const file of files) {
      try {
        const exists = await fs.pathExists(file.file_path);
        if (exists) {
          const stats = await fs.stat(file.file_path);
          if (stats.size > 0) {
            validFiles++;
          } else {
            console.log(`⚠️ Empty file: ${file.file_path}`);
          }
        } else {
          console.log(`⚠️ File not found: ${file.file_path}`);
        }
      } catch (error) {
        console.log(`❌ Error checking file ${file.file_path}: ${error.message}`);
      }
    }
    
    console.log(`📊 Valid files: ${validFiles}/${files.length}`);

    // Limit files for performance but allow more than before
    const filesToAnalyze = files.slice(0, 50); // Reduced from 150 to 50 for much faster analysis

    const filesData = filesToAnalyze.map(f => ({
      file_id: f.id,
      student_name: f.student_name,
      student_id: f.student_id,
      file_path: f.file_path,
      filename: f.filename,
      upload_order: f.upload_order
    }));

    console.log(`🚀 Analyzing ${filesData.length} files...`);

    // Run plagiarism detection with improved detector
    const PlagiarismDetector = require('./plagiarism-detector');
    const detector = new PlagiarismDetector(threshold);
    
    console.log('📊 Starting plagiarism detection...');
    const startTime = Date.now();
    
    const results = await detector.detectPlagiarism(filesData);
    
    const analysisTime = Date.now() - startTime;
    console.log(`✅ Analysis completed in ${analysisTime}ms. Found ${results.length} matches`);

    // Log some sample results for debugging
    if (results.length > 0) {
      console.log('📋 Sample results:');
      results.slice(0, 3).forEach((result, index) => {
        console.log(`  ${index + 1}. ${result.studentA} vs ${result.studentB}: ${result.similarity}%`);
      });
    } else {
      console.log('⚠️ No matches found - this might indicate an issue with the analysis');
    }

    // Create analysis result with additional metadata
    const analysisResult = {
      id: uuidv4(),
      analysis_timestamp: new Date().toISOString(),
      threshold,
      results,
      total_files: filesToAnalyze.length,
      total_matches: results.length,
      analysis_duration: analysisTime,
      statistics: {
        exact_duplicates: results.filter(r => r.is_exact_duplicate).length,
        high_similarity: results.filter(r => r.similarity > 80).length,
        medium_similarity: results.filter(r => r.similarity >= 50 && r.similarity <= 80).length,
        low_similarity: results.filter(r => r.similarity < 50).length,
        avg_similarity: results.length > 0 ? results.reduce((sum, r) => sum + r.similarity, 0) / results.length : 0,
        max_similarity: results.length > 0 ? Math.max(...results.map(r => r.similarity)) : 0
      }
    };

    // Save to database
    await db.collection('analysis_results').insertOne(analysisResult);

    console.log(`💾 Analysis result saved with ID: ${analysisResult.id}`);
    console.log(`📈 Statistics: ${analysisResult.statistics.exact_duplicates} exact, ${analysisResult.statistics.high_similarity} high, ${analysisResult.statistics.medium_similarity} medium similarity matches`);

    res.json(analysisResult);
  } catch (error) {
    console.error('❌ Analysis error:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ 
      detail: `Analysis failed: ${error.message}`,
      error_type: error.name,
      timestamp: new Date().toISOString()
    });
  }
});

app.get('/api/results/latest', authenticateToken, async (req, res) => {
  try {
    console.log('🔍 Fetching latest analysis results...');
    
    // Use the correct MongoDB syntax for sorting
    const result = await db.collection('analysis_results')
      .find({}, { projection: { _id: 0 } })
      .sort({ analysis_timestamp: -1 })
      .limit(1)
      .toArray();

    const latestResult = result.length > 0 ? result[0] : null;

    console.log(`📊 Latest result found: ${latestResult ? 'Yes' : 'No'}`);
    
    if (!latestResult) {
      console.log('⚠️ No analysis results found in database');
      return res.json({ 
        results: [], 
        total_files: 0, 
        total_matches: 0,
        message: 'No analysis results available'
      });
    }

    console.log(`✅ Returning analysis ${latestResult.id} with ${latestResult.total_matches} matches from ${latestResult.analysis_timestamp}`);
    res.json(latestResult);
  } catch (error) {
    console.error('❌ Get latest result error:', error);
    res.status(500).json({ detail: 'Failed to get latest result' });
  }
});

app.get('/api/results/history', authenticateToken, async (req, res) => {
  try {
    const results = await db.collection('analysis_results')
      .find({}, {
        projection: {
          _id: 0,
          id: 1,
          analysis_timestamp: 1,
          threshold: 1,
          total_files: 1,
          total_matches: 1,
          results: 1
        }
      })
      .sort({ analysis_timestamp: -1 })
      .limit(50)
      .toArray();

    // Add summary statistics
    results.forEach(result => {
      if (result.results && result.results.length > 0) {
        const similarities = result.results.map(r => r.similarity || 0);
        result.avg_similarity = similarities.reduce((a, b) => a + b, 0) / similarities.length;
        result.max_similarity = Math.max(...similarities);
        result.high_risk_count = similarities.filter(s => s >= 70).length;
        result.medium_risk_count = similarities.filter(s => s >= 40 && s < 70).length;
        result.low_risk_count = similarities.filter(s => s < 40).length;
      } else {
        result.avg_similarity = 0;
        result.max_similarity = 0;
        result.high_risk_count = 0;
        result.medium_risk_count = 0;
        result.low_risk_count = 0;
      }
    });

    res.json(results);
  } catch (error) {
    console.error('Get analysis history error:', error);
    res.status(500).json({ detail: 'Failed to get analysis history' });
  }
});

// Test endpoint for filename extraction
app.post('/api/test-extraction', authenticateToken, (req, res) => {
  try {
    const { filename } = req.body;
    const { studentName, studentId } = extractStudentInfo(filename);
    
    res.json({
      filename,
      extracted_name: studentName,
      extracted_id: studentId
    });
  } catch (error) {
    console.error('Test extraction error:', error);
    res.status(500).json({ detail: 'Test extraction failed' });
  }
});

// Compare files endpoint
app.post('/api/compare', authenticateToken, async (req, res) => {
  try {
    const { fileA_id, fileB_id } = req.body;

    if (!fileA_id || !fileB_id) {
      return res.status(400).json({ detail: 'Both fileA_id and fileB_id are required' });
    }

    const fileA = await db.collection('files').findOne({ id: fileA_id });
    const fileB = await db.collection('files').findOne({ id: fileB_id });

    if (!fileA || !fileB) {
      return res.status(404).json({ detail: 'One or both files not found' });
    }

    const { NotebookParser } = require('./plagiarism-detector');

    const codeA = await NotebookParser.extractCodeFromNotebook(fileA.file_path);
    const codeB = await NotebookParser.extractCodeFromNotebook(fileB.file_path);

    res.json({
      fileA: {
        student_name: fileA.student_name,
        student_id: fileA.student_id,
        code: codeA
      },
      fileB: {
        student_name: fileB.student_name,
        student_id: fileB.student_id,
        code: codeB
      }
    });
  } catch (error) {
    console.error('Compare files error:', error);
    res.status(500).json({ detail: 'Failed to compare files' });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ detail: 'Internal server error' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ detail: 'Endpoint not found' });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down server...');
  if (client) {
    await client.close();
    console.log('✓ Database connection closed');
  }
  process.exit(0);
});

// Start server
async function startServer() {
  try {
    await connectToDatabase();
    
    app.listen(PORT, HOST, () => {
      console.log('🚀 Plagiarism Control Backend Server Started');
      console.log(`🌐 Server: http://${HOST}:${PORT}`);
      console.log(`📚 API Base: http://${HOST}:${PORT}/api`);
      console.log('📁 Upload Directory:', UPLOAD_DIR);
      console.log('🔒 JWT Secret:', JWT_SECRET.substring(0, 10) + '...');
      console.log('📊 Database:', DB_NAME);
      console.log('🌍 CORS Origins:', CORS_ORIGINS);
      console.log('🔧 Environment:', process.env.NODE_ENV || 'development');
      console.log('✅ Ready to accept requests');
      console.log('');
      console.log('Test the API:');
      console.log(`  curl http://${HOST}:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();