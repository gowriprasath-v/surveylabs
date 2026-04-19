/* eslint-disable no-console */
const WebSocket = require('ws');

const DEFAULT_API_BASE = 'http://localhost:3001/api';
const API_BASE = process.env.API_BASE || DEFAULT_API_BASE;
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASS || 'admin123';
const ADMIN_PASS_NEW = process.env.ADMIN_PASS_NEW || 'admin1234';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function toWsBase(apiBase) {
  try {
    const url = new URL(apiBase);
    url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
    url.pathname = '';
    return url.toString().replace(/\/$/, '');
  } catch {
    return apiBase.replace(/^http/, 'ws').replace(/\/api\/?$/, '');
  }
}

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

async function wsEchoTest() {
  const wsBase = toWsBase(API_BASE);
  const wsUrl = `${wsBase}`;

  return new Promise((resolve, reject) => {
    const a = new WebSocket(wsUrl);
    const b = new WebSocket(wsUrl);

    const timeout = setTimeout(() => {
      a.close();
      b.close();
      reject(new Error('WebSocket echo test timed out'));
    }, 4000);

    let openCount = 0;
    const payload = { type: 'ping', ts: Date.now() };

    const onOpen = () => {
      openCount += 1;
      if (openCount === 2) {
        a.send(JSON.stringify(payload));
      }
    };

    a.on('open', onOpen);
    b.on('open', onOpen);

    b.on('message', (msg) => {
      try {
        const parsed = JSON.parse(msg.toString());
        if (parsed.type === payload.type && parsed.ts === payload.ts) {
          clearTimeout(timeout);
          a.close();
          b.close();
          resolve(true);
        }
      } catch {
        // ignore
      }
    });

    a.on('error', (err) => {
      clearTimeout(timeout);
      b.close();
      reject(err);
    });
    b.on('error', (err) => {
      clearTimeout(timeout);
      a.close();
      reject(err);
    });
  });
}

