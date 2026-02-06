/**
 * Script para probar la funcionalidad de competencia y muro en el backend.
 * El servidor debe estar corriendo (npm run dev).
 *
 * Uso:
 *   npx ts-node scripts/test-competition-flow.ts
 *   API_URL=http://localhost:3000 npx ts-node scripts/test-competition-flow.ts
 *
 * Para probar endpoints admin (crear periodo, recompute, cerrar):
 *   ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=xxx npx ts-node scripts/test-competition-flow.ts
 *
 * Requiere Node 18+ (fetch global).
 */

const BASE = process.env.API_URL || 'http://localhost:3000';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

let adminToken: string | null = null;
let createdPeriodId: string | null = null;
let passed = 0;
let failed = 0;

async function request(
  method: string,
  path: string,
  body?: object,
  useAuth = false
): Promise<{ status: number; data: unknown }> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (useAuth && adminToken) headers['Authorization'] = `Bearer ${adminToken}`;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = (await res.json().catch(() => ({}))) as { success?: boolean; data?: unknown; message?: string };
  return { status: res.status, data: data.data ?? data };
}

function ok(name: string, condition: boolean, detail?: string): void {
  if (condition) {
    passed++;
    console.log(`  ✓ ${name}${detail ? ` ${detail}` : ''}`);
  } else {
    failed++;
    console.log(`  ✗ ${name}${detail ? ` ${detail}` : ''}`);
  }
}

async function main(): Promise<void> {
  console.log('Testing competition & wall flow');
  console.log(`  BASE_URL = ${BASE}\n`);

  // --- Comprobar que el backend responde ---
  try {
    const probe = await fetch(`${BASE}/api/competition/periods`, { method: 'GET' });
    if (!probe.ok && probe.status !== 200) {
      console.error(`  Backend responded with ${probe.status}. Is the server running? (npm run dev)`);
      process.exit(1);
    }
  } catch (e) {
    console.error('  Cannot reach backend at', BASE);
    console.error('  Start the server with: npm run dev');
    process.exit(1);
  }

  // --- Login (optional) ---
  if (ADMIN_EMAIL && ADMIN_PASSWORD) {
    const loginRes = await fetch(`${BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
    });
    const loginData = (await loginRes.json()) as { success?: boolean; token?: string; message?: string };
    if (loginData.token) {
      adminToken = loginData.token;
      ok('Login admin', true);
    } else {
      ok('Login admin', false, loginData.message || 'no token');
    }
  } else {
    console.log('  (Skip admin tests: set ADMIN_EMAIL and ADMIN_PASSWORD to test create/recompute/close)\n');
  }

  // --- Public: GET periods ---
  const periodsRes = await request('GET', '/api/competition/periods');
  const periodsList = Array.isArray(periodsRes.data) ? periodsRes.data : (periodsRes as { data?: unknown }).data;
  ok('GET /api/competition/periods', periodsRes.status === 200 && Array.isArray(periodsList), `status=${periodsRes.status}`);

  // --- Public: GET current period (puede ser null si no hay periodo activo) ---
  const currentRes = await request('GET', '/api/competition/periods/current');
  const currentData = (currentRes as { status: number; data: unknown }).data;
  const currentValid = currentRes.status === 200 && (currentData == null || typeof currentData === 'object');
  ok('GET /api/competition/periods/current', currentValid, `status=${currentRes.status}`);

  // --- Public: GET last-winner ---
  const lastWinnerRes = await request('GET', '/api/competition/last-winner');
  const lastWinnerData = (lastWinnerRes as { status: number; data: unknown }).data;
  const lastWinnerOk = lastWinnerRes.status === 200 && (lastWinnerData === null || (typeof lastWinnerData === 'object' && lastWinnerData !== null));
  ok('GET /api/competition/last-winner', lastWinnerOk, `status=${lastWinnerRes.status}`);

  // --- Public: GET barbers/best (muro) ---
  const bestRes = await fetch(`${BASE}/api/barbers/best?limit=5`);
  const bestJson = (await bestRes.json()) as { success?: boolean; data?: unknown[]; lastWinnerBarberId?: string | null };
  const bestList = bestJson.data;
  const hasLastWinnerField = 'lastWinnerBarberId' in bestJson;
  const firstBarber = Array.isArray(bestList) && bestList.length > 0 ? bestList[0] : null;
  const hasIsLastWinner = firstBarber !== null && typeof firstBarber === 'object' && 'isLastWinner' in (firstBarber as object);
  ok('GET /api/barbers/best', bestRes.status === 200 && Array.isArray(bestList), `status=${bestRes.status}`);
  ok('  response.lastWinnerBarberId', hasLastWinnerField);
  ok('  barbers[].isLastWinner', !Array.isArray(bestList) || bestList.length === 0 || hasIsLastWinner);

  // --- Admin: create period ---
  if (adminToken) {
    const start = new Date();
    start.setDate(1);
    const end = new Date(start);
    end.setMonth(end.getMonth() + 1);
    end.setDate(0);
    const createRes = await request(
      'POST',
      '/api/competition/periods',
      { name: 'Test period script', startDate: start.toISOString(), endDate: end.toISOString(), status: 'DRAFT' },
      true
    );
    const createData = createRes as { status: number; data?: { id?: string } };
    const created = createData.status === 201 && createData.data && typeof createData.data === 'object' && 'id' in createData.data;
    if (created && createData.data && typeof createData.data === 'object') {
      createdPeriodId = (createData.data as { id: string }).id;
    }
    ok('POST /api/competition/periods (create)', createData.status === 201 && !!createdPeriodId, `status=${createData.status}`);

    if (createdPeriodId) {
      const lbRes = await request('GET', `/api/competition/periods/${createdPeriodId}/leaderboard`);
      ok('GET /api/competition/periods/:id/leaderboard', lbRes.status === 200, `status=${lbRes.status}`);

      const recomputeRes = await request('POST', `/api/competition/periods/${createdPeriodId}/recompute`, undefined, true);
      ok('POST /api/competition/periods/:id/recompute', recomputeRes.status === 200, `status=${recomputeRes.status}`);
    }
  }

  console.log('\n--- Result ---');
  console.log(`  Passed: ${passed}, Failed: ${failed}`);
  if (failed > 0) process.exit(1);
  console.log('  All checks passed.\n');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
