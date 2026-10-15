---
name: domain-bva-generator
description: Use when designing test cases for software features, API endpoints, or user inputs using formal Domain Testing (Equivalence Partitioning) and Boundary Value Analysis (BVA) techniques.
---

# Domain Testing & Boundary Value Analysis (BVA) Generator Skill

This skill guides an AI agent through formal black-box test design using **Equivalence Partitioning (EP)** and **Boundary Value Analysis (BVA)** compliant with **ISTQB Foundation / Advanced Level (ISO/IEC/IEEE 29119-4)** standards.

---

## 1. When to Use This Skill

Activate this skill when:
- Designing test specifications for software requirements, user stories, or functional requirements (FR).
- Generating test suites for API request schemas, validation rules, or database models.
- Verifying numeric ranges, string lengths, date intervals, collections, or enumerated state transitions.
- Needing rigorous 2-point or 3-point Boundary Value Analysis.

---

## 2. Theoretical Grounding & Standards (ISTQB / ISO 29119-4)

### 2.1 Equivalence Partitioning (EP)
- **Concept**: Divide input domain and output ranges into disjoint subsets where all elements in a partition are processed equivalently by the System Under Test (SUT).
- **Partition Types**:
  - **Valid Equivalence Partitions (VEP)**: Inputs that the system is expected to process normally.
  - **Invalid Equivalence Partitions (IEP)**: Inputs that the system should reject, raise validation errors, or handle via fallback routines.
- **Rule of Non-Cumulative Faults**: When testing invalid partitions, test them **one at a time** (isolate 1 invalid partition per test case) so one invalid input does not mask another.

### 2.2 Boundary Value Analysis (BVA)
- **Concept**: Defects frequently cluster at boundaries of equivalence partitions rather than in interior centers.
- **2-Point BVA**:
  - **On-point**: Exactly on the boundary (Valid or Invalid depending on open/closed interval).
  - **Off-point**: Immediately adjacent to the boundary in the opposite partition (distance is unit of resolution $\epsilon$, e.g., $1$ for integer, $0.01$ for 2-decimal currency, 1 character for strings).
- **3-Point BVA**:
  - Used for critical or safety-sensitive systems, or when interval evaluation logic might introduce multi-side off-by-one errors.
  - Examines: `Boundary - 1`, `Boundary`, `Boundary + 1`.

---

## 3. Step-by-Step Execution Workflow for Agent

```
+-----------------------------------+
| Step 1: Input Analysis & Modeling |
+-----------------------------------+
                  │
                  ▼
+-------------------------------------+
| Step 2: Equivalence Partitioning    |
+-------------------------------------+
                  │
                  ▼
+-------------------------------------+
| Step 3: Boundary Value Analysis     |
+-------------------------------------+
                  │
                  ▼
+-------------------------------------+
| Step 4: Test Case Synthesis         |
+-------------------------------------+
                  │
                  ▼
+-------------------------------------+
| Step 5: Anti-Hallucination & Review |
+-------------------------------------+
```

### Step 1: Input Domain Extraction & Variable Typing
For the target feature/endpoint, identify every variable:
1. **Name** and **Data Type** (integer, float, string, boolean, enum, date, array/collection).
2. **Cardinality / Range** (e.g., $1 \le Qty \le 99$).
3. **Resolution / Precision ($\epsilon$)**:
   - Integer count: $\epsilon = 1$
   - Currency: $\epsilon = 0.01$
   - Text length: $\epsilon = 1$ character
4. **Dependencies & Preconditions**:
   - Is it independent or dependent on another state (e.g., stock level, authenticated role)?

### Step 2: Define Partitions
For each variable, define explicit disjoint sets:
- Label each partition: `<VAR>_VALID_01`, `<VAR>_INVALID_LOWER`, `<VAR>_INVALID_UPPER`, `<VAR>_INVALID_FORMAT`.
- Specify lower bound, upper bound, and typical interior value.

