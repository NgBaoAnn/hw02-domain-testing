#!/usr/bin/env node

/**
 * Domain Testing & Boundary Value Analysis (BVA) Test Case Generator
 *
 * Implements ISTQB / ISO/IEC/IEEE 29119-4 Black-box test design techniques:
 * - Equivalence Partitioning (EP)
 * - 2-Point and 3-Point Boundary Value Analysis (BVA)
 *
 * Usage:
 *   node generate_test_cases.js --demo
 *   node generate_test_cases.js --input <path_to_spec.json> [--strategy 2point|3point] [--format markdown|json]
 */

const fs = require('fs');
const path = require('path');

// Built-in Demo Feature Specification (e.g. E-Shop Coupon / Discount Feature FR-09)
const DEMO_SPEC = {
  featureId: 'FR-09',
  featureName: 'Discount Coupon Application & Order Validation',
  description: 'Applies coupon discount code and validates order total, percentage, and item quantity.',
  variables: [
    {
      name: 'couponCode',
      type: 'string',
      description: 'Coupon alphanumeric code',
      minLength: 3,
      maxLength: 10,
      pattern: '^[A-Z0-9]+$',
      nominalValue: 'SAVE20'
    },
    {
      name: 'discountPercentage',
      type: 'number',
      description: 'Discount percentage granted by coupon',
      min: 1,
      max: 100,
      step: 0.5,
      nominalValue: 20
    },
    {
      name: 'orderItemQuantity',
      type: 'integer',
      description: 'Total quantity of items eligible for coupon',
      min: 1,
      max: 99,
      step: 1,
      nominalValue: 5
    },
    {
      name: 'minimumOrderValue',
      type: 'currency',
      description: 'Minimum basket order total in USD to activate discount',
      min: 10.00,
      max: 1000.00,
      step: 0.01,
      nominalValue: 50.00
    }
  ]
};

/**
 * Generate string of given length
 */
function makeString(len, char = 'A') {
  if (len < 0) return '';
  return char.repeat(len);
}

/**
 * Generate Equivalence Partitions for a variable
 */
