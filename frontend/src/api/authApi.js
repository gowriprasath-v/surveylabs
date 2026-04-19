import client from './client';

export async function login(username, password) {
  const response = await client.post('/auth/login', { username, password });
  return response.data.data; // { accessToken, refreshToken, user }
}

export async function register(username, password) {
  const response = await client.post('/auth/register', { username, password });
  return response.data.data;
}

export async function getMe() {
  const response = await client.get('/auth/me');
  return response.data.data; // { user }
}

export async function resetInitialPassword(newPassword) {
  const response = await client.post('/auth/reset-initial-password', { newPassword });
  return response.data.data;
}

export async function changePassword(currentPassword, newPassword) {
  const response = await client.post('/auth/change-password', { currentPassword, newPassword });
  return response.data.data;
}

export async function deleteAccount() {
  const response = await client.delete('/auth/me');
  return response.data;
}
