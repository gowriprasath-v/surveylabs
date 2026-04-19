/* eslint-disable no-console */
const DEFAULT_API_BASE = 'http://localhost:3001/api';
const API_BASE = process.env.API_BASE || DEFAULT_API_BASE;
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASS || 'admin123';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function api(path, { method = 'GET', token, body } = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }
  if (!res.ok) {
    const msg = data?.error || data?.message || res.statusText;
    const err = new Error(`${method} ${path} -> ${res.status}: ${msg}`);
    err.status = res.status;
    err.payload = data;
    throw err;
  }
  return data;
}

async function run() {
  console.log(`Smoke test starting against ${API_BASE}`);

  let token;
  let surveyId;

  try {
    // 1. Login
    const loginRes = await api('/auth/login', {
      method: 'POST',
      body: { username: ADMIN_USER, password: ADMIN_PASS },
    });
    token = loginRes?.data?.accessToken;
    if (!token) throw new Error('Missing access token from login');
    console.log('✓ Login');

    // 2. Create survey with 3 questions
    const surveyPayload = {
      title: `Smoke Test Survey ${Date.now()}`,
      description: 'Automated smoke survey',
      questions: [
        { label: 'How would you rate us?', type: 'rating', required: true, order_index: 0 },
        { label: 'Would you recommend us?', type: 'mcq', options: ['Yes', 'No'], required: true, order_index: 1 },
        { label: 'Any comments?', type: 'text_long', required: false, order_index: 2 },
      ],
    };
    const createRes = await api('/admin/surveys', {
      method: 'POST',
      token,
      body: surveyPayload,
    });
    surveyId = createRes?.data?.id;
    if (!surveyId) throw new Error('Missing survey id from createSurvey');
    console.log('✓ Create survey');

    // 3. Fetch public survey
    const publicRes = await api(`/public/surveys/${surveyId}`);
    const questions = publicRes?.data?.questions || [];
    if (questions.length === 0) throw new Error('Public survey returned no questions');
    console.log('✓ Fetch public survey');

    // 4. Submit response
    const ratingQ = questions.find((q) => q.type === 'rating');
    const mcqQ = questions.find((q) => q.type === 'mcq');
    const textQ = questions.find((q) => q.type === 'text_long' || q.type === 'text_short' || q.type === 'text');

    const answers = [
      ratingQ && { question_id: ratingQ.id, answer_value: '5' },
      mcqQ && { question_id: mcqQ.id, answer_value: mcqQ.options?.[0] || 'Yes' },
      textQ && { question_id: textQ.id, answer_value: 'Smoke test feedback' },
    ].filter(Boolean);

    await api(`/public/surveys/${surveyId}/respond`, {
      method: 'POST',
      body: { answers, completionTimeMs: 4200 },
    });
    console.log('✓ Submit response');

    // give DB a moment to settle
    await sleep(200);

    // 5. Fetch results
    const resultsRes = await api(`/admin/surveys/${surveyId}/results`, {
      token,
    });
    const total = resultsRes?.data?.stats?.total_responses ?? 0;
    if (total < 1) throw new Error('Results show 0 responses');
    console.log('✓ Fetch results');

    console.log('Smoke test completed successfully.');
  } catch (err) {
    console.error('Smoke test failed.');
    console.error(err.message);
    if (err.payload) {
      console.error('Payload:', JSON.stringify(err.payload, null, 2));
    }
    process.exitCode = 1;
  } finally {
    if (token && surveyId) {
      try {
        await api(`/admin/surveys/${surveyId}`, { method: 'DELETE', token });
        console.log('✓ Cleanup: survey deleted');
      } catch (cleanupErr) {
        console.warn('Cleanup failed:', cleanupErr.message);
      }
    }
  }
}

run();
