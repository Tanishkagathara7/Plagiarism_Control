const fs = require('fs-extra');
const natural = require('natural');
const stringSimilarity = require('string-similarity');
const { diffLines } = require('diff');
const crypto = require('crypto');

class CodeNormalizer {
  /**
   * Remove Python comments from code
   */
  static removeComments(code) {
    if (!code) return '';
    
    // Remove single line comments
    code = code.replace(/#.*$/gm, '');
    
    // Remove multi-line comments (triple quotes)
    code = code.replace(/"""[\s\S]*?"""/g, '');
    code = code.replace(/'''[\s\S]*?'''/g, '');
    
    // Remove docstrings at the beginning of functions/classes
    code = code.replace(/^\s*"""[\s\S]*?"""/gm, '');
    code = code.replace(/^\s*'''[\s\S]*?'''/gm, '');
    
    return code;
  }

  /**
   * Normalize whitespace and indentation
   */
  static normalizeWhitespace(code) {
    if (!code) return '';
    
    const lines = code.split('\n');
    const normalizedLines = [];
    
    for (const line of lines) {
      const stripped = line.trim(); // Fixed: use trim() instead of strip()
      if (stripped && stripped.length > 1) { // Skip very short lines
        normalizedLines.push(stripped);
      }
    }
    
    return normalizedLines.join('\n');
  }

  /**
   * Normalize variable names to generic names
   */
  static normalizeVariableNames(code) {
    if (!code) return '';
    
    const keywords = new Set([
      'def', 'class', 'import', 'from', 'if', 'else', 'elif', 'for', 'while',
      'return', 'try', 'except', 'finally', 'with', 'as', 'break', 'continue',
      'pass', 'raise', 'assert', 'yield', 'lambda', 'True', 'False', 'None',
      'and', 'or', 'not', 'in', 'is', 'print', 'range', 'len', 'str', 'int',
      'float', 'list', 'dict', 'set', 'tuple', 'open', 'file', 'input', 'output',
      'np', 'pd', 'plt', 'math', 'random', 'os', 'sys', 'json', 'csv'
    ]);

    const tokenRegex = /\b[a-zA-Z_][a-zA-Z0-9_]*\b/g;
    const tokens = code.match(tokenRegex) || [];
    
    const varMapping = new Map();
    let varCounter = 0;
    let normalizedCode = code;

    // First pass: identify all unique variables
    const uniqueTokens = new Set();
    for (const token of tokens) {
      if (!keywords.has(token) && token.length > 1) {
        uniqueTokens.add(token);
      }
    }

    // Second pass: create mappings
    for (const token of uniqueTokens) {
      if (!varMapping.has(token)) {
        varMapping.set(token, `var${varCounter}`);
        varCounter++;
      }
    }

    // Third pass: replace variables
    for (const [original, normalized] of varMapping) {
      const regex = new RegExp(`\\b${original}\\b`, 'g');
      normalizedCode = normalizedCode.replace(regex, normalized);
    }

    return normalizedCode;
  }

  /**
   * Remove string literals to focus on code structure
   */
  static removeStringLiterals(code) {
    if (!code) return '';
    
    // Remove string literals but keep the quotes for structure
    code = code.replace(/"[^"]*"/g, '""');
    code = code.replace(/'[^']*'/g, "''");
    code = code.replace(/f"[^"]*"/g, 'f""');
    code = code.replace(/f'[^']*'/g, "f''");
    
    return code;
  }

  /**
   * Apply all normalizations
   */
  static normalizeCode(code, normalizeVars = true) {
    if (!code) return '';
    
    try {
      code = this.removeComments(code);
      code = this.removeStringLiterals(code);
      code = this.normalizeWhitespace(code);
      if (normalizeVars) {
        code = this.normalizeVariableNames(code);
      }
      return code;
    } catch (error) {
      console.error('Error normalizing code:', error);
      return code || '';
    }
  }
}

class NotebookParser {
  /**
   * Extract code cells from Jupyter notebook
   */
  static async extractCodeFromNotebook(filePath) {
    try {
      if (!await fs.pathExists(filePath)) {
        console.error(`File does not exist: ${filePath}`);
        return '';
      }

      const content = await fs.readFile(filePath, 'utf8');
      
      if (!content.trim()) {
        console.error(`File is empty: ${filePath}`);
        return '';
      }

      const notebook = JSON.parse(content);
      
      if (!notebook.cells || !Array.isArray(notebook.cells)) {
        console.error(`Invalid notebook format: ${filePath}`);
        return '';
      }
      
      const codeCells = [];
      
      for (const cell of notebook.cells) {
        if (cell.cell_type === 'code' && cell.source) {
          let cellContent = '';
          
          if (Array.isArray(cell.source)) {
            cellContent = cell.source.join('');
          } else if (typeof cell.source === 'string') {
            cellContent = cell.source;
          }
          
          // Only add non-empty cells
          if (cellContent.trim()) {
            codeCells.push(cellContent);
          }
        }
      }
      
      const result = codeCells.join('\n\n');
      console.log(`Extracted ${codeCells.length} code cells from ${filePath}, total length: ${result.length}`);
      
      return result;
    } catch (error) {
      console.error(`Error reading notebook ${filePath}:`, error.message);
      return '';
    }
  }
}

class AdvancedPlagiarismDetector {
  constructor(threshold = 0.5, normalizeVars = true) {
    this.threshold = threshold;
    this.normalizeVars = normalizeVars;
    this.codeHashes = new Map();
  }

