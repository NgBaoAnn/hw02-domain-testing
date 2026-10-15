/**
 * Verification Script for FR-19: User Management (Quản lý người dùng Admin)
 *
 * Verifies:
 * 1. Endpoint Access Control (Role-based vs regular user vs unauthenticated)
 *    - GET /api/admin/users
 *    - DELETE /api/admin/users/:id
 * 2. Critical Security Vulnerability: BOLA / Missing Role Authorization
 *    - Regular user with role='user' sending DELETE /api/admin/users/:id
 * 3. Self-Deletion Constraint Violation (SRS constraint: Admin cannot delete themselves)
 *    - Admin sending DELETE /api/admin/users/:admin_id
 * 4. Boundary Value Analysis on user ID parameter:
 *    - Valid existing user ID (positive integer)
 *    - Non-existent user ID (e.g. 999999) -> Returns HTTP 200 vs expected HTTP 404
 *    - Zero user ID (id = 0)
 *    - Negative user ID (id = -1)
 *    - Non-numeric ID string (id = 'abc')
 * 5. Password/Sensitive Data Leakage Check:
 *    - Verifies GET /api/admin/users does NOT return password hashes/credentials
 * 6. UI Confirmation Check Simulation:
 *    - Inspects frontend logic in App.jsx (deleteUser(u.id) without window.confirm)
 */

const http = require('http');

function request(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: body ? JSON.parse(body) : null,
            rawBody: body,
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: body,
            rawBody: body,
          });
        }
      });
    });
    req.on('error', reject);
    if (data) {
      req.write(typeof data === 'string' ? data : JSON.stringify(data));
    }
    req.end();
  });
}

