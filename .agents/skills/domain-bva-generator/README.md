# Reusable Agent Skill: Domain Testing & Boundary Value Analysis (BVA) Generator

Compliant with **agentskills.io**, **OpenCode**, and **Claude Code** standards.  
Implements formal black-box test design techniques under **ISTQB Foundation / Advanced (ISO/IEC/IEEE 29119-4)**.

---

## 1. Overview & Architecture

The **Domain & BVA Generator** is a plug-and-play Agent Skill that equips AI coding assistants and autonomous QA agents with deterministic, standards-compliant test design capabilities.

```
                   Target Feature / API Spec
                               │
                               ▼
            ┌──────────────────────────────────────┐
            │   Domain & BVA Generator Skill       │
            ├──────────────────────────────────────┤
            │  1. Input Variable Extraction        │
            │  2. Disjoint Equivalence Partitions  │
            │  3. 2-Point & 3-Point BVA Offsets    │
            │  4. Single Fault Assumption Matrix   │
            └──────────────────┬───────────────────┘
                               │
                               ▼
        Synthesized Test Case Table (Markdown / JSON)
        Ready for Manual Execution or Playwright/Jest Code-Gen
```

### Key Capabilities:
- **Formal Equivalence Partitioning (EP)**: Partitions numeric, string, currency, and date variables into Valid (VEP) and Invalid (IEP) sets.
- **2-Point & 3-Point Boundary Value Analysis (BVA)**: Generates exact On-points and Off-points according to domain precision $\epsilon$ ($1$ for integers, $0.01$ for currency, $1$ char for strings).
- **Anti-Hallucination Guardrails**: Prevents generic placeholders (`"test_string"`) and multi-fault masking (ensures strictly 1 invalid input per negative test case).
- **Executable CLI Companion**: Deterministic generation engine (`scripts/generate_test_cases.js`).

---

## 2. Directory Structure

```
skills/domain-bva-generator/
├── SKILL.md                          # Agent Skill Definition & Workflow Directives
├── README.md                         # Documentation, Reusability Guide & YouTube Script
├── prompts/
│   ├── domain_analysis_prompt.md     # Equivalence Partitioning extraction prompt
│   └── bva_analysis_prompt.md        # Boundary computation & test synthesis prompt
└── scripts/
    └── generate_test_cases.js        # Executable generator CLI script
```

---

## 3. Installation & Loading Guide

### 3.1 Loading into OpenCode
In OpenCode, the skill is automatically discovered if placed in `skills/domain-bva-generator` or user skills directory:
```bash
# In OpenCode chat:
Load skill domain-bva-generator
```

### 3.2 Loading into Claude Code
Place the skill into your project's `.claude/skills/` directory:
```bash
mkdir -p .claude/skills
cp -r skills/domain-bva-generator .claude/skills/
```

### 3.3 Standalone CLI Usage
The skill includes a standalone generator script:
```bash
# Run demo feature (Discount Coupon FR-09)
node skills/domain-bva-generator/scripts/generate_test_cases.js --demo

# Run 3-Point BVA for higher safety-critical coverage
node skills/domain-bva-generator/scripts/generate_test_cases.js --demo --strategy 3point

# Run against custom JSON spec
node skills/domain-bva-generator/scripts/generate_test_cases.js --input my_feature_spec.json --format markdown
```

---

## 4. Reusability Demonstration: Feature FR-01 (User Registration)

To prove reusability across any arbitrary feature, create a JSON specification for **User Registration (FR-01)**:

### `user_registration_spec.json`:
```json
{
  "featureId": "FR-01",
  "featureName": "User Registration",
  "description": "Validates username, password length, and age eligibility for registration.",
  "variables": [
    {
      "name": "username",
      "type": "string",
      "minLength": 4,
      "maxLength": 20,
      "pattern": "^[a-zA-Z0-9_]+$",
      "nominalValue": "john_doe"
    },
    {
      "name": "password",
      "type": "string",
      "minLength": 8,
      "maxLength": 32,
      "nominalValue": "Passw0rd123!"
    },
    {
      "name": "age",
      "type": "integer",
      "min": 18,
      "max": 120,
      "step": 1,
      "nominalValue": 25
    }
  ]
}
```