  /**
   * Clear internal caches - call this before each new analysis
   */
  clearCaches() {
    this.codeHashes.clear();
    console.log('🧹 Cleared internal caches');
  }

  /**
   * Calculate hash for duplicate detection
   */
  calculateCodeHash(code) {
    if (!code) return '';
    return crypto.createHash('md5').update(code.trim()).digest('hex');
  }

  /**
   * Calculate structural similarity based on AST-like patterns
   */
  calculateStructuralSimilarity(code1, code2) {
    if (!code1 || !code2) return 0;

    // Extract structural patterns
    const patterns1 = this.extractStructuralPatterns(code1);
    const patterns2 = this.extractStructuralPatterns(code2);

    if (patterns1.length === 0 || patterns2.length === 0) return 0;

    // Calculate Jaccard similarity of patterns
    const set1 = new Set(patterns1);
    const set2 = new Set(patterns2);
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);

    return union.size > 0 ? intersection.size / union.size : 0;
  }

  /**
   * Extract structural patterns from code
   */
  extractStructuralPatterns(code) {
    if (!code) return [];
    
    const patterns = [];
    const lines = code.split('\n').filter(line => line.trim());

    for (const line of lines) {
      const trimmed = line.trim();
      
      // Extract control structures
      if (trimmed.startsWith('if ')) patterns.push('IF_STATEMENT');
      if (trimmed.startsWith('for ')) patterns.push('FOR_LOOP');
      if (trimmed.startsWith('while ')) patterns.push('WHILE_LOOP');
      if (trimmed.startsWith('def ')) patterns.push('FUNCTION_DEF');
      if (trimmed.startsWith('class ')) patterns.push('CLASS_DEF');
      if (trimmed.startsWith('try:')) patterns.push('TRY_BLOCK');
      if (trimmed.startsWith('except')) patterns.push('EXCEPT_BLOCK');
      if (trimmed.includes('import ')) patterns.push('IMPORT_STATEMENT');
      if (trimmed.includes('=') && !trimmed.includes('==')) patterns.push('ASSIGNMENT');
      if (trimmed.includes('print(')) patterns.push('PRINT_STATEMENT');
      if (trimmed.includes('return ')) patterns.push('RETURN_STATEMENT');
      
      // Extract function calls
      const funcCalls = trimmed.match(/\w+\(/g);
      if (funcCalls) {
        funcCalls.forEach(call => {
          patterns.push(`FUNC_CALL_${call.slice(0, -1)}`);
        });
      }
    }

    return patterns;
  }

  /**
   * Fast similarity calculation optimized for speed
   */
  calculateSimilarity(code1, code2) {
    if (!code1 || !code2) return 0;
    if (code1.trim() === code2.trim()) return 1.0;

    try {
      // Quick length check - if one is much shorter, likely not similar
      const len1 = code1.length;
      const len2 = code2.length;
      const lengthRatio = Math.min(len1, len2) / Math.max(len1, len2);
      if (lengthRatio < 0.3) return 0; // Early exit for very different lengths

      // Fast string similarity using Dice coefficient only
      const stringSim = stringSimilarity.compareTwoStrings(code1, code2);
      
      // Quick token-based check
      const words1 = code1.toLowerCase().split(/\s+/).filter(w => w.length > 2);
      const words2 = code2.toLowerCase().split(/\s+/).filter(w => w.length > 2);
      
      if (words1.length === 0 || words2.length === 0) return stringSim;
      
      const set1 = new Set(words1);
      const set2 = new Set(words2);
      const intersection = new Set([...set1].filter(x => set2.has(x)));
      const union = new Set([...set1, ...set2]);
      
      const jaccardSim = union.size > 0 ? intersection.size / union.size : 0;

      // Weighted combination (simplified)
      const combinedSimilarity = (stringSim * 0.6) + (jaccardSim * 0.4);
      
      return Math.min(combinedSimilarity, 1.0);
    } catch (error) {
      console.error('Error calculating similarity:', error);
      return 0;
    }
  }

  /**
   * Calculate N-gram similarity
   */
  calculateNgramSimilarity(code1, code2, n = 3) {
    if (!code1 || !code2) return 0;

    const ngrams1 = this.generateNgrams(code1, n);
    const ngrams2 = this.generateNgrams(code2, n);

    if (ngrams1.length === 0 || ngrams2.length === 0) return 0;

    const set1 = new Set(ngrams1);
    const set2 = new Set(ngrams2);
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);

    return union.size > 0 ? intersection.size / union.size : 0;
  }

