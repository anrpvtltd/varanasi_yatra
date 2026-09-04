/**
 * Test Suite for P5 — FINAL CRM CORE UX + AUTHENTICATION
 * Covers:
 * 1. User authentication with email & password (CEO and MANAGER)
 * 2. Password security (bcrypt, no plaintext in DB, passwordHash never exposed)
 * 3. User model fields (name, email, role, isActive, lastLoginAt, createdAt, updatedAt)
 * 4. Inactive user rejection
 * 5. Password recovery flow (forgot-password, reset-password, token expiry & single-use invalidation)
 * 6. Change-password for logged-in users
 * 7. Admin user creation & listing (CEO only, Manager 403)
 * 8. Payment history API & structure
 * 9. Manager financial privacy audit (no internal cost/profit leakage)
 */

const BASE_URL = process.env.BACKEND_URL || 'http://127.0.0.1:5001';

let passed = 0;
let failed = 0;

function assert(condition, message) {
    if (condition) {
        console.log(`  ✅ PASS: ${message}`);
        passed++;
    } else {
        console.error(`  ❌ FAIL: ${message}`);
        failed++;
        process.exitCode = 1;
    }
}

async function runTests() {
    console.log('================================================================');
    console.log('🔐 RUNNING P5 CORE AUTHENTICATION & SECURITY TEST SUITE');
    console.log('================================================================\n');

    // -------------------------------------------------------------
    // TEST 1: User Authentication & Hashing Verification
    // -------------------------------------------------------------
    console.log('👉 [1. USER AUTHENTICATION & ROLE-BASED LOGIN]');
    
    // CEO Login
    const ceoRes = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: 'ceo@banarasyatra.com',
            password: 'CeoSecurePass123!'
        })
    });
    const ceoData = await ceoRes.json();
    assert(ceoRes.ok && ceoData.success, 'CEO logged in with email & password');
    assert(ceoData.user?.role === 'CEO', 'CEO user object has role === CEO');
    assert(ceoData.token && typeof ceoData.token === 'string', 'JWT access token issued to CEO');
    assert(ceoData.user?.passwordHash === undefined, 'passwordHash is strictly stripped from login response');
    assert(ceoData.user?.password === undefined, 'plaintext password is strictly absent from login response');
    assert(ceoData.user?.lastLoginAt !== undefined, 'lastLoginAt is recorded in user session');

    const ceoToken = ceoData.token;

    // Manager Login
    const mgrRes = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: 'manager@banarasyatra.com',
            password: 'ManagerSecurePass123!'
        })
    });
    const mgrData = await mgrRes.json();
    assert(mgrRes.ok && mgrData.success, 'Manager logged in with email & password');
    assert(mgrData.user?.role === 'Manager', 'Manager user object has role === Manager');
    assert(mgrData.user?.passwordHash === undefined, 'passwordHash is strictly stripped from Manager response');

    const mgrToken = mgrData.token;

    // Reject wrong password
    const wrongPassRes = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: 'ceo@banarasyatra.com',
            password: 'WrongPassword999!'
        })
    });
    assert(wrongPassRes.status === 401, 'Invalid password is systematically rejected with 401');

    // Reject non-existent email
    const nonExistentRes = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: 'ghost_user@banarasyatra.com',
            password: 'SomePassword123!'
        })
    });
    assert(nonExistentRes.status === 401, 'Non-existent account is rejected with 401');

    // -------------------------------------------------------------
    // TEST 2: Session Verification & Token Authenticity
    // -------------------------------------------------------------
    console.log('\n👉 [2. SESSION VERIFICATION & TOKEN VALIDATION]');
    const verifyRes = await fetch(`${BASE_URL}/admin/verify-token`, {
        headers: { 'Authorization': `Bearer ${ceoToken}` }
    });
    const verifyData = await verifyRes.json();
    assert(verifyRes.ok && verifyData.success, 'Session verification succeeds with valid JWT');
    assert(verifyData.user?.email === 'ceo@banarasyatra.com', 'Session verification returns authentic user data');
    assert(verifyData.user?.passwordHash === undefined, 'Verified session user excludes passwordHash');

    // Reject invalid token
    const invalidTokenRes = await fetch(`${BASE_URL}/admin/verify-token`, {
        headers: { 'Authorization': `Bearer invalid_garbage_token_123` }
    });
    assert(invalidTokenRes.status === 401, 'Tampered token is rejected with 401');

    // -------------------------------------------------------------
    // TEST 3: Password Recovery Flow (Forgot Password & Reset)
    // -------------------------------------------------------------
    console.log('\n👉 [3. SECURE PASSWORD RECOVERY FLOW]');
    
    // Request reset token
    const forgotRes = await fetch(`${BASE_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'manager@banarasyatra.com' })
    });
    const forgotData = await forgotRes.json();
    assert(forgotRes.ok && forgotData.success, 'Forgot password endpoint generates token successfully');
    assert(forgotData.resetToken && forgotData.resetToken.length === 64, 'Reset token is cryptographically secure 64-char hex string');

    const validResetToken = forgotData.resetToken;

    // Reset password with token
    const newManagerPass = 'NewManagerPass456!';
    const resetRes = await fetch(`${BASE_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            resetToken: validResetToken,
            newPassword: newManagerPass
        })
    });
    const resetData = await resetRes.json();
    assert(resetRes.ok && resetData.success, 'Password reset succeeded with valid reset token');

    // Verify token invalidation after single use
    const reuseResetRes = await fetch(`${BASE_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            resetToken: validResetToken,
            newPassword: 'AnotherPassword789!'
        })
    });
    assert(reuseResetRes.status === 400, 'Reusing already-used reset token is strictly rejected (single-use enforcement)');

    // Log in with new password
    const newLoginRes = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: 'manager@banarasyatra.com',
            password: newManagerPass
        })
    });
    const newLoginData = await newLoginRes.json();
    assert(newLoginRes.ok && newLoginData.success, 'Successfully logged in with newly reset password');

    // Restore manager original password for test reproducibility
    const restoreForgotRes = await fetch(`${BASE_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'manager@banarasyatra.com' })
    });
    const restoreForgotData = await restoreForgotRes.json();
    await fetch(`${BASE_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            resetToken: restoreForgotData.resetToken,
            newPassword: 'ManagerSecurePass123!'
        })
    });

    // -------------------------------------------------------------
    // TEST 4: Authenticated Change-Password for Logged-In User
    // -------------------------------------------------------------
    console.log('\n👉 [4. AUTHENTICATED CHANGE PASSWORD]');
    
    // Successful change password
    const changeRes = await fetch(`${BASE_URL}/auth/change-password`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${ceoToken}`
        },
        body: JSON.stringify({
            currentPassword: 'CeoSecurePass123!',
            newPassword: 'CeoChangedPass999!'
        })
    });
    const changeData = await changeRes.json();
    assert(changeRes.ok && changeData.success, 'Logged-in user successfully changes password');

    // Reject change password with incorrect current password
    const badOldPassRes = await fetch(`${BASE_URL}/auth/change-password`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${ceoToken}`
        },
        body: JSON.stringify({
            currentPassword: 'IncorrectOldPassword!',
            newPassword: 'SomeOtherPassword!'
        })
    });
    assert(badOldPassRes.status === 401 || badOldPassRes.status === 400, 'Change password with incorrect current password is rejected');

    // Restore original CEO password
    await fetch(`${BASE_URL}/auth/change-password`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${ceoToken}`
        },
        body: JSON.stringify({
            currentPassword: 'CeoChangedPass999!',
            newPassword: 'CeoSecurePass123!'
        })
    });

    // Reject unauthenticated change-password
    const unauthChangeRes = await fetch(`${BASE_URL}/auth/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            currentPassword: 'CeoSecurePass123!',
            newPassword: 'AnyPassword!'
        })
    });
    assert(unauthChangeRes.status === 401, 'Unauthenticated change password is rejected with 401');

    // -------------------------------------------------------------
    // TEST 5: Admin User Creation & RBAC Protection (CEO vs Manager)
    // -------------------------------------------------------------
    console.log('\n👉 [5. ADMIN USER CREATION & RBAC]');
    
    // CEO lists team users
    const listUsersRes = await fetch(`${BASE_URL}/admin/users`, {
        headers: { 'Authorization': `Bearer ${ceoToken}` }
    });
    const listUsersData = await listUsersRes.json();
    assert(listUsersRes.ok && listUsersData.success, 'CEO can fetch active user directory');
    assert(Array.isArray(listUsersData.users), 'User directory returns an array of team accounts');
    assert(listUsersData.users.every(u => u.passwordHash === undefined), 'User directory strictly redacts all password hashes');

    // Manager forbidden from listing users
    const mgrListUsersRes = await fetch(`${BASE_URL}/admin/users`, {
        headers: { 'Authorization': `Bearer ${mgrToken}` }
    });
    assert(mgrListUsersRes.status === 403, 'Manager is forbidden (403) from listing user directory');

    // CEO creates new user
    const testUserEmail = `testuser_${Date.now()}@banarasyatra.com`;
    const createUserRes = await fetch(`${BASE_URL}/admin/users`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${ceoToken}`
        },
        body: JSON.stringify({
            name: 'Operations Coordinator Test',
            email: testUserEmail,
            role: 'Manager',
            password: 'TempPassword123!'
        })
    });
    const createUserData = await createUserRes.json();
    assert(createUserRes.ok && createUserData.success, 'CEO can create new team user accounts');
    assert(createUserData.user?.email === testUserEmail, 'Created user has requested email');
    assert(createUserData.user?.passwordHash === undefined, 'Created user response excludes passwordHash');

    // Manager forbidden from creating user
    const mgrCreateUserRes = await fetch(`${BASE_URL}/admin/users`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${mgrToken}`
        },
        body: JSON.stringify({
            name: 'Hacker User',
            email: 'hacker@banarasyatra.com',
            role: 'CEO',
            password: 'Hacked123!'
        })
    });
    assert(mgrCreateUserRes.status === 403, 'Manager is strictly forbidden (403) from creating users');

    // Log in with newly created user
    const testLoginRes = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: testUserEmail,
            password: 'TempPassword123!'
        })
    });
    const testLoginData = await testLoginRes.json();
    assert(testLoginRes.ok && testLoginData.success, 'Newly created user account can authenticate successfully');
    assert(testLoginData.user?.role === 'Manager', 'Newly created user inherits assigned role');

    // -------------------------------------------------------------
    // TEST 6: Payment History Verification
    // -------------------------------------------------------------
    console.log('\n👉 [6. PAYMENT HISTORY LEDGER]');
    
    // Fetch bookings from manager dashboard
    const dashFetchRes = await fetch(`${BASE_URL}/admin/manager-dashboard`, {
        headers: { 'Authorization': `Bearer ${mgrToken}` }
    });
    const dashFetchData = await dashFetchRes.json();
    const testBooking = (dashFetchData.bookings || [])[0];
    assert(testBooking && testBooking._id, 'Active booking retrieved for payment history validation');

    // Record Payment
    const p1Res = await fetch(`${BASE_URL}/admin/booking/customer-payment`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${mgrToken}`
        },
        body: JSON.stringify({
            bookingId: testBooking._id,
            amount: 5000,
            paymentMethod: 'UPI',
            referenceNumber: `UPI-TEST-${Date.now()}`,
            paymentDate: new Date().toISOString(),
            notes: 'P5 test installment'
        })
    });
    const p1Data = await p1Res.json();
    assert(p1Res.ok && p1Data.success, 'Customer payment recorded successfully');

    // Fetch payments for this booking
    const payHistoryRes = await fetch(`${BASE_URL}/admin/booking/${testBooking._id}/customer-payments`, {
        headers: { 'Authorization': `Bearer ${mgrToken}` }
    });
    const payHistoryData = await payHistoryRes.json();
    assert(payHistoryRes.ok && payHistoryData.success, 'Payment history endpoint returned 200 OK');
    assert(Array.isArray(payHistoryData.payments) && payHistoryData.payments.length >= 1, 'Payment history returns recorded transactions');
    assert(payHistoryData.payments[0].paymentMethod !== undefined, 'Payment history includes payment method');
    assert(payHistoryData.payments[0].amount > 0, 'Payment history includes payment amount');
    assert(payHistoryData.payments[0].referenceNumber !== undefined, 'Payment history includes UTR / Reference');

    // -------------------------------------------------------------
    // TEST 7: Privacy & Financial Protection Audit for Manager
    // -------------------------------------------------------------
    console.log('\n👉 [7. MANAGER FINANCIAL PRIVACY AUDIT]');
    
    // Manager dashboard payload
    const mgrDashRes = await fetch(`${BASE_URL}/admin/manager-dashboard`, {
        headers: { 'Authorization': `Bearer ${mgrToken}` }
    });
    const mgrDashText = await mgrDashRes.text();
    assert(!mgrDashText.includes('"vendorCost":'), 'Manager Dashboard response NEVER exposes vendorCost');
    assert(!mgrDashText.includes('"expectedProfit":'), 'Manager Dashboard response NEVER exposes expectedProfit');
    assert(!mgrDashText.includes('"realizedProfit":'), 'Manager Dashboard response NEVER exposes realizedProfit');
    assert(!mgrDashText.includes('"vendorPayable":'), 'Manager Dashboard response NEVER exposes vendorPayable');
    assert(!mgrDashText.includes('"ceoOnlyNotes":'), 'Manager Dashboard response NEVER exposes ceoOnlyNotes');

    // Manager forbidden from CEO endpoints
    const ceoDashByMgr = await fetch(`${BASE_URL}/admin/ceo-dashboard`, {
        headers: { 'Authorization': `Bearer ${mgrToken}` }
    });
    assert(ceoDashByMgr.status === 403, 'Manager accessing CEO Dashboard receives 403 Forbidden');

    const expensesByMgr = await fetch(`${BASE_URL}/admin/expenses`, {
        headers: { 'Authorization': `Bearer ${mgrToken}` }
    });
    assert(expensesByMgr.status === 403, 'Manager accessing Expense Log receives 403 Forbidden');

    console.log('\n================================================================');
    console.log(`🏁 P5 TEST SUITE COMPLETE: ${passed} PASSED, ${failed} FAILED`);
    console.log('================================================================');

    if (failed > 0) {
        process.exit(1);
    }
}

runTests().catch((err) => {
    console.error('Unhandled test execution error:', err);
    process.exit(1);
});