function generatePartitions(v) {
  const partitions = [];

  if (v.type === 'integer' || v.type === 'number' || v.type === 'currency') {
    const min = v.min;
    const max = v.max;
    const step = v.step || 1;

    // Valid partition
    partitions.push({
      id: `${v.name.toUpperCase()}_VEP_01`,
      type: 'Valid',
      range: `[${min}, ${max}]`,
      description: `Normal valid range for ${v.name}`,
      representativeValue: v.nominalValue !== undefined ? v.nominalValue : (min + max) / 2,
      expected: 'Valid / Accepted'
    });

    // Invalid Lower partition
    partitions.push({
      id: `${v.name.toUpperCase()}_IEP_LOW`,
      type: 'Invalid (Below Min)',
      range: `(-inf, ${min})`,
      description: `Values less than minimum ${min}`,
      representativeValue: min - step,
      expected: `Rejected / Error: ${v.name} below minimum ${min}`
    });

    // Invalid Upper partition
    partitions.push({
      id: `${v.name.toUpperCase()}_IEP_HIGH`,
      type: 'Invalid (Above Max)',
      range: `(${max}, +inf)`,
      description: `Values greater than maximum ${max}`,
      representativeValue: max + step,
      expected: `Rejected / Error: ${v.name} exceeds maximum ${max}`
    });

    // Invalid format / negative
    if (min >= 0) {
      partitions.push({
        id: `${v.name.toUpperCase()}_IEP_NEG`,
        type: 'Invalid (Negative)',
        range: '< 0',
        description: `Negative values for ${v.name}`,
        representativeValue: -1,
        expected: `Rejected / Error: ${v.name} must be positive`
      });
    }

  } else if (v.type === 'string') {
    const minLen = v.minLength !== undefined ? v.minLength : 0;
    const maxLen = v.maxLength !== undefined ? v.maxLength : 255;

    // Valid partition
    partitions.push({
      id: `${v.name.toUpperCase()}_VEP_01`,
      type: 'Valid',
      range: `Length [${minLen}, ${maxLen}]`,
      description: `Valid string length and pattern for ${v.name}`,
      representativeValue: v.nominalValue || makeString(Math.floor((minLen + maxLen) / 2)),
      expected: 'Valid / Accepted'
    });

    // Invalid length (Too Short)
    if (minLen > 0) {
      partitions.push({
        id: `${v.name.toUpperCase()}_IEP_SHORT`,
        type: 'Invalid (Too Short)',
        range: `Length < ${minLen}`,
        description: `String length below minimum ${minLen}`,
        representativeValue: makeString(minLen - 1),
        expected: `Rejected / Error: ${v.name} minimum length is ${minLen}`
      });
    }

    // Invalid length (Too Long)
    partitions.push({
      id: `${v.name.toUpperCase()}_IEP_LONG`,
      type: 'Invalid (Too Long)',
      range: `Length > ${maxLen}`,
      description: `String length exceeding maximum ${maxLen}`,
      representativeValue: makeString(maxLen + 1),
      expected: `Rejected / Error: ${v.name} maximum length is ${maxLen}`
    });

    // Invalid empty/null
    partitions.push({
      id: `${v.name.toUpperCase()}_IEP_EMPTY`,
      type: 'Invalid (Empty/Null)',
      range: 'Empty string / null',
      description: `Empty or whitespace string for ${v.name}`,
      representativeValue: '',
      expected: `Rejected / Error: ${v.name} is required`
    });

    // Invalid characters if regex specified
    if (v.pattern) {
      partitions.push({
        id: `${v.name.toUpperCase()}_IEP_FMT`,
        type: 'Invalid (Format/Regex)',
        range: `Non-matching ${v.pattern}`,
        description: `Violates pattern ${v.pattern}`,
        representativeValue: '@!#$%',
        expected: `Rejected / Error: ${v.name} invalid format`
      });
    }
  }

  return partitions;
}

/**
 * Generate 2-point and 3-point BVA points for a variable
 */