  /**
   * Generate N-grams from code
   */
  generateNgrams(code, n) {
    if (!code || n <= 0) return [];
    
    const tokens = code.replace(/\s+/g, ' ').split(' ').filter(t => t.length > 0);
    const ngrams = [];

    for (let i = 0; i <= tokens.length - n; i++) {
      ngrams.push(tokens.slice(i, i + n).join(' '));
    }

    return ngrams;
  }

  /**
   * Find matching lines between two code blocks (optimized for speed)
   */
  findMatchingLines(code1, code2, maxMatches = 15) {
    if (!code1 || !code2) return [];

    const lines1 = code1.split('\n').map(line => line.trim()).filter(line => line.length > 3);
    const lines2 = code2.split('\n').map(line => line.trim()).filter(line => line.length > 3);
    
    const matches = [];
    const usedLines2 = new Set();
    
    // Limit the number of lines to check for performance
    const maxLinesToCheck = Math.min(lines1.length, 50);
    
    for (let i = 0; i < maxLinesToCheck && matches.length < maxMatches; i++) {
      const line1 = lines1[i];
      let bestMatch = null;
      let bestSimilarity = 0;
      let bestIndex = -1;
      
      // Limit lines2 check as well
      const maxLines2ToCheck = Math.min(lines2.length, 50);
      
      for (let j = 0; j < maxLines2ToCheck; j++) {
        if (usedLines2.has(j)) continue;
        
        const line2 = lines2[j];
        let similarity;
        
        // Check for exact matches first (fastest)
        if (line1 === line2) {
          similarity = 1.0;
        } else if (line1.length < 10 || line2.length < 10) {
          // Skip very short lines for similarity check
          continue;
        } else {
          similarity = stringSimilarity.compareTwoStrings(line1, line2);
        }
        
        if (similarity > bestSimilarity && similarity > 0.8) { // Increased threshold for speed
          bestSimilarity = similarity;
          bestMatch = line2;
          bestIndex = j;
        }
      }
      
      if (bestMatch && bestSimilarity > 0.8) {
        matches.push({
          lineA: i + 1,
          lineB: bestIndex + 1,
          code: line1,
          similarity: Math.round(bestSimilarity * 100 * 10) / 10
        });
        usedLines2.add(bestIndex);
      }
    }

    return matches.sort((a, b) => b.similarity - a.similarity);
  }

