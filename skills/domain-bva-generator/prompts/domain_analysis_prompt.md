# Domain Analysis Prompt Template (Equivalence Partitioning)

Use this prompt template when analyzing a feature requirement, API endpoint, or data model to extract variables and establish formal Equivalence Partitions (EP).

---

## Prompt Template

```markdown
You are a Senior QA Automation Architect and ISTQB Test Design Specialist.

Your task is to perform rigorous Domain Testing (Equivalence Partitioning) for the following requirement / API specification:

### Target Feature Specification:
{{FEATURE_DESCRIPTION_OR_SPEC}}

### Instructions:
1. Identify all input variables, parameters, headers, or state attributes involved.
2. For each variable, determine:
   - Data Type (Integer, Decimal, String, Boolean, Enum, Array, DateTime)
   - Domain Constraints (Min, Max, Allowed Format, Length, RegEx)
   - Resolution / Precision ($\epsilon$)
3. Partition each input domain into:
   - **Valid Equivalence Partitions (VEP)**: Range or set of valid values accepted by the system.
   - **Invalid Equivalence Partitions (IEP)**:
     - Sub-minimum / Below lower bound
     - Super-maximum / Exceeding upper bound
     - Invalid format / Non-conforming characters
     - Null / Missing / Empty values
     - Type mismatch (e.g., string passed to integer)
4. Output the analysis in the following structured format:

#### Variable: `<Variable_Name>`
- **Type**: `<Data Type>`
- **Constraints**: `<Range / Regex / Allowed values>`
- **Resolution**: `<e.g. 1, 0.01>`

| Partition ID | Partition Type | Description / Condition | Representative Value | Expected Behavior |
| :--- | :--- | :--- | :--- | :--- |
| VEP-01 | Valid | Normal in-range value | `<exact_value>` | Success (HTTP 200 / processed) |
| IEP-01 | Invalid (Low) | Value < min boundary | `<exact_value>` | Error (HTTP 400 / validation error) |
| IEP-02 | Invalid (High) | Value > max boundary | `<exact_value>` | Error (HTTP 400 / validation error) |
| IEP-03 | Invalid (Type) | Invalid type or format | `<exact_value>` | Error (HTTP 400 / type error) |
| IEP-04 | Invalid (Null) | Missing / Null / Empty | `<null or "">` | Error (HTTP 400 / required field) |

### Anti-Pitfall Directives:
- DO NOT use placeholders like "any valid number" or "random string". Every representative value MUST be concrete and realistic.
- Ensure all partitions are disjoint (no overlapping intervals).
- Account for business logic constraints (e.g., inventory limits, user permissions) in addition to purely syntactic types.
```