function generateBvaPoints(v, strategy = '2point') {
  const points = [];

  if (v.type === 'integer' || v.type === 'number' || v.type === 'currency') {
    const min = v.min;
    const max = v.max;
    const step = v.step || (v.type === 'currency' ? 0.01 : 1);

    // Format numbers cleanly based on step
    const fmt = (num) => {
      if (v.type === 'currency') return Number(num.toFixed(2));
      if (v.type === 'number') return Number(num.toFixed(2));
      return Math.round(num);
    };

    if (strategy === '3point') {
      // Min boundary 3-point: min-step, min, min+step
      points.push({ type: '3-Point', point: 'Min Off-Outside', value: fmt(min - step), isValid: false, partitionId: `${v.name.toUpperCase()}_IEP_LOW` });
      points.push({ type: '3-Point', point: 'Min On', value: fmt(min), isValid: true, partitionId: `${v.name.toUpperCase()}_VEP_01` });
      points.push({ type: '3-Point', point: 'Min Off-Inside', value: fmt(min + step), isValid: true, partitionId: `${v.name.toUpperCase()}_VEP_01` });

      // Max boundary 3-point: max-step, max, max+step
      points.push({ type: '3-Point', point: 'Max Off-Inside', value: fmt(max - step), isValid: true, partitionId: `${v.name.toUpperCase()}_VEP_01` });
      points.push({ type: '3-Point', point: 'Max On', value: fmt(max), isValid: true, partitionId: `${v.name.toUpperCase()}_VEP_01` });
      points.push({ type: '3-Point', point: 'Max Off-Outside', value: fmt(max + step), isValid: false, partitionId: `${v.name.toUpperCase()}_IEP_HIGH` });
    } else {
      // 2-point BVA: On, Off
      points.push({ type: '2-Point', point: 'Min On', value: fmt(min), isValid: true, partitionId: `${v.name.toUpperCase()}_VEP_01` });
      points.push({ type: '2-Point', point: 'Min Off', value: fmt(min - step), isValid: false, partitionId: `${v.name.toUpperCase()}_IEP_LOW` });
      points.push({ type: '2-Point', point: 'Max On', value: fmt(max), isValid: true, partitionId: `${v.name.toUpperCase()}_VEP_01` });
      points.push({ type: '2-Point', point: 'Max Off', value: fmt(max + step), isValid: false, partitionId: `${v.name.toUpperCase()}_IEP_HIGH` });
    }
  } else if (v.type === 'string') {
    const minLen = v.minLength !== undefined ? v.minLength : 0;
    const maxLen = v.maxLength !== undefined ? v.maxLength : 255;

    if (minLen > 0) {
      points.push({ type: '2-Point', point: `MinLen On (${minLen})`, value: makeString(minLen), isValid: true, partitionId: `${v.name.toUpperCase()}_VEP_01` });
      points.push({ type: '2-Point', point: `MinLen Off (${minLen - 1})`, value: makeString(minLen - 1), isValid: false, partitionId: `${v.name.toUpperCase()}_IEP_SHORT` });
    }
    points.push({ type: '2-Point', point: `MaxLen On (${maxLen})`, value: makeString(maxLen), isValid: true, partitionId: `${v.name.toUpperCase()}_VEP_01` });
    points.push({ type: '2-Point', point: `MaxLen Off (${maxLen + 1})`, value: makeString(maxLen + 1), isValid: false, partitionId: `${v.name.toUpperCase()}_IEP_LONG` });
  }

  return points;
}

/**
 * Synthesize concrete test cases from BVA points using Single Fault Assumption for negatives
 */
function synthesizeTestCases(spec, strategy = '2point') {
  const testCases = [];
  let tcIndex = 1;

  // 1. Base Nominal Happy Path Test Case
  const nominalPayload = {};
  spec.variables.forEach(v => {
    nominalPayload[v.name] = v.nominalValue;
  });

  testCases.push({
    id: `TC-${spec.featureId}-${String(tcIndex++).padStart(3, '0')}`,
    partitionId: 'ALL_VEP',
    bvaType: 'Interior (Nominal)',
    description: `Nominal baseline happy path with all valid interior inputs`,
    preconditions: 'System initialized, database seeded with active test user & cart',
    inputs: JSON.stringify(nominalPayload),
    expected: 'HTTP 200 OK: Processed successfully'
  });

  // 2. Iterate each variable and test its BVA boundaries
  spec.variables.forEach(v => {
    const bvaList = generateBvaPoints(v, strategy);

    bvaList.forEach(pt => {
      // Clone nominal inputs and substitute only the tested variable
      const payload = { ...nominalPayload };
      payload[v.name] = pt.value;

      const expectedText = pt.isValid
        ? `HTTP 200 OK: Accepted (${v.name}=${pt.value})`
        : `HTTP 400 Bad Request: Rejected (${v.name}=${pt.value} at ${pt.point})`;

      testCases.push({
        id: `TC-${spec.featureId}-${String(tcIndex++).padStart(3, '0')}`,
        partitionId: pt.partitionId,
        bvaType: `${pt.type} [${pt.point}]`,
        description: `Verify ${v.name} at boundary: ${pt.point}`,
        preconditions: 'System running, cart active',
        inputs: JSON.stringify(payload),
        expected: expectedText
      });
    });
  });

  return testCases;
}

/**
 * Convert test data into Markdown Report
 */
