// ========================================
// ESLint Baseline Snapshot Generator
// Traceability: CIP-WP-009 | AR-004, AR-005
// ========================================

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../');
const baselinePath = path.join(rootDir, '.eslint-baseline.json');

console.log('[BASELINE GENERATOR] Scanning repository for historical ESLint debt...');

let rawJson = '';
try {
  // Execute ESLint in JSON format across src and tools directories
  rawJson = execSync('npx eslint src tools --format=json', {
    cwd: rootDir,
    encoding: 'utf-8',
    maxBuffer: 50 * 1024 * 1024, // 50MB buffer
  });
} catch (error) {
  // ESLint exits with code 1 if errors are found; stdout contains the JSON payload
  if (error.stdout) {
    rawJson = error.stdout;
  } else {
    console.error('[BASELINE GENERATOR] Fatal error running ESLint:', error.message);
    process.exit(1);
  }
}

let lintResults = [];
try {
  lintResults = JSON.parse(rawJson);
} catch (err) {
  console.error('[BASELINE GENERATOR] Failed to parse ESLint JSON output:', err.message);
  process.exit(1);
}

let totalErrors = 0;
let totalWarnings = 0;
const signatures = {};

lintResults.forEach((fileResult) => {
  const relativePath = path.relative(rootDir, fileResult.filePath).replace(/\\/g, '/');
  
  if (fileResult.messages && fileResult.messages.length > 0) {
    fileResult.messages.forEach((msg) => {
      const ruleId = msg.ruleId || 'syntax-error';
      const severity = msg.severity; // 1 = warning, 2 = error
      
      if (severity === 2) totalErrors++;
      if (severity === 1) totalWarnings++;

      const signatureKey = `${relativePath}::${ruleId}::${severity}`;
      signatures[signatureKey] = (signatures[signatureKey] || 0) + 1;
    });
  }
});

const baselineData = {
  version: '1.0',
  generatedAt: new Date().toISOString(),
  totalErrors,
  totalWarnings,
  signatures,
};

fs.writeFileSync(baselinePath, JSON.stringify(baselineData, null, 2), 'utf-8');

console.log('========================================');
console.log(`[BASELINE GENERATOR] Baseline successfully created/refreshed!`);
console.log(`- Baseline Location: ${baselinePath}`);
console.log(`- Historical Errors Recorded  : ${totalErrors}`);
console.log(`- Historical Warnings Recorded: ${totalWarnings}`);
console.log(`- Unique Signature Tuples     : ${Object.keys(signatures).length}`);
console.log('========================================');