  /**
   * Detect plagiarism among multiple files with optimized performance
   */
  async detectPlagiarism(filesData) {
    if (!filesData || filesData.length < 2) {
      return [];
    }

    console.log(`🔍 Starting optimized plagiarism detection for ${filesData.length} files...`);

    // Clear caches at the start of each analysis
    this.clearCaches();

    // Step 1: Validate and process files in parallel batches for better performance
    const processedFiles = [];
    let skippedFiles = 0;
    const batchSize = 10; // Process 10 files at a time

    for (let i = 0; i < filesData.length; i += batchSize) {
      const batch = filesData.slice(i, i + batchSize);
      const batchPromises = batch.map(async (fileData) => {
        try {
          // First check if file exists
          if (!await fs.pathExists(fileData.file_path)) {
            console.error(`❌ File not found: ${fileData.file_path}`);
            return null;
          }

          // Check file size
          const stats = await fs.stat(fileData.file_path);
          if (stats.size === 0) {
            console.error(`❌ Empty file: ${fileData.file_path}`);
            return null;
          }

          const rawCode = await NotebookParser.extractCodeFromNotebook(fileData.file_path);
          
          if (!rawCode || rawCode.trim().length < 10) {
            console.error(`❌ No valid code extracted from: ${fileData.file_path}`);
            return null; // Skip invalid files
          }

          const normalizedCode = CodeNormalizer.normalizeCode(rawCode, this.normalizeVars);
          
          if (!normalizedCode || normalizedCode.trim().length < 5) {
            console.error(`❌ Code normalization failed for: ${fileData.file_path}`);
            return null; // Skip after normalization
          }

          const codeHash = this.calculateCodeHash(normalizedCode);
          
          // Check for duplicate hashes to avoid processing identical files multiple times
          if (this.codeHashes.has(codeHash)) {
            console.log(`⚠️ Duplicate file detected (same hash): ${fileData.file_path}`);
          } else {
            this.codeHashes.set(codeHash, fileData.file_path);
          }

          return {
            student_name: fileData.student_name,
            student_id: fileData.student_id,
            file_id: fileData.file_id,
            filename: fileData.filename || 'unknown',
            raw_code: rawCode,
            normalized_code: normalizedCode,
            upload_order: fileData.upload_order || 0,
            code_hash: codeHash,
            code_length: normalizedCode.length
          };
        } catch (error) {
          console.error(`❌ Error processing file ${fileData.file_path}:`, error.message);
          return null;
        }
      });

      const batchResults = await Promise.all(batchPromises);
      const validResults = batchResults.filter(result => result !== null);
      processedFiles.push(...validResults);
      skippedFiles += batchResults.length - validResults.length;

      console.log(`📊 Processed batch ${Math.floor(i/batchSize) + 1}: ${validResults.length} valid files`);
    }

    console.log(`📊 Total processed: ${processedFiles.length} files, skipped: ${skippedFiles} files`);

    if (processedFiles.length < 2) {
      console.log('❌ Not enough valid files for comparison');
      return [];
    }

    // Step 2: Optimized comparison with early termination
    const results = [];
    const totalComparisons = (processedFiles.length * (processedFiles.length - 1)) / 2;
    let completedComparisons = 0;

    // Limit comparisons for very large datasets - reduce to 50 files for speed
    const maxFiles = Math.min(processedFiles.length, 50); // Reduced from 100 to 50
    const filesToCompare = processedFiles.slice(0, maxFiles);

    console.log(`🔄 Comparing ${filesToCompare.length} files (${(filesToCompare.length * (filesToCompare.length - 1)) / 2} comparisons)...`);

    for (let i = 0; i < filesToCompare.length; i++) {
      for (let j = i + 1; j < filesToCompare.length; j++) {
        const fileA = filesToCompare[i];
        const fileB = filesToCompare[j];

        completedComparisons++;
        
        // Progress logging every 100 comparisons for less noise
        if (completedComparisons % 100 === 0) {
          console.log(`📈 Progress: ${completedComparisons}/${(filesToCompare.length * (filesToCompare.length - 1)) / 2} comparisons (${Math.round(completedComparisons/((filesToCompare.length * (filesToCompare.length - 1)) / 2)*100)}%)`);
        }

        let similarity;

        try {
          // Quick hash check for exact duplicates
          if (fileA.code_hash === fileB.code_hash) {
            similarity = 1.0;
          } else {
            // Quick length check for early termination - more aggressive filtering
            const lengthRatio = Math.min(fileA.code_length, fileB.code_length) / Math.max(fileA.code_length, fileB.code_length);
            if (lengthRatio < 0.3) { // Increased from 0.2 to 0.3 for better filtering
              continue; // Skip very different length files
            }
            
            similarity = this.calculateSimilarity(fileA.normalized_code, fileB.normalized_code);
          }

          // Only process if above threshold
          if (similarity >= this.threshold) {
            // Calculate matching lines only for results above threshold
            const matchingLines = this.findMatchingLines(
              fileA.normalized_code,
              fileB.normalized_code,
              10 // Reduced from 15 to 10 for speed
            );

            const result = {
              studentA: fileA.student_name,
              studentA_id: fileA.student_id,
              fileA_id: fileA.file_id,
              studentB: fileB.student_name,
              studentB_id: fileB.student_id,
              fileB_id: fileB.file_id,
              similarity: Math.round(similarity * 100 * 100) / 100,
              matching_lines: matchingLines,
              total_matches: matchingLines.length,
              code_length_a: fileA.code_length,
              code_length_b: fileB.code_length,
              is_exact_duplicate: fileA.code_hash === fileB.code_hash
            };

            results.push(result);
          }
        } catch (error) {
          console.error(`❌ Error comparing ${fileA.student_name} vs ${fileB.student_name}:`, error.message);
          continue;
        }
      }
    }

    // Sort by similarity (highest first)
    results.sort((a, b) => b.similarity - a.similarity);

    console.log(`✅ Optimized analysis complete! Found ${results.length} matches in ${completedComparisons} comparisons`);
    
    // Log summary statistics
    if (results.length > 0) {
      const avgSimilarity = results.reduce((sum, r) => sum + r.similarity, 0) / results.length;
      const maxSimilarity = results[0].similarity;
      const exactDuplicates = results.filter(r => r.is_exact_duplicate).length;
      
      console.log(`📊 Statistics:`);
      console.log(`   - Average similarity: ${avgSimilarity.toFixed(2)}%`);
      console.log(`   - Maximum similarity: ${maxSimilarity}%`);
      console.log(`   - Exact duplicates: ${exactDuplicates}`);
      console.log(`   - High similarity (>80%): ${results.filter(r => r.similarity > 80).length}`);
    }

    // Clear caches after analysis to free memory
    this.clearCaches();

    return results;
  }
}

// Export both classes for backward compatibility
module.exports = AdvancedPlagiarismDetector;
module.exports.PlagiarismDetector = AdvancedPlagiarismDetector;
module.exports.CodeNormalizer = CodeNormalizer;
module.exports.NotebookParser = NotebookParser;