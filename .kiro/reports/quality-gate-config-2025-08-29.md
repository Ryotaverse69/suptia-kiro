# Quality Gate Configuration Report

**Generated:** 2025-08-29T14:32:52.109Z

## Quality Gates

### 1. Critical Functionality (BLOCKING)
- **Level:** Critical
- **Timeout:** 300s
- **Criteria:**
  - Test Pass Rate: 100% (mandatory)
  - Critical Bugs: 0 (mandatory)

### 2. Performance Standards (BLOCKING)
- **Level:** Major
- **Timeout:** 180s
- **Criteria:**
  - Response Time: ≤ 100ms (mandatory)
  - Memory Usage: ≤ 512MB (optional)

### 3. Quality Metrics (NON-BLOCKING)
- **Level:** Minor
- **Timeout:** 120s
- **Criteria:**
  - Code Coverage: ≥ 80% (optional)
  - Quality Score: ≥ 80% (optional)

## Thresholds

- **Critical:** 100% pass rate, 0 failures allowed
- **Major:** 90% pass rate, 1 failure allowed
- **Minor:** 80% pass rate, 2 failures allowed

## Global Settings

- **Parallel Execution:** Disabled
- **Fail Fast:** Enabled
- **Retry Attempts:** 2
- **Default Timeout:** 300s
