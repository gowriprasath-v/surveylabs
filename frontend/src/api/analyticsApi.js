import client from './client';

export async function getGlobalAnalytics(range = '12M') {
  const response = await client.get(`/admin/analytics/global?range=${range}`);
  return response.data.data;
}

export async function getConversationalSessions(query = '') {
  const suffix = query ? `?${query}` : '';
  const response = await client.get(`/admin/analytics/conversations${suffix}`);
  return response.data.data;
}

export async function exportData(format = 'csv', range = '12M') {
  const response = await client.get(`/admin/export/${format}?range=${range}`, {
    responseType: 'blob',
  });
  const mimeType = format === 'json' ? 'application/json' : 'text/csv';
  const blob = new Blob([response.data], { type: mimeType });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `surveylabs_export_${Date.now()}.${format}`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}
