import client from './client';

export async function getSurveys() {
  const response = await client.get('/admin/surveys');
  return response.data.data;
}

export async function getSurvey(id) {
  const response = await client.get(`/admin/surveys/${id}`);
  return response.data.data;
}

export async function createSurvey(payload) {
  const response = await client.post('/admin/surveys', payload);
  return response.data.data;
}

export async function updateSurvey(id, payload) {
  const response = await client.put(`/admin/surveys/${id}`, payload);
  return response.data.data;
}

export async function deleteSurvey(id) {
  const response = await client.delete(`/admin/surveys/${id}`);
  return response.data.data;
}

export async function addQuestion(surveyId, payload) {
  const response = await client.post(`/admin/surveys/${surveyId}/questions`, payload);
  return response.data.data;
}

export async function updateQuestion(surveyId, qId, payload) {
  const response = await client.put(`/admin/surveys/${surveyId}/questions/${qId}`, payload);
  return response.data.data;
}

export async function deleteQuestion(surveyId, qId) {
  const response = await client.delete(`/admin/surveys/${surveyId}/questions/${qId}`);
  return response.data.data;
}

export async function updateLogicRules(surveyId, qId, logicRules) {
  const response = await client.put(`/admin/surveys/${surveyId}/questions/${qId}/logic`, { logic_rules: logicRules });
  return response.data.data;
}

export async function getResults(surveyId) {
  const response = await client.get(`/admin/surveys/${surveyId}/results`);
  return response.data.data;
}

export async function getPulse(surveyId) {
  const response = await client.get(`/admin/surveys/${surveyId}/pulse`);
  return response.data.data;
}

export async function getPublicSurvey(id) {
  const response = await client.get(`/public/surveys/${id}`);
  return response.data.data;
}

export async function getIndividualResponses(id) {
  const response = await client.get(`/admin/surveys/${id}/responses`);
  return response.data.data;
}