### Execution:
```bash
node skills/domain-bva-generator/scripts/generate_test_cases.js --input user_registration_spec.json
```

---

## 5. End-to-End YouTube Demonstration Video Script

- **Demo Video URL**: `https://youtu.be/DEMO_DOMAIN_BVA_SKILL_PLACEHOLDER` *(Replace with final link)*
- **Target Duration**: ~3:30 - 4:00 minutes
- **Resolution**: 1080p 60fps

### Storyboard & Voiceover Table:

| Timecode | On-Screen Action | Voiceover Audio (Script) |
| :--- | :--- | :--- |
| **00:00 - 00:30** | Display title slide: *"ISTQB Domain Testing & BVA Agent Skill"*. Show assignment requirements (HW02 Section 7 & 15). | *"Xin chào thầy và các bạn. Hôm nay tôi sẽ trình diễn Agent Skill tự động thiết kế kiểm thử Domain Testing và Boundary Value Analysis theo tiêu chuẩn ISTQB, được đóng gói để tái sử dụng trên bất kỳ tính năng phần mềm nào."* |
| **00:30 - 01:00** | Open VS Code / terminal. Inspect `SKILL.md` and prompt templates. Highlight the anti-hallucination rules and disjoint partition requirements. | *"Skill này gồm file `SKILL.md` định nghĩa quy trình 5 bước nghiêm ngặt, 2 prompt templates cho phân vùng tương đương và phân tích biên, cùng script tự động hóa. Đặc biệt, skill loại bỏ hoàn toàn các lỗi phổ biến của AI như tạo test case chung chung hoặc vi phạm nguyên lý Single Fault Assumption."* |
| **01:00 - 01:45** | Run `node skills/domain-bva-generator/scripts/generate_test_cases.js --demo`. Show terminal output printing formatted Markdown tables for Coupon Application (FR-09). | *"Bây giờ chúng ta chạy thử nghiệm trên tính năng Coupon và Giảm giá FR-09. Script lập tức phân tích 4 biến đầu vào: mã coupon, tỷ lệ giảm giá, số lượng sản phẩm, và giá trị đơn hàng tối thiểu. Mọi giá trị biên On-point và Off-point với độ phân giải epsilon 1 và 0.01 được tính toán chính xác."* |
| **01:45 - 02:30** | Switch to `--strategy 3point`. Show 3-point BVA points (`Min-1`, `Min`, `Min+1`) for safety-critical domain testing. | *"Với các tính năng yêu cầu độ tin cậy cao, chúng ta kích hoạt 3-Point BVA. Hệ thống tự động sinh 23 test case kiểm tra toàn diện cả 3 điểm biên trong, tại biên và ngoài biên."* |
| **02:30 - 03:00** | Create a quick JSON file for `User Registration (FR-01)`. Run script with `--input registration.json`. Output updates instantly. | *"Điểm mạnh nhất là tính Reusable - Tái sử dụng. Chỉ cần cung cấp schema cho tính năng Đăng ký người dùng (User Registration), Agent Skill lập tức sinh ngay bộ test case chuẩn cho độ dài username, password và biên tuổi từ 18 đến 120."* |
| **03:00 - 03:30** | Show generated Markdown test suite integrated into project documentation. Final conclusion slide with links to GitHub and documentation. | *"Agent Skill này giúp đẩy nhanh tốc độ thiết kế test case chuẩn công nghiệp lên gấp 10 lần, đảm bảo 100% độ bao phủ phân vùng và biên. Cảm ơn thầy và các bạn đã theo dõi!"* |
