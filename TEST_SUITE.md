# PayGuard Test Suite Documentation

## Overview

This comprehensive test suite ensures PayGuard is working correctly at all times. Tests are organized into **startup health checks** (fast, run on every `npm run dev`) and **comprehensive tests** (thorough, run before deployment).

---

## Quick Start

### Run Health Check (< 5 seconds)
```bash
cd apps/web
npm run test:health
```

### Run Comprehensive Suite (30-60 seconds)
```bash
cd apps/web
npm run test:comprehensive
```

### Run All Tests
```bash
cd apps/web
npm test
```

### Watch Mode (during development)
```bash
cd apps/web
npm run test:watch
```

---

## Test Categories

### 1. Startup Health Check ⚡
**File:** `src/lib/guardian/__tests__/startup-health-check.test.ts`
**Runs:** Automatically on `npm run dev`
**Duration:** < 5 seconds

#### Checks:
- ✅ Database connectivity
- ✅ Demo account exists
- ✅ Chain configuration valid
- ✅ All rules loaded (20+)
- ✅ Compliance rules loaded
- ⚠️  Configuration warnings
- 📊 System status summary

#### What It Catches:
- Missing environment variables
- Database connection failures
- Missing seed data
- Invalid chain configuration
- Rule loading errors

#### Example Output:
```
✅ Startup Health Check
  ✅ Critical Systems
    ✅ should connect to database (234ms)
    ✅ should have demo account (45ms)
    ✅ should have valid chain configuration (2ms)
    ✅ should load all rules (12ms)
    ✅ should load compliance rules (8ms)
  ⚠️  Configuration Warnings
    ⚠️  WARNING: Using default SESSION_SECRET
  📊 System Info
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🛡️  PayGuard System Status
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Database: Connected (1 accounts, 0 decisions)
✅ Chain: MOCK mode
✅ Rules: 21 loaded
✅ LLM: Disabled (template mode)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Test Files  1 passed (1)
     Tests  8 passed (8)
  Duration  1.23s
```

---

### 2. Comprehensive Test Suite 🔬
**File:** `src/lib/guardian/__tests__/comprehensive.test.ts`
**Runs:** Manually or in CI/CD
**Duration:** 30-60 seconds

#### Test Categories:

##### 2.1 Environment Configuration
- All required env vars present
- Valid chain configuration
- Merchant URLs configured

##### 2.2 Database Connectivity
- Database connection works
- All tables exist
- Demo account seeded correctly

##### 2.3 Rule Engine Integrity
- All 20+ rules load without errors
- Rules have proper signatures
- Clean request evaluates successfully

##### 2.4 Critical Rules Behavior
- Kill switch blocks all payments
- Prompt injection detected and blocked
- Hidden instructions detected and blocked
- Transaction limits enforced
- Blocklisted recipients rejected

##### 2.5 Page Consistency Checks
- Price mismatch detected
- Address mismatch detected
- Product mismatch detected

##### 2.6 Policy Enforcement
- New recipients require confirmation
- Daily limits enforced
- Minimum balance respected

##### 2.7 Compliance Mapping
- All reason codes map to frameworks
- Compliance state computed correctly

##### 2.8 Hash Computation
- Hashes are deterministic
- Different inputs produce different hashes

##### 2.9 Rail Selection
- AVAX → avalanche rail
- EUR → virtual_card rail

##### 2.10 Text Utilities
- Hidden blocks detected
- Prompt injection patterns found
- Lookalike domains identified
- Address normalization works

##### 2.11 Integration Tests
- Full evaluation flow works end-to-end

---

## Error Detection & Reporting

### Error Format

When a test fails, you'll see:

```bash
❌ FAIL src/lib/guardian/__tests__/comprehensive.test.ts > 4. Critical Rules Behavior > should block prompt injection attempts

AssertionError: expected 'APPROVED' to be 'BLOCKED'

  Expected: "BLOCKED"
  Received: "APPROVED"

❯ src/lib/guardian/__tests__/comprehensive.test.ts:123:34
    121|       });
    122|
    123|       expect(result.verdict).toBe("BLOCKED");
       |                              ^
    124|       expect(result.reasons.some((r) => r.code === "PROMPT_INJECTION_SUSPECTED")).toBe(true);
    125|     });
```

### Common Errors & Solutions

#### ❌ Database Connection Failed
```
Error: P1001: Can't reach database server
```
**Solution:**
```bash
# Check if database exists
ls apps/web/prisma/dev.db

# If missing, recreate:
npm run db:push -w apps/web
npm run db:seed -w apps/web
```

#### ❌ Demo Account Not Found
```
Error: Demo account not found. Run: npm run db:seed -w apps/web
```
**Solution:**
```bash
cd apps/web
npm run db:seed
```

#### ❌ Rules Not Loading
```
Error: Only 15 rules loaded, expected 20+
```
**Solution:**
```bash
# Check for syntax errors in rule files
npm run typecheck -w apps/web

# Rebuild if needed
npm run build -w apps/web
```

#### ❌ Invalid Chain Configuration
```
Error: PAYGUARD_CONTRACT_ADDRESS not set
```
**Solution:**
```bash
# Either deploy contract:
npm run deploy:fuji -w packages/contracts

# Or use mock mode:
# In .env: CHAIN_MODE=mock
```

