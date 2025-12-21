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
   * Calculate similarity between two code strings using multiple advanced methods
   */
  calculateSimilarity(code1, code2) {
    if (!code1 || !code2) return 0;
    if (code1.trim() === code2.trim()) return 1.0;

    try {
      // Method 1: String similarity (Dice coefficient)
      const stringSim = stringSimilarity.compareTwoStrings(code1, code2);

      // Method 2: Token-based similarity
      const tokenizer = new natural.WordTokenizer();
      const tokens1 = tokenizer.tokenize(code1.toLowerCase()) || [];
      const tokens2 = tokenizer.tokenize(code2.toLowerCase()) || [];
      
      if (tokens1.length === 0 || tokens2.length === 0) return stringSim;
      
      const set1 = new Set(tokens1);
      const set2 = new Set(tokens2);
      const intersection = new Set([...set1].filter(x => set2.has(x)));
      const union = new Set([...set1, ...set2]);
      
      const jaccardSim = union.size > 0 ? intersection.size / union.size : 0;

      // Method 3: Line-based similarity with improved matching
      const lines1 = code1.split('\n').filter(line => line.trim().length > 2);
      const lines2 = code2.split('\n').filter(line => line.trim().length > 2);
      
      let matchingLines = 0;
      const totalLines = Math.max(lines1.length, lines2.length);
      
      if (totalLines > 0) {
        for (const line1 of lines1) {
          let bestMatch = 0;
          for (const line2 of lines2) {
            const lineSim = stringSimilarity.compareTwoStrings(line1.trim(), line2.trim());
            bestMatch = Math.max(bestMatch, lineSim);
          }
          if (bestMatch > 0.7) {
            matchingLines++;
          }
        }
      }
      
      const lineSim = totalLines > 0 ? matchingLines / totalLines : 0;

      // Method 4: Structural similarity
      const structuralSim = this.calculateStructuralSimilarity(code1, code2);

      // Method 5: N-gram similarity
      const ngramSim = this.calculateNgramSimilarity(code1, code2);

      // Combine similarities with optimized weights
      const combinedSimilarity = (
        stringSim * 0.25 +
        jaccardSim * 0.20 +
        lineSim * 0.25 +
        structuralSim * 0.20 +
        ngramSim * 0.10
      );
      
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
   * Find matching lines between two code blocks with improved accuracy
   */
  findMatchingLines(code1, code2, maxMatches = 30) {
    if (!code1 || !code2) return [];

    const lines1 = code1.split('\n').map(line => line.trim()).filter(line => line.length > 2);
    const lines2 = code2.split('\n').map(line => line.trim()).filter(line => line.length > 2);
    
    const matches = [];
    const usedLines2 = new Set();
    
    for (let i = 0; i < lines1.length && matches.length < maxMatches; i++) {
      const line1 = lines1[i];
      let bestMatch = null;
      let bestSimilarity = 0;
      let bestIndex = -1;
      
      for (let j = 0; j < lines2.length; j++) {
        if (usedLines2.has(j)) continue;
        
        const line2 = lines2[j];
        let similarity;
        
        // Check for exact matches first
        if (line1 === line2) {
          similarity = 1.0;
        } else {
          similarity = stringSimilarity.compareTwoStrings(line1, line2);
        }
        
        if (similarity > bestSimilarity && similarity > 0.75) {
          bestSimilarity = similarity;
          bestMatch = line2;
          bestIndex = j;
        }
      }
      
      if (bestMatch && bestSimilarity > 0.75) {
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
   * Detect plagiarism among multiple files with improved algorithm
   */
  async detectPlagiarism(filesData) {
    if (!filesData || filesData.length < 2) {
      return [];
    }

    console.log(`🔍 Starting plagiarism detection for ${filesData.length} files...`);

    // Step 1: Process all files and extract codes
    const processedFiles = [];
    let skippedFiles = 0;

    for (const fileData of filesData) {
      try {
        console.log(`📄 Processing file: ${fileData.file_path}`);
        
        const rawCode = await NotebookParser.extractCodeFromNotebook(fileData.file_path);
        
        if (!rawCode || rawCode.trim().length < 10) { // Lowered from 50 to 10
          console.log(`⚠️ Skipping file with insufficient code: ${fileData.file_path} (${rawCode ? rawCode.length : 0} chars)`);
          skippedFiles++;
          continue;
        }

        const normalizedCode = CodeNormalizer.normalizeCode(rawCode, this.normalizeVars);
        
        if (!normalizedCode || normalizedCode.trim().length < 5) { // Lowered from 20 to 5
          console.log(`⚠️ Skipping file after normalization: ${fileData.file_path} (${normalizedCode ? normalizedCode.length : 0} chars)`);
          skippedFiles++;
          continue;
        }

        processedFiles.push({
          student_name: fileData.student_name,
          student_id: fileData.student_id,
          file_id: fileData.file_id,
          filename: fileData.filename || 'unknown',
          raw_code: rawCode,
          normalized_code: normalizedCode,
          upload_order: fileData.upload_order || 0,
          code_hash: this.calculateCodeHash(normalizedCode),
          code_length: normalizedCode.length
        });

        console.log(`✅ Processed: ${fileData.student_name} (${normalizedCode.length} chars)`);
      } catch (error) {
        console.error(`❌ Error processing file ${fileData.file_path}:`, error.message);
        skippedFiles++;
        continue;
      }
    }

    console.log(`📊 Processed ${processedFiles.length} files, skipped ${skippedFiles} files`);

    if (processedFiles.length < 2) {
      console.log('❌ Not enough valid files for comparison');
      return [];
    }

    console.log(`🔄 Calculating similarities for ${processedFiles.length} files...`);

    // Step 2: Compare all pairs with progress tracking
    const results = [];
    const totalComparisons = (processedFiles.length * (processedFiles.length - 1)) / 2;
    let completedComparisons = 0;

    for (let i = 0; i < processedFiles.length; i++) {
      for (let j = i + 1; j < processedFiles.length; j++) {
        const fileA = processedFiles[i];
        const fileB = processedFiles[j];

        completedComparisons++;
        if (completedComparisons % 10 === 0) {
          console.log(`📈 Progress: ${completedComparisons}/${totalComparisons} comparisons`);
        }

        let similarity;

        try {
          // Check for exact duplicates first
          if (fileA.code_hash === fileB.code_hash) {
            similarity = 1.0;
            console.log(`🎯 Exact duplicate found: ${fileA.student_name} vs ${fileB.student_name}`);
          } else {
            similarity = this.calculateSimilarity(fileA.normalized_code, fileB.normalized_code);
          }

          // Lower threshold for debugging - show all comparisons above 10%
          const debugThreshold = Math.min(this.threshold, 0.1);
          
          if (similarity >= debugThreshold) {
            // Calculate matching lines for cases above threshold
            let matchingLines = [];
            if (similarity > 0.1) { // Very low threshold for line matching
              matchingLines = this.findMatchingLines(
                fileA.normalized_code,
                fileB.normalized_code,
                30
              );
            }

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

            // Only add to results if above the actual threshold
            if (similarity >= this.threshold) {
              results.push(result);
            }
            
            console.log(`🔍 Comparison: ${fileA.student_name} vs ${fileB.student_name} (${result.similarity}%) ${similarity >= this.threshold ? '✅ MATCH' : '❌ Below threshold'}`);
          } else {
            // Log low similarity for debugging
            console.log(`🔍 Low similarity: ${fileA.student_name} vs ${fileB.student_name} (${Math.round(similarity * 100 * 100) / 100}%)`);
          }
        } catch (error) {
          console.error(`❌ Error comparing ${fileA.student_name} vs ${fileB.student_name}:`, error.message);
          continue;
        }
      }
    }

    // Sort by similarity (highest first)
    results.sort((a, b) => b.similarity - a.similarity);

    console.log(`✅ Analysis complete! Found ${results.length} potential matches out of ${totalComparisons} comparisons`);
    
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
      console.log(`   - Medium similarity (50-80%): ${results.filter(r => r.similarity >= 50 && r.similarity <= 80).length}`);
    } else {
      console.log(`⚠️ No matches found above threshold ${this.threshold * 100}%`);
      console.log(`📋 Processed files summary:`);
      processedFiles.forEach((file, index) => {
        console.log(`   ${index + 1}. ${file.student_name}: ${file.code_length} chars`);
      });
    }

    return results;
  }
}

// Export both classes for backward compatibility
module.exports = AdvancedPlagiarismDetector;
module.exports.PlagiarismDetector = AdvancedPlagiarismDetector;
module.exports.CodeNormalizer = CodeNormalizer;
module.exports.NotebookParser = NotebookParser;