### Step 3: Identify Boundary Points
For ordered domains (numbers, lengths, dates):
- **2-point BVA**: Identify `On` and `Off` for each boundary.
- **3-point BVA**: Identify `On`, `Off_Inside`, `Off_Outside`.
- Explicitly state whether the boundary is inclusive $[a, b]$ or exclusive $(a, b)$.

### Step 4: Synthesize Test Cases
Compose test cases following the standard template:
- Combine valid partitions (Positive testing) to achieve 100% EP coverage efficiently.
- Test invalid partitions individually (Negative testing) to observe specific error handling.

### Step 5: Quality & Anti-Pitfall Checklist
Check off every item before presenting test cases to the user:
- [ ] No generic placeholders like `"valid string"` or `"invalid number"`.
- [ ] All inputs specify exact concrete values (e.g., `quantity: 0`, `quantity: 1`, `quantity: 99`, `quantity: 100`).
- [ ] Off-boundary distance reflects domain precision ($\epsilon = 1$ or $\epsilon = 0.01$).
- [ ] State preconditions and database context are explicitly documented.
- [ ] Expected status codes, error message strings, or UI alerts are defined.

---

## 4. Agent Pitfall Prevention Directives

| Pitfall | Why Agents Fail | Enforcement Directive |
| :--- | :--- | :--- |
| **Lazy Generic Inputs** | Outputting `test_string` instead of checking boundary length (e.g., 255 chars). | **MANDATORY**: Supply exact string length or literal string content. |
| **Missing Off-Boundary** | Testing only `100` instead of `99`, `100`, `101`. | **MANDATORY**: Always explicitly list `On` and `Off` with $\epsilon = \text{resolution}$. |
| **Ignoring Data Type Limits** | Omitting overflow, negatives, and fractional quantities. | **MANDATORY**: Include negative values (`-1`), zero (`0`), and type mismatch if applicable. |
| **Multi-Fault Masking** | Submitting 3 invalid fields in a single test case. | **MANDATORY**: Only **ONE** invalid input per test case to avoid masking errors. |
| **Ignoring Environmental State** | Testing cart quantity without specifying product available stock. | **MANDATORY**: Define precondition (e.g., "Available stock = 50"). |

---

## 5. Formal Test Case Table Template

Agents using this skill MUST produce Markdown output matching this table structure:

```markdown
| Test Case ID | Partition ID | BVA Type | Test Objective / Description | Preconditions | Inputs / Payload | Expected Output / Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| TC-FRXX-001 | VEP-01 | On-min | Min valid quantity (1) | SUT running, Stock >= 1 | `{"qty": 1}` | HTTP 200, item added |
| TC-FRXX-002 | IEP-LOW | Off-min | Sub-min quantity (0) | SUT running | `{"qty": 0}` | HTTP 400, "Qty must be >= 1" |
| TC-FRXX-003 | IEP-NEG | Interior | Negative quantity (-1) | SUT running | `{"qty": -1}` | HTTP 400, "Qty cannot be negative" |
| TC-FRXX-004 | VEP-01 | Interior | Typical valid quantity (5) | SUT running, Stock >= 5 | `{"qty": 5}` | HTTP 200, item added |
| TC-FRXX-005 | VEP-01 | On-max | Max valid quantity (99) | SUT running, Stock >= 99 | `{"qty": 99}` | HTTP 200, item added |
| TC-FRXX-006 | IEP-HIGH | Off-max | Super-max quantity (100) | SUT running | `{"qty": 100}` | HTTP 400, "Max limit 99 exceeded" |
```

---

## 6. CLI Tool Support

This skill includes an automated utility script located at `scripts/generate_test_cases.js`.
Agents can execute this script to deterministically generate EP partitions and BVA boundaries from a JSON specification:

```bash
# Run demonstration
node skills/domain-bva-generator/scripts/generate_test_cases.js --demo

# Generate from custom feature spec file
node skills/domain-bva-generator/scripts/generate_test_cases.js --input <spec.json> --format markdown
```