#### ❌ Missing Environment Variables
```
Error: Environment variable not found: DATABASE_URL
```
**Solution:**
```bash
# Ensure .env exists and is populated
cp .env.example .env
# Fill in required values
```

---

## Continuous Integration

### GitHub Actions Setup

Create `.github/workflows/test.yml`:

```yaml
name: PayGuard Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm install
      
      - name: Generate Prisma Client
        run: npm run db:generate -w apps/web
      
      - name: Create test database
        run: |
          cp .env.example .env
          npm run db:push -w apps/web
          npm run db:seed -w apps/web
      
      - name: Run health check
        run: npm run test:health -w apps/web
      
      - name: Run comprehensive tests
        run: npm run test:comprehensive -w apps/web
      
      - name: Run all tests
        run: npm test -w apps/web
```

---

## Adding New Tests

### 1. Add to Comprehensive Suite

Edit `src/lib/guardian/__tests__/comprehensive.test.ts`:

```typescript
describe("12. My New Feature", () => {
  it("should do something specific", async () => {
    // Arrange
    const { evaluate } = await import("@/lib/guardian/evaluate");
    const { createContext } = await import("@/lib/guardian/__tests__/fixtures");
    
    const ctx = createContext({
      amount: "0.05",
      // ... setup
    });
    
    // Act
    const result = evaluate(ctx);
    
    // Assert
    expect(result.verdict).toBe("APPROVED");
    expect(result.score).toBeGreaterThan(70);
  });
});
```

### 2. Add to Health Check (Fast Checks Only)

Edit `src/lib/guardian/__tests__/startup-health-check.test.ts`:

```typescript
it("should check my critical system", async () => {
  // Must complete in < 1 second
  const start = Date.now();
  
  // Your check here
  
  const duration = Date.now() - start;
  expect(duration).toBeLessThan(1000);
});
```

---

## Test Coverage Goals

| Component | Current | Target |
|-----------|---------|--------|
| Rule Engine | 85% | 95% |
| API Routes | 70% | 90% |
| Guardian Service | 90% | 95% |
| Chain Client | 75% | 85% |
| UI Components | 40% | 70% |

### Generate Coverage Report
```bash
npm run test -- --coverage
```

---

## Best Practices

### ✅ DO:
- Keep health checks under 5 seconds total
- Use fixtures for test data
- Test both success and failure paths
- Mock external services (chain, LLM) in unit tests
- Use descriptive test names
- Group related tests with `describe`

### ❌ DON'T:
- Add slow tests to health check
- Test implementation details
- Share state between tests
- Use real API keys in tests
- Skip cleanup in `afterEach`
- Ignore flaky tests

---

## Performance Benchmarks

Expected test durations:

| Test Suite | Expected Duration | Threshold |
|------------|-------------------|-----------|
| Health Check | 1-2s | < 5s |
| Unit Tests | 5-10s | < 20s |
| Comprehensive | 30-60s | < 2min |
| Full Suite | 1-2min | < 5min |

If tests exceed thresholds, investigate:
- Database query optimization
- Unnecessary async operations
- Missing test parallelization
- Slow rule execution

---

## Troubleshooting

### Tests Pass Locally But Fail in CI

**Possible causes:**
1. Environment variables not set in CI
2. Database not seeded
3. Time zone differences
4. File path issues (Windows vs Unix)

**Solution:**
- Ensure CI setup matches local setup
- Check GitHub Actions secrets
- Use relative paths
- Mock time-dependent functions

### Flaky Tests

**Signs:**
- Tests pass sometimes, fail sometimes
- "Cannot read property of undefined"
- Timeout errors

**Solutions:**
```typescript
// Add proper waits
await waitFor(() => expect(element).toBeInTheDocument());

// Increase timeouts for slow operations
it("should complete", async () => {
  // ...
}, 10000); // 10 second timeout

// Mock unstable dependencies
vi.mock("@/lib/chain/client");
```

### Test Database Pollution

**Issue:** Tests failing because of leftover data

**Solution:**
```typescript
import { beforeEach } from "vitest";

beforeEach(async () => {
  // Clean up before each test
  await prisma.decision.deleteMany({});
  await prisma.apiKey.deleteMany({});
  // Keep accounts
});
```

---

## Maintenance Schedule

### Daily (Automated)
- ✅ Health check on every dev server start
- ✅ Full suite on every commit (CI)

### Weekly
- 🔍 Review test coverage reports
- 🧹 Clean up flaky tests
- 📊 Check test performance

### Monthly
- 📝 Update test documentation
- 🎯 Adjust coverage goals
- 🔄 Refactor test utilities

---

## Support

### Questions?
- Check existing tests for examples
- Review fixtures in `__tests__/fixtures.ts`
- Consult `docs/API.md` for contract details

### Found a Bug?
1. Write a failing test that reproduces it
2. Fix the bug
3. Verify test passes
4. Commit both test and fix together

---

## Summary

This test suite provides:
- ✅ **Fast feedback** (5s health check on startup)
- ✅ **Comprehensive validation** (60s full suite)
- ✅ **Clear error messages** (tells you exactly what's wrong)
- ✅ **Easy to extend** (fixtures and utilities provided)
- ✅ **CI-ready** (GitHub Actions template included)

Run `npm run test:health` now to verify your setup! 🚀