async function run() {
  console.log(`E2E test starting against ${API_BASE}`);

  let token;
  let refreshToken;
  let surveyId;
  let convoSurveyId;
  let questionIds = [];

  try {
    // 1. Login
    const loginRes = await api('/auth/login', {
      method: 'POST',
      body: { username: ADMIN_USER, password: ADMIN_PASS },
    });
    token = loginRes?.data?.accessToken;
    refreshToken = loginRes?.data?.refreshToken;
    if (!token) throw new Error('Missing access token from login');
    console.log('✓ Login');

    // 2. Refresh token
    const refreshRes = await api('/auth/refresh', {
      method: 'POST',
      body: { refreshToken },
    });
    if (!refreshRes?.data?.accessToken) throw new Error('Missing access token from refresh');
    token = refreshRes.data.accessToken;
    console.log('✓ Refresh token');

    // 3. Reset initial password if required (ignore if not needed)
    try {
      await api('/auth/reset-initial-password', {
        method: 'POST',
        token,
        body: { newPassword: ADMIN_PASS_NEW },
      });
      console.log('✓ Reset initial password');

      const relogin = await api('/auth/login', {
        method: 'POST',
        body: { username: ADMIN_USER, password: ADMIN_PASS_NEW },
      });
      token = relogin?.data?.accessToken;
      refreshToken = relogin?.data?.refreshToken;
      if (!token) throw new Error('Missing access token after password reset');
      console.log('✓ Login after reset');
    } catch (err) {
      if (err.status !== 400) throw err;
      console.log('✓ Password reset not required');
    }

    // 4. Create survey with questions
    const surveyPayload = {
      title: `E2E Survey ${Date.now()}`,
      description: 'Automated E2E survey',
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
    questionIds = createRes?.data?.questions?.map((q) => q.id) || [];
    console.log('✓ Create survey');

    // 5. Update survey title + description
    await api(`/admin/surveys/${surveyId}`, {
      method: 'PUT',
      token,
      body: { title: `${surveyPayload.title} Updated`, description: 'Updated description' },
    });
    console.log('✓ Update survey');

    // 6. Add question
    const addedQuestion = await api(`/admin/surveys/${surveyId}/questions`, {
      method: 'POST',
      token,
      body: { type: 'text_short', label: 'Quick feedback?', required: false },
    });
    const addedId = addedQuestion?.data?.id;
    if (!addedId) throw new Error('Missing question id from addQuestion');
    questionIds.push(addedId);
    console.log('✓ Add question');

    // 7. Update question + reorder
    const updateTargetId = questionIds[0];
    await api(`/admin/surveys/${surveyId}/questions/${updateTargetId}`, {
      method: 'PUT',
      token,
      body: { label: 'How would you rate us today?', order_index: 2 },
    });
    console.log('✓ Update question');

    // 8. Update logic rules
    await api(`/admin/surveys/${surveyId}/questions/${updateTargetId}/logic`, {
      method: 'PUT',
      token,
      body: { logic_rules: [{ if_answer_equals: '1', then_end_survey: true }] },
    });
    console.log('✓ Update logic rules');

    // 9. Publish (ensure active)
    await api(`/admin/surveys/${surveyId}/publish`, {
      method: 'POST',
      token,
    });
    console.log('✓ Publish survey');

    // 10. Fetch public survey
    const publicRes = await api(`/public/surveys/${surveyId}`);
    const questions = publicRes?.data?.questions || [];
    if (questions.length === 0) throw new Error('Public survey returned no questions');
    console.log('✓ Fetch public survey');

    // 11. Submit response
    const ratingQ = questions.find((q) => q.type === 'rating');
    const mcqQ = questions.find((q) => q.type === 'mcq');
    const textQ = questions.find((q) => q.type === 'text_long' || q.type === 'text_short' || q.type === 'text');
    const answers = [
      ratingQ && { question_id: ratingQ.id, answer_value: '5' },
      mcqQ && { question_id: mcqQ.id, answer_value: mcqQ.options?.[0] || 'Yes' },
      textQ && { question_id: textQ.id, answer_value: 'E2E feedback' },
    ].filter(Boolean);

    await api(`/public/surveys/${surveyId}/respond`, {
      method: 'POST',
      body: { answers, completionTimeMs: 4200 },
    });
    console.log('✓ Submit response');

    await sleep(200);

    // 12. Results, pulse, responses
    const resultsRes = await api(`/admin/surveys/${surveyId}/results`, { token });
    const total = resultsRes?.data?.stats?.total_responses ?? 0;
    if (total < 1) throw new Error('Results show 0 responses');
    console.log('✓ Fetch results');

    await api(`/admin/surveys/${surveyId}/pulse`, { token });
    console.log('✓ Fetch pulse');

    await api(`/admin/surveys/${surveyId}/responses`, { token });
    console.log('✓ Fetch individual responses');

    // 13. Global analytics
    await api('/admin/analytics/global', { token });
    console.log('✓ Fetch global analytics');

    // 14. Export CSV + JSON
    await api('/admin/export/csv', { token });
    await api('/admin/export/json', { token });
    console.log('✓ Export CSV/JSON');

    // 15. Conversational flow
    const convoSurvey = await api('/admin/surveys', {
      method: 'POST',
      token,
      body: {
        title: `E2E Convo ${Date.now()}`,
        description: 'Conversational E2E survey',
        mode: 'conversational',
        questions: [
          { label: 'First question?', type: 'text_long', required: true, order_index: 0 },
          { label: 'Second question?', type: 'text_long', required: true, order_index: 1 },
        ],
      },
    });
    convoSurveyId = convoSurvey?.data?.id;
    if (!convoSurveyId) throw new Error('Missing conversational survey id');
    console.log('✓ Create conversational survey');

    const convoPublic = await api(`/public/surveys/${convoSurveyId}`);
    const convoQuestions = convoPublic?.data?.questions || [];
    if (convoQuestions.length === 0) throw new Error('Conversational public survey returned no questions');
    await api(`/public/surveys/${convoSurveyId}/respond`, {
      method: 'POST',
      body: {
        answers: convoQuestions.map((q, idx) => ({ question_id: q.id, answer_value: `Answer ${idx + 1}` })),
        completionTimeMs: 5400,
      },
    });
    console.log('✓ Submit conversational response');

    await api('/admin/analytics/conversations', { token });
    console.log('✓ Fetch conversational sessions');

    // 16. WebSocket broadcast test
    await wsEchoTest();
    console.log('✓ WebSocket broadcast');

    // 17. Delete survey + question
    if (addedId) {
      await api(`/admin/surveys/${surveyId}/questions/${addedId}`, { method: 'DELETE', token });
      console.log('✓ Delete question');
    }
    await api(`/admin/surveys/${surveyId}`, { method: 'DELETE', token });
    console.log('✓ Delete survey');

    if (convoSurveyId) {
      await api(`/admin/surveys/${convoSurveyId}`, { method: 'DELETE', token });
      console.log('✓ Delete conversational survey');
    }

    console.log('E2E test completed successfully.');
  } catch (err) {
    console.error('E2E test failed.');
    console.error(err.message);
    if (err.payload) {
      console.error('Payload:', JSON.stringify(err.payload, null, 2));
    }
    process.exitCode = 1;
  }
}

run();
