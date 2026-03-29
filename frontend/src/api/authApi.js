import client from './client';

export async function login(username, password) {
  const response = await client.post('/auth/login', { username, password });
  return response.data.data; // { token, user }
}

export async function register(username, password) {
  const response = await client.post('/auth/register', { username, password });
  return response.data.data;
}

export async function getMe() {
  const response = await client.get('/auth/me');
  return response.data.data; // { user }
}
