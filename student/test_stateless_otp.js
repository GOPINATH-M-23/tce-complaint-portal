import sendOtpHandler from './api/send-otp.js'
import verifyOtpHandler from './api/verify-otp.js'

async function runTests() {
  console.log("==================================================")
  console.log("   RUNNING STATELESS HMAC OTP SYSTEM UNIT TESTS")
  console.log("==================================================")

  // 1. Mock Request/Response helper
  function makeMockRes() {
    const res = {
      statusCode: 200,
      headers: {},
      body: null,
      status(code) {
        this.statusCode = code
        return this
      },
      json(data) {
        this.body = data
        return this
      },
      setHeader(name, value) {
        this.headers[name] = value
        return this
      },
      end() {
        return this
      }
    }
    return res
  }

  const testEmail = 'unit.test.student@student.tce.edu'
  
  // TEST 1: Send OTP to valid TCE student email
  const req1 = {
    method: 'POST',
    body: { email: testEmail }
  }
  const res1 = makeMockRes()
  await sendOtpHandler(req1, res1)
  
  if (res1.statusCode !== 200 || !res1.body.success) {
    console.error("[TEST 1 FAIL] send-otp failed:", res1.statusCode, res1.body)
    process.exit(1)
  }
  
  const { challenge, expiresAt } = res1.body
  console.log(`[TEST 1 PASS] Send OTP succeeded. challenge: ${challenge.substring(0, 10)}..., expiresAt: ${expiresAt}`)

  // We need to capture the printed OTP from console.log to test correct verification
  // Since nodemailer is mock/skipped when there's no SMTP env vars, it prints to console:
  // "[OTP GENERATED] Email: ... | Code: 123456"
  // Let's capture console.log output
  let capturedOtp = null
  const originalLog = console.log
  console.log = (...args) => {
    originalLog(...args)
    const logStr = args.join(' ')
    if (logStr.includes('[OTP GENERATED]')) {
      const match = logStr.match(/Code:\s*(\d{6})/)
      if (match) capturedOtp = match[1]
    }
  }

  // Trigger send-otp again to capture the generated OTP
  const resCapture = makeMockRes()
  await sendOtpHandler(req1, resCapture)
  console.log = originalLog // restore

  if (!capturedOtp) {
    console.error("[TEST ERROR] Could not capture generated OTP from console logs.")
    process.exit(1)
  }
  
  const captureChallenge = resCapture.body.challenge
  const captureExpiresAt = resCapture.body.expiresAt
  console.log(`[CAPTURE PASS] Captured generated OTP: ${capturedOtp}`)

  // TEST 2: Verify with correct OTP
  const req2 = {
    method: 'POST',
    body: {
      email: testEmail,
      otp: capturedOtp,
      challenge: captureChallenge,
      expiresAt: captureExpiresAt
    }
  }
  const res2 = makeMockRes()
  await verifyOtpHandler(req2, res2)

  if (res2.statusCode !== 200 || !res2.body.success) {
    console.error("[TEST 2 FAIL] verify-otp with correct OTP failed:", res2.statusCode, res2.body)
    process.exit(1)
  }
  console.log("[TEST 2 PASS] verify-otp accepted correct OTP successfully.")

  // TEST 3: Verify with incorrect OTP
  const req3 = {
    method: 'POST',
    body: {
      email: testEmail,
      otp: '000000',
      challenge: captureChallenge,
      expiresAt: captureExpiresAt
    }
  }
  const res3 = makeMockRes()
  await verifyOtpHandler(req3, res3)

  if (res3.statusCode === 200) {
    console.error("[TEST 3 FAIL] verify-otp accepted incorrect OTP '000000'")
    process.exit(1)
  }
  console.log(`[TEST 3 PASS] verify-otp rejected incorrect OTP. Status: ${res3.statusCode}, Error: ${res3.body.error}`)

  // TEST 4: Verify with expired timestamp
  const req4 = {
    method: 'POST',
    body: {
      email: testEmail,
      otp: capturedOtp,
      challenge: captureChallenge,
      expiresAt: Date.now() - 1000 // expired 1s ago
    }
  }
  const res4 = makeMockRes()
  await verifyOtpHandler(req4, res4)

  if (res4.statusCode === 200) {
    console.error("[TEST 4 FAIL] verify-otp accepted expired timestamp")
    process.exit(1)
  }
  console.log(`[TEST 4 PASS] verify-otp rejected expired timestamp. Status: ${res4.statusCode}, Error: ${res4.body.error}`)

  // TEST 5: Verify with tampered challenge
  const req5 = {
    method: 'POST',
    body: {
      email: testEmail,
      otp: capturedOtp,
      challenge: 'tampered_challenge_value_1234567890abcdef',
      expiresAt: captureExpiresAt
    }
  }
  const res5 = makeMockRes()
  await verifyOtpHandler(req5, res5)

  if (res5.statusCode === 200) {
    console.error("[TEST 5 FAIL] verify-otp accepted tampered challenge")
    process.exit(1)
  }
  console.log(`[TEST 5 PASS] verify-otp rejected tampered challenge. Status: ${res5.statusCode}, Error: ${res5.body.error}`)

  // TEST 6: Non-TCE email validation in send-otp
  const req6 = {
    method: 'POST',
    body: { email: 'fake.student@gmail.com' }
  }
  const res6 = makeMockRes()
  await sendOtpHandler(req6, res6)

  if (res6.statusCode === 200) {
    console.error("[TEST 6 FAIL] send-otp accepted non-TCE email address")
    process.exit(1)
  }
  console.log(`[TEST 6 PASS] send-otp rejected non-TCE email. Status: ${res6.statusCode}, Error: ${res6.body.error}`)

  console.log("\nALL STATELESS HMAC OTP SYSTEM UNIT TESTS PASSED PERFECTLY!\n")
}

runTests().catch(err => {
  console.error("Stateless unit test suite failed:", err)
  process.exit(1)
})
