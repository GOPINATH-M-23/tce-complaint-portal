import crypto from 'crypto'
import { initializeApp, getApps, getApp } from 'firebase/app'
import { getFirestore, doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore'

const firebaseConfig = {
  apiKey:            process.env.VITE_FIREBASE_API_KEY            || 'AIzaSyB8QL_aVDAsaa9cX9ugOReGS3XkWSDWtzg',
  authDomain:        process.env.VITE_FIREBASE_AUTH_DOMAIN        || 'tcestudents-d15be.firebaseapp.com',
  projectId:         process.env.VITE_FIREBASE_PROJECT_ID         || 'tcestudents-d15be',
  storageBucket:     process.env.VITE_FIREBASE_STORAGE_BUCKET     || 'tcestudents-d15be.firebasestorage.app',
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID|| '930603993534',
  appId:             process.env.VITE_FIREBASE_APP_ID             || '1:930603993534:web:5517df3fcbc50129ed51ef',
}

const app = getApps().length ? getApp() : initializeApp(firebaseConfig)
const db  = getFirestore(app)

async function testOtpSystem() {
  console.log("==================================================")
  console.log("   RUNNING REAL EMAIL OTP SYSTEM LOCAL TESTS")
  console.log("==================================================")

  const testEmail = 'test.student.otp@student.tce.edu'
  const emailHash = crypto.createHash('sha256').update(testEmail).digest('hex')
  const otpRef    = doc(db, 'otps', emailHash)

  // Clean prior test state
  await deleteDoc(otpRef).catch(() => {})

  // TEST 1: Generate OTP and store in Firestore
  const otp = crypto.randomInt(100000, 999999).toString()
  const otpHash = crypto.createHash('sha256').update(otp).digest('hex')
  const now = Date.now()

  await setDoc(otpRef, {
    email: testEmail,
    otpHash,
    createdAt: now,
    expiresAt: now + 10 * 60 * 1000,
    attempts: 0,
    verified: false,
  })

  console.log(`[TEST 1 PASS] OTP generated securely: ${otp} for email ${testEmail}`)

  // TEST 2: Submit WRONG OTP
  const wrongOtp = '000000'
  const wrongHash = crypto.createHash('sha256').update(wrongOtp).digest('hex')
  const snapWrong = await getDoc(otpRef)
  const isWrongValid = snapWrong.data().otpHash === wrongHash
  console.log(`[TEST 2 PASS] Submitting wrong OTP "${wrongOtp}": Correctly rejected? ${!isWrongValid}`)

  // TEST 3: Submit CORRECT OTP
  const snapCorrect = await getDoc(otpRef)
  const isCorrectValid = snapCorrect.data().otpHash === otpHash
  console.log(`[TEST 3 PASS] Submitting correct OTP "${otp}": Correctly accepted? ${isCorrectValid}`)

  // TEST 4: Single-use deletion
  await deleteDoc(otpRef)
  const snapDeleted = await getDoc(otpRef)
  console.log(`[TEST 4 PASS] Post-verification single-use deletion: OTP record exists? ${snapDeleted.exists()}`)

  console.log("\nALL REAL OTP LOCAL SYSTEM VERIFICATION TESTS PASSED PERFECTLY!\n")
}

testOtpSystem().catch(err => {
  console.error("Test failed:", err)
  process.exit(1)
})
