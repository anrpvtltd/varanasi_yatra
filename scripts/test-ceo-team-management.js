/**
 * Test Suite for Phase 1 & 2: CEO Team Management & First Login Password Change
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
    console.log('👥 RUNNING PHASE 1 & 2: CEO TEAM MANAGEMENT & FIRST LOGIN TESTS');
    console.log('================================================================\n');

    // 1. CEO Authentication
    const ceoLoginRes = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: 'ceo@banarasyatra.com',
            password: 'CeoSecurePass123!'
        })
    });
    const ceoLoginData = await ceoLoginRes.json();
    assert(ceoLoginRes.ok && ceoLoginData.success, 'CEO logs in successfully');
    const ceoToken = ceoLoginData.token;
    const ceoId = ceoLoginData.user.id;

    // 2. Manager Authentication
    const mgrLoginRes = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: 'manager@banarasyatra.com',
            password: 'ManagerSecurePass123!'
        })
    });
    const mgrLoginData = await mgrLoginRes.json();
    assert(mgrLoginRes.ok && mgrLoginData.success, 'Manager logs in successfully');
    const mgrToken = mgrLoginData.token;

    // 3. RBAC Check: Manager cannot access CEO user management endpoints
    console.log('\n👉 [1. RBAC SECURITY FOR TEAM MANAGEMENT]');
    const mgrListUsersRes = await fetch(`${BASE_URL}/admin/users`, {
        headers: { 'Authorization': `Bearer ${mgrToken}` }
    });
    assert(mgrListUsersRes.status === 403, 'Manager receives 403 Forbidden when accessing GET /admin/users');

    const mgrCreateUserRes = await fetch(`${BASE_URL}/admin/users`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${mgrToken}`
        },
        body: JSON.stringify({
            name: 'Hacker',
            email: 'hacker@banarasyatra.com',
            role: 'Manager',
            temporaryPassword: 'HackerPass123!'
        })
    });
    assert(mgrCreateUserRes.status === 403, 'Manager receives 403 Forbidden when attempting POST /admin/users');

    // 4. CEO User Creation with Temporary Password
    console.log('\n👉 [2. CEO USER CREATION WITH TEMPORARY PASSWORD]');
    const testEmail = `team_test_${Date.now()}@banarasyatra.com`;
    const tempPassword = 'TempSecurePass2026!';

    const createUserRes = await fetch(`${BASE_URL}/admin/users`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${ceoToken}`
        },
        body: JSON.stringify({
            name: 'Operations Associate',
            email: testEmail,
            role: 'Manager',
            temporaryPassword: tempPassword
        })
    });
    const createUserData = await createUserRes.json();
    assert(createUserRes.status === 201 && createUserData.success, 'CEO creates user successfully with 201 Created');
    assert(createUserData.user?.passwordChangeRequired === true, 'Created user has passwordChangeRequired === true');
    assert(createUserData.user?.passwordHash === undefined, 'Created user response excludes passwordHash');
    assert(createUserData.user?.password === undefined, 'Created user response excludes plaintext password');
    const createdUserId = createUserData.user?.id;

    // 5. CEO List Users
    console.log('\n👉 [3. CEO LIST USERS & METADATA VERIFICATION]');
    const listUsersRes = await fetch(`${BASE_URL}/admin/users`, {
        headers: { 'Authorization': `Bearer ${ceoToken}` }
    });
    const listUsersData = await listUsersRes.json();
    assert(listUsersRes.ok && listUsersData.success, 'CEO retrieves team user list');
    const foundUser = listUsersData.users?.find(u => u.email === testEmail);
    assert(Boolean(foundUser), 'Newly created user appears in CEO user list');
    assert(foundUser?.passwordChangeRequired === true, 'User record in list reflects passwordChangeRequired === true');
    assert(foundUser?.isActive === true, 'User record in list reflects isActive === true');
    assert(foundUser?.passwordHash === undefined, 'User record in list strictly excludes passwordHash');

    // 6. First Login with Temporary Password
    console.log('\n👉 [4. FIRST LOGIN PASSWORD CHANGE ENFORCEMENT]');
    const firstLoginRes = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: testEmail,
            password: tempPassword
        })
    });
    const firstLoginData = await firstLoginRes.json();
    assert(firstLoginRes.ok && firstLoginData.success, 'New user successfully logs in with temporary password');
    assert(firstLoginData.user?.passwordChangeRequired === true, 'Login response flags passwordChangeRequired === true');
    const newUserToken = firstLoginData.token;

    // 7. Force Password Change Flow
    const newPermanentPassword = 'PermanentPass2026!#';
    const changePassRes = await fetch(`${BASE_URL}/auth/change-password`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${newUserToken}`
        },
        body: JSON.stringify({
            currentPassword: tempPassword,
            newPassword: newPermanentPassword
        })
    });
    const changePassData = await changePassRes.json();
    assert(changePassRes.ok && changePassData.success, 'User successfully changes temporary password to permanent password');

    // 8. Verify Old Temporary Password is Inactive
    const oldPassLoginRes = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: testEmail,
            password: tempPassword
        })
    });
    assert(oldPassLoginRes.status === 401, 'Old temporary password is systematically rejected after password change');

    // 9. Verify New Permanent Password works and passwordChangeRequired is false
    const newPassLoginRes = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: testEmail,
            password: newPermanentPassword
        })
    });
    const newPassLoginData = await newPassLoginRes.json();
    assert(newPassLoginRes.ok && newPassLoginData.success, 'New permanent password logs in successfully');
    assert(newPassLoginData.user?.passwordChangeRequired === false, 'Login response reflects passwordChangeRequired === false');

    // 10. Deactivate User
    console.log('\n👉 [5. ACCOUNT ACTIVATION / DEACTIVATION]');
    const deactRes = await fetch(`${BASE_URL}/admin/users/${createdUserId}/status`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${ceoToken}`
        },
        body: JSON.stringify({ isActive: false })
    });
    const deactData = await deactRes.json();
    assert(deactRes.ok && deactData.success, 'CEO successfully deactivates user');
    assert(deactData.user?.isActive === false, 'Deactivated user object has isActive === false');

    // Verify deactivated user cannot log in
    const deactLoginRes = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: testEmail,
            password: newPermanentPassword
        })
    });
    assert(deactLoginRes.status === 401, 'Deactivated user is rejected from login with 401');

    // Verify CEO cannot deactivate own account
    const selfDeactRes = await fetch(`${BASE_URL}/admin/users/${ceoId}/status`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${ceoToken}`
        },
        body: JSON.stringify({ isActive: false })
    });
    assert(selfDeactRes.status === 400, 'CEO cannot deactivate their own executive account');

    // 11. Reactivate User
    const reactRes = await fetch(`${BASE_URL}/admin/users/${createdUserId}/status`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${ceoToken}`
        },
        body: JSON.stringify({ isActive: true })
    });
    assert(reactRes.ok, 'CEO successfully reactivates user');

    const reactLoginRes = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: testEmail,
            password: newPermanentPassword
        })
    });
    assert(reactLoginRes.ok, 'Reactivated user can log in again');

    // 12. Password Reset by CEO
    console.log('\n👉 [6. CEO PASSWORD RESET FOR USER]');
    const resetTempPass = 'NewTempResetPass99!';
    const resetUserRes = await fetch(`${BASE_URL}/admin/users/${createdUserId}/reset-password`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${ceoToken}`
        },
        body: JSON.stringify({ temporaryPassword: resetTempPass })
    });
    const resetUserData = await resetUserRes.json();
    assert(resetUserRes.ok && resetUserData.success, 'CEO resets user password with temporary password');
    assert(resetUserData.user?.passwordChangeRequired === true, 'User passwordChangeRequired is re-flagged to true');

    // User logs in with new temporary password
    const resetLoginRes = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: testEmail,
            password: resetTempPass
        })
    });
    const resetLoginData = await resetLoginRes.json();
    assert(resetLoginRes.ok && resetLoginData.success, 'User logs in with newly reset temporary password');
    assert(resetLoginData.user?.passwordChangeRequired === true, 'Login indicates password change is required');

    console.log('\n================================================================');
    console.log(`🏁 PHASE 1 & 2 TESTS COMPLETE: ${passed} PASSED, ${failed} FAILED`);
    console.log('================================================================');
    if (failed > 0) process.exit(1);
}

runTests().catch(err => {
    console.error('Fatal test error:', err);
    process.exit(1);
});
