/**
 * Validates Dutch content JSON files before CI/deployment.
 *
 * Exits with code 1 if safety-critical fields still contain [PLACEHOLDER].
 * Run: tsx scripts/validate-content.ts
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

const ROOT = resolve(fileURLToPath(import.meta.url), '..', '..');

interface ValidationResult {
  file: string;
  field: string;
  value: string;
}

const failures: ValidationResult[] = [];

function check(file: string, field: string, value: unknown) {
  if (typeof value === 'string' && value.includes('[PLACEHOLDER')) {
    failures.push({ file, field, value: value.slice(0, 80) });
  }
}

// ── Safety-critical files ─────────────────────────────────────────────────────

// 1. Crisis content must be complete
const crisis = JSON.parse(readFileSync(resolve(ROOT, 'src/content/nl/crisis.json'), 'utf8'));
check('crisis.json', 'disclaimer.body', crisis.disclaimer?.body);
check('crisis.json', 'safetyBlock.body', crisis.safetyBlock?.body);

// 2. Emergency grounding exercise must have real steps
const grounding = JSON.parse(
  readFileSync(resolve(ROOT, 'src/content/nl/exercises/emergency-grounding.json'), 'utf8'),
);
for (const step of grounding.steps ?? []) {
  check('emergency-grounding.json', `step.${step.id}.instruction`, step.instruction);
}
check('emergency-grounding.json', 'transcript', grounding.transcript);

// 3. Intake safety check must have questions (not empty array)
const intake = JSON.parse(readFileSync(resolve(ROOT, 'src/content/nl/intake.json'), 'utf8'));
if (!Array.isArray(intake.safetyCheck?.questions) || intake.safetyCheck.questions.length === 0) {
  failures.push({
    file: 'intake.json',
    field: 'safetyCheck.questions',
    value: 'EMPTY — safety check has no screening questions',
  });
}

// ── Report ────────────────────────────────────────────────────────────────────

if (failures.length > 0) {
  process.stderr.write('\n❌ Content validation failed — safety-critical placeholders remain:\n\n');
  for (const f of failures) {
    process.stderr.write(`  ${f.file}  [${f.field}]\n  "${f.value}"\n\n`);
  }
  process.exit(1);
} else {
  process.stdout.write('✓ Content validation passed\n');
}