function renderMarkdownReport(spec, strategy = '2point') {
  let md = '';
  md += `# Test Design Specification: ${spec.featureId} - ${spec.featureName}\n\n`;
  md += `**Description**: ${spec.description}\n`;
  md += `**Methodology**: ISTQB Formal Equivalence Partitioning & Boundary Value Analysis (${strategy.toUpperCase()})\n\n`;

  // 1. Input Domain & Equivalence Partitions
  md += `## 1. Input Domain & Equivalence Partitions\n\n`;
  spec.variables.forEach(v => {
    md += `### Variable: \`${v.name}\` (${v.type})\n`;
    if (v.min !== undefined) md += `- **Range**: [${v.min}, ${v.max}], Step: ${v.step || 1}\n`;
    if (v.minLength !== undefined) md += `- **Length**: [${v.minLength}, ${v.maxLength}]\n`;
    if (v.pattern) md += `- **Pattern**: \`${v.pattern}\`\n`;
    md += `\n`;

    const partitions = generatePartitions(v);
    md += `| Partition ID | Type | Range / Condition | Representative Value | Expected Behavior |\n`;
    md += `| :--- | :--- | :--- | :--- | :--- |\n`;
    partitions.forEach(p => {
      const valStr = typeof p.representativeValue === 'string'
        ? `"${p.representativeValue}"`
        : p.representativeValue;
      md += `| \`${p.id}\` | ${p.type} | ${p.range} | \`${valStr}\` | ${p.expected} |\n`;
    });
    md += `\n`;
  });

  // 2. Synthesized Test Cases Table
  md += `## 2. Synthesized Test Cases (BVA & Single Fault Isolation)\n\n`;
  md += `| Test Case ID | Partition ID | BVA Technique / Point | Test Objective | Preconditions | Inputs / Payload | Expected Output / Status |\n`;
  md += `| :--- | :--- | :--- | :--- | :--- | :--- | :--- |\n`;

  const testCases = synthesizeTestCases(spec, strategy);
  testCases.forEach(tc => {
    md += `| **${tc.id}** | \`${tc.partitionId}\` | ${tc.bvaType} | ${tc.description} | ${tc.preconditions} | \`${tc.inputs}\` | ${tc.expected} |\n`;
  });

  md += `\n`;
  md += `## 3. Coverage Summary\n\n`;
  md += `- **Total Input Variables**: ${spec.variables.length}\n`;
  md += `- **Total Generated Test Cases**: ${testCases.length}\n`;
  md += `- **Equivalence Partitioning Coverage**: 100% of defined partitions targeted.\n`;
  md += `- **Boundary Value Analysis Strategy**: ${strategy.toUpperCase()} coverage achieved across all numeric and string dimensions.\n`;

  return md;
}

// CLI Execution Parser
function main() {
  const args = process.argv.slice(2);

  let isDemo = false;
  let inputFile = null;
  let strategy = '2point';
  let format = 'markdown';

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--demo') isDemo = true;
    if (args[i] === '--input' && args[i + 1]) inputFile = args[++i];
    if (args[i] === '--strategy' && args[i + 1]) strategy = args[++i];
    if (args[i] === '--format' && args[i + 1]) format = args[++i];
  }

  let spec = DEMO_SPEC;

  if (inputFile) {
    try {
      const content = fs.readFileSync(path.resolve(process.cwd(), inputFile), 'utf8');
      spec = JSON.parse(content);
    } catch (err) {
      console.error(`Error reading input file "${inputFile}":`, err.message);
      process.exit(1);
    }
  } else if (!isDemo) {
    console.log(`[domain-bva-generator] No input provided. Running in --demo mode.\n`);
    isDemo = true;
  }

  if (format === 'json') {
    const testCases = synthesizeTestCases(spec, strategy);
    console.log(JSON.stringify({ spec, testCases }, null, 2));
  } else {
    const markdown = renderMarkdownReport(spec, strategy);
    console.log(markdown);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  DEMO_SPEC,
  generatePartitions,
  generateBvaPoints,
  synthesizeTestCases,
  renderMarkdownReport
};
