import client from './client';

export async function submitResponse(surveyId, answers, completionTimeMs) {
  const response = await client.post(`/public/surveys/${surveyId}/respond`, {
    answers,
    completionTimeMs: completionTimeMs || null,
  });
  return response.data.data;
}
