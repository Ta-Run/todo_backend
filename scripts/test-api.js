/**
 * Integration test script for Kanri API.
 * Usage: node scripts/test-api.js
 * Requires backend running and MONGODB_URI set in .env
 */

const BASE = process.env.API_URL || 'http://localhost:5000';

async function request(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  return { status: res.status, data };
}

function assert(condition, message) {
  if (!condition) throw new Error(`FAIL: ${message}`);
  console.log(`PASS: ${message}`);
}

async function run() {
  console.log('Testing Kanri API at', BASE);

  const health = await request('/health');
  assert(health.status === 200 && health.data.status === 'ok', 'Health check');

  const ts = Date.now();
  const emailA = `userA_${ts}@test.com`;
  const emailB = `userB_${ts}@test.com`;
  const password = 'password123';

  let res = await request('/api/v1/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ email: emailA, password }),
  });
  assert(res.status === 201, 'User A signup');

  res = await request('/api/v1/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ email: emailB, password }),
  });
  assert(res.status === 201, 'User B signup');

  res = await request('/api/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: emailA, password }),
  });
  assert(res.status === 200 && res.data.token, 'User A login');
  const tokenA = res.data.token;

  res = await request('/api/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: emailB, password }),
  });
  assert(res.status === 200 && res.data.token, 'User B login');
  const tokenB = res.data.token;

  const authA = { Authorization: `Bearer ${tokenA}` };
  const authB = { Authorization: `Bearer ${tokenB}` };

  res = await request('/api/v1/tasks', {
    method: 'POST',
    headers: authA,
    body: JSON.stringify({ title: 'Task A1', note: 'Note A1' }),
  });
  assert(res.status === 201, 'User A creates Task A1');
  const taskA1Id = res.data.task._id;

  res = await request('/api/v1/tasks', {
    method: 'POST',
    headers: authA,
    body: JSON.stringify({ title: 'Task A2' }),
  });
  assert(res.status === 201, 'User A creates Task A2');

  res = await request('/api/v1/tasks', {
    method: 'POST',
    headers: authB,
    body: JSON.stringify({ title: 'Task B1' }),
  });
  assert(res.status === 201, 'User B creates Task B1');

  res = await request('/api/v1/tasks', { headers: authA });
  assert(res.status === 200 && res.data.tasks.length === 2, 'User A sees only own tasks');

  res = await request('/api/v1/tasks', { headers: authB });
  assert(res.status === 200 && res.data.tasks.length === 1, 'User B sees only own tasks');

  res = await request(`/api/v1/tasks/${taskA1Id}`, { headers: authB });
  assert(res.status === 404, 'User B cannot GET User A task');

  res = await request(`/api/v1/tasks/${taskA1Id}`, {
    method: 'PATCH',
    headers: authB,
    body: JSON.stringify({ title: 'Hacked' }),
  });
  assert(res.status === 404, 'User B cannot PATCH User A task');

  res = await request(`/api/v1/tasks/${taskA1Id}`, {
    method: 'DELETE',
    headers: authB,
  });
  assert(res.status === 404, 'User B cannot DELETE User A task');

  res = await request(`/api/v1/tasks/${taskA1Id}`, { headers: authA });
  assert(res.status === 200, 'User A task still exists after User B delete attempt');

  res = await request('/api/v1/tasks');
  assert(res.status === 401, 'Unauthenticated GET tasks returns 401');

  for (let i = 0; i < 25; i++) {
    await request('/api/v1/tasks', {
      method: 'POST',
      headers: authA,
      body: JSON.stringify({ title: `Bulk task ${i}` }),
    });
  }

  res = await request('/api/v1/tasks?page=1&limit=20', { headers: authA });
  assert(res.status === 200 && res.data.tasks.length === 20, 'Pagination page 1');

  res = await request('/api/v1/tasks?page=2&limit=20', { headers: authA });
  assert(res.status === 200 && res.data.tasks.length > 0, 'Pagination page 2');

  res = await request('/api/v1/tasks?status=pending&page=1&limit=20', { headers: authA });
  assert(res.status === 200, 'Status filter + pagination');

  res = await request('/api/v1/tasks?status=invalid', { headers: authA });
  assert(res.status === 400, 'Invalid status returns 400');

  res = await request('/api/v1/tasks?limit=101', { headers: authA });
  assert(res.status === 400, 'Limit > 100 returns 400');

  console.log('\nAll tests passed!');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