async function register(name, email, password) {
  return await request(
    {
      hostname: 'localhost',
      port: 3000,
      path: '/api/register',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    { name, email, password }
  );
}

async function login(email, password) {
  return await request(
    {
      hostname: 'localhost',
      port: 3000,
      path: '/api/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    { email, password }
  );
}

async function runTests() {
  console.log('================================================================');
  console.log('VERIFYING FR-19: ADMIN USER MANAGEMENT (DOMAIN TESTING & BVA)');
  console.log('================================================================\n');

  const ts = Date.now();
  // 1. Authenticate Admin
  const adminLogin = await login('admin@eshop.com', 'Admin123!');
  const adminToken = adminLogin.data ? adminLogin.data.token : null;
  const adminId = adminLogin.data?.user?.id || 1;
  console.log(`[SETUP] Admin logged in. ID: ${adminId}, Token available: ${!!adminToken}`);

  // 2. Create and authenticate regular user
  const regEmail = `regular_${ts}@test.com`;
  await register('Regular Tester', regEmail, 'User123!');
  const regularLogin = await login(regEmail, 'User123!');
  const regularToken = regularLogin.data ? regularLogin.data.token : null;
  const regularId = regularLogin.data?.user?.id;
  console.log(`[SETUP] Regular user registered. ID: ${regularId}, Email: ${regEmail}`);

  // Create disposable victim users for delete tests
  const victimEmail1 = `victim1_${ts}@test.com`;
  await register('Victim One', victimEmail1, 'Pass123!');
  const victim1Login = await login(victimEmail1, 'Pass123!');
  const victim1Id = victim1Login.data?.user?.id;

  const victimEmail2 = `victim2_${ts}@test.com`;
  await register('Victim Two', victimEmail2, 'Pass123!');
  const victim2Login = await login(victimEmail2, 'Pass123!');
  const victim2Id = victim2Login.data?.user?.id;

  console.log(`[SETUP] Victim users created: ID ${victim1Id}, ID ${victim2Id}\n`);

  // -------------------------------------------------------------
  // Test Suite 1: Authentication & Authorization for GET /api/admin/users
  // -------------------------------------------------------------
  console.log('--- TEST SUITE 1: ACCESS CONTROL & SENSITIVE DATA CHECK ---');

  // TC-FR19-SEC-01: Unauthenticated GET
  const unauthGet = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/admin/users',
    method: 'GET',
  });
  console.log(`[TC-FR19-SEC-01] GET /api/admin/users (No Auth) -> HTTP ${unauthGet.status} (Expected: 401/403)`);

  // TC-FR19-SEC-02: Regular user calling GET /api/admin/users
  const regularGet = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/admin/users',
    method: 'GET',
    headers: { Authorization: `Bearer ${regularToken}` },
  });
  console.log(`[TC-FR19-SEC-02] GET /api/admin/users (Regular User Token) -> HTTP ${regularGet.status}`);
  if (regularGet.status === 200) {
    console.log(`  -> VULNERABILITY ALERT: Regular user can list all user accounts! (Missing role check on GET)`);
  }

  // TC-FR19-SEC-03: Admin GET & Password Leakage Check
  const adminGet = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/admin/users',
    method: 'GET',
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  console.log(`[TC-FR19-SEC-03] GET /api/admin/users (Admin Token) -> HTTP ${adminGet.status}, Count: ${adminGet.data?.length}`);
  const hasPassword = Array.isArray(adminGet.data) && adminGet.data.some((u) => u.password !== undefined);
  console.log(`  -> Sensitive Data Leakage: Password field exposed? ${hasPassword ? 'YES (VULNERABILITY)' : 'NO (SECURE)'}`);

  // -------------------------------------------------------------
  // Test Suite 2: Authorization Flaw on DELETE /api/admin/users/:id
  // -------------------------------------------------------------
  console.log('\n--- TEST SUITE 2: BROKEN AUTHORIZATION ON DELETE (BOLA) ---');

  // TC-FR19-SEC-04: Regular user deletes Victim 1
  const regularDelete = await request({
    hostname: 'localhost',
    port: 3000,
    path: `/api/admin/users/${victim1Id}`,
    method: 'DELETE',
    headers: { Authorization: `Bearer ${regularToken}` },
  });
  console.log(`[TC-FR19-SEC-04] Regular user calls DELETE /api/admin/users/${victim1Id} -> HTTP ${regularDelete.status}, Body:`, regularDelete.data);
  if (regularDelete.status === 200) {
    console.log(`  -> CRITICAL VULNERABILITY CONFIRMED: Regular user can DELETE any user in the system!`);
  }

  // -------------------------------------------------------------
  // Test Suite 3: Domain & Boundary: Self-Deletion Constraint
  // -------------------------------------------------------------
  console.log('\n--- TEST SUITE 3: DOMAIN BOUNDARY - SELF-DELETION CONSTRAINT ---');

  // Setup separate temporary admin to test self-deletion without destroying main admin
  const tempAdminEmail = `temp_admin_${ts}@test.com`;
  await register('Temp Admin', tempAdminEmail, 'AdminSecret123!');
  // Elevate to admin via sqlite3 CLI
  const { execSync } = require('child_process');
  execSync(`sqlite3 ./eshop-sut/backend/database.sqlite "UPDATE users SET role = 'admin' WHERE email = '${tempAdminEmail}';"`);


  const tempAdminLogin = await login(tempAdminEmail, 'AdminSecret123!');
  const tempAdminToken = tempAdminLogin.data?.token;
  const tempAdminId = tempAdminLogin.data?.user?.id;
  console.log(`[SETUP] Temporary Admin created. ID: ${tempAdminId}, Role: ${tempAdminLogin.data?.user?.role}`);

  // TC-FR19-BVA-01: Admin deletes self (target_id === caller_id)
  const selfDelete = await request({
    hostname: 'localhost',
    port: 3000,
    path: `/api/admin/users/${tempAdminId}`,
    method: 'DELETE',
    headers: { Authorization: `Bearer ${tempAdminToken}` },
  });
  console.log(`[TC-FR19-BVA-01] Admin deletes own account (ID ${tempAdminId}) -> HTTP ${selfDelete.status}, Body:`, selfDelete.data);
  if (selfDelete.status === 200) {
    console.log(`  -> SPEC VIOLATION / BUG CONFIRMED: Admin was able to delete own currently logged in account!`);
  }

  // TC-FR19-BVA-02: Admin deletes other user (target_id !== caller_id)
  const adminDeleteOther = await request({
    hostname: 'localhost',
    port: 3000,
    path: `/api/admin/users/${victim2Id}`,
    method: 'DELETE',
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  console.log(`[TC-FR19-BVA-02] Admin deletes other user (ID ${victim2Id}) -> HTTP ${adminDeleteOther.status}, Body:`, adminDeleteOther.data);

  // -------------------------------------------------------------
  // Test Suite 4: Numerical Boundary Analysis on User ID
  // -------------------------------------------------------------
  console.log('\n--- TEST SUITE 4: NUMERICAL BOUNDARY VALUES ON USER ID ---');

  // TC-FR19-BVA-03: Non-existent ID (999999)
  const deleteNonExistent = await request({
    hostname: 'localhost',
    port: 3000,
    path: `/api/admin/users/999999`,
    method: 'DELETE',
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  console.log(`[TC-FR19-BVA-03] DELETE non-existent user ID 999999 -> HTTP ${deleteNonExistent.status}, Body:`, deleteNonExistent.data);
  if (deleteNonExistent.status === 200) {
    console.log(`  -> BUG CONFIRMED: SUT returns 200 "User deleted" when 0 rows were affected (should be 404)!`);
  }

  // TC-FR19-BVA-04: ID = 0 (Boundary <= 0)
  const deleteZero = await request({
    hostname: 'localhost',
    port: 3000,
    path: `/api/admin/users/0`,
    method: 'DELETE',
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  console.log(`[TC-FR19-BVA-04] DELETE user ID = 0 -> HTTP ${deleteZero.status}, Body:`, deleteZero.data);

  // TC-FR19-BVA-05: ID = -1 (Negative boundary)
  const deleteNegative = await request({
    hostname: 'localhost',
    port: 3000,
    path: `/api/admin/users/-1`,
    method: 'DELETE',
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  console.log(`[TC-FR19-BVA-05] DELETE user ID = -1 -> HTTP ${deleteNegative.status}, Body:`, deleteNegative.data);

  // TC-FR19-BVA-06: Non-numeric ID string
  const deleteNonNumeric = await request({
    hostname: 'localhost',
    port: 3000,
    path: `/api/admin/users/invalid_abc`,
    method: 'DELETE',
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  console.log(`[TC-FR19-BVA-06] DELETE non-numeric user ID 'invalid_abc' -> HTTP ${deleteNonNumeric.status}, Body:`, deleteNonNumeric.data);

  // -------------------------------------------------------------
  // Test Suite 5: Frontend UX Flaw - Missing Confirmation Dialog
  // -------------------------------------------------------------
  console.log('\n--- TEST SUITE 5: FRONTEND UX VERIFICATION ---');
  const fs = require('fs');
  const appJsx = fs.readFileSync('eshop-sut/frontend-admin/src/App.jsx', 'utf8');

  const hasConfirmDialog = /window\.confirm|confirm\(|Modal|Dialog/.test(
    appJsx.slice(appJsx.indexOf('const deleteUser'), appJsx.indexOf('const updateOrderStatus'))
  );
  console.log(`[TC-FR19-UI-01] Frontend deleteUser function includes confirmation check? ${hasConfirmDialog ? 'YES' : 'NO (BUG CONFIRMED: Deletion occurs instantly without confirmation)'}`);

  console.log('\n================================================================');
  console.log('TEST RUN COMPLETE');
  console.log('================================================================');
}

runTests().catch(console.error);
