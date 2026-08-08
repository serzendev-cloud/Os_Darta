// ========================================
// ESLint Baseline Verification & Regression Checker
// Traceability: CIP-WP-009 | AR-002, AR-008
// ========================================

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../');
const baselinePath = path.join(rootDir, '.eslint-baseline.json');

console.log('[BASELINE CHECK] Initializing ESLint Baseline Regression Audit...');

// ── 1. AR-008: Baseline Integrity Validations ─────────────────────────────────
if (!fs.existsSync(baselinePath)) {
  console.error('========================================');
  console.error('[FATAL ERROR] .eslint-baseline.json snapshot file not found!');
  console.error('Please generate baseline first using: npm run lint:baseline');
  console.error('========================================');
  process.exit(1);
}

let baselineData = null;
try {
  const fileContent = fs.readFileSync(baselinePath, 'utf-8');
  baselineData = JSON.parse(fileContent);
} catch (err) {
  console.error('========================================');
  console.error('[FATAL ERROR] .eslint-baseline.json is corrupted or unparseable JSON!');
  console.error(`Details: ${err.message}`);
  console.error('========================================');
  process.exit(1);
}

if (!baselineData || typeof baselineData.signatures !== 'object') {
  console.error('========================================');
  console.error('[FATAL ERROR] Invalid baseline schema structure in .eslint-baseline.json!');
  console.error('========================================');
  process.exit(1);
}

const baselineSignatures = baselineData.signatures || {};

// ── 2. Programmatically Run ESLint ───────────────────────────────────────────
let rawJson = '';
try {
  rawJson = execSync('npx eslint src tools --format=json', {
    cwd: rootDir,
    encoding: 'utf-8',
    maxBuffer: 50 * 1024 * 1024,
  });
} catch (error) {
  if (error.stdout) {
    rawJson = error.stdout;
  } else {
    console.error('[FATAL ERROR] Failed to execute ESLint audit command:', error.message);
    process.exit(1);
  }
}

let currentResults = [];
try {
  currentResults = JSON.parse(rawJson);
} catch (err) {
  console.error('[FATAL ERROR] Failed to parse current ESLint JSON output:', err.message);
  process.exit(1);
}

// ── 3. AR-002: Precision Tuple Signature Matching ───────────────────────────
let currentErrors = 0;
let currentWarnings = 0;
const currentSignatures = {};

currentResults.forEach((fileResult) => {
  const relativePath = path.relative(rootDir, fileResult.filePath).replace(/\\/g, '/');
  
  if (fileResult.messages && fileResult.messages.length > 0) {
    fileResult.messages.forEach((msg) => {
      const ruleId = msg.ruleId || 'syntax-error';
      const severity = msg.severity; // 1 = warning, 2 = error
      
      if (severity === 2) currentErrors++;
      if (severity === 1) currentWarnings++;

      const signatureKey = `${relativePath}::${ruleId}::${severity}`;
      currentSignatures[signatureKey] = (currentSignatures[signatureKey] || 0) + 1;
    });
  }
});

// Compare current signatures against baseline
const regressions = [];

Object.keys(currentSignatures).forEach((sigKey) => {
  const currentCount = currentSignatures[sigKey];
  const baselineCount = baselineSignatures[sigKey] || 0;

  if (currentCount > baselineCount) {
    const [filePath, ruleId, severityNum] = sigKey.split('::');
    const severityLabel = severityNum === '2' ? 'ERROR' : 'WARNING';
    regressions.push({
      filePath,
      ruleId,
      severityLabel,
      baselineCount,
      currentCount,
      diff: currentCount - baselineCount,
    });
  }
});

// ── 4. Audit Reporting & Exit Behavior ───────────────────────────────────────
if (regressions.length > 0) {
  console.error('\n❌ [BASELINE CHECK FAILED] Technical Debt Regressions Detected!\n');
  console.error('The following new lint errors or warnings exceed the approved baseline:\n');

  regressions.forEach((reg, index) => {
    console.error(
      ` ${index + 1}. [${reg.severityLabel}] ${reg.filePath}`
    );
    console.error(
      `    Rule: ${reg.ruleId} | Baseline: ${reg.baselineCount} -> Current: ${reg.currentCount} (+${reg.diff} new)`
    );
  });

  console.error('\n========================================');
  console.error('POLICY VIOLATION: Zero New Technical Debt Rule (CIP-WP-009)');
  console.error('Please fix the newly introduced lint errors/warnings listed above.');
  console.error('========================================\n');
  process.exit(1);
} else {
  console.log('\n✅ [BASELINE CHECK PASSED] No technical debt regressions detected!');
  console.log('========================================');
  console.log(`- Recorded Baseline Errors  : ${baselineData.totalErrors} | Current: ${currentErrors}`);
  console.log(`- Recorded Baseline Warnings: ${baselineData.totalWarnings} | Current: ${currentWarnings}`);
  
  const errorDiff = baselineData.totalErrors - currentErrors;
  const warningDiff = baselineData.totalWarnings - currentWarnings;
  if (errorDiff > 0 || warningDiff > 0) {
    console.log(`🎉 [DEBT REDUCTION DETECTED] Reduced ${errorDiff} errors and ${warningDiff} warnings!`);
    console.log('Ask Chief Architect to run "npm run lint:baseline" to ratchet down the baseline.');
  }
  console.log('========================================\n');
  process.exit(0);
}
