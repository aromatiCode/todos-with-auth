import { supabase, EDGE_FUNCTION_URL } from './supabase';

/**
 * Get the auth token for API calls
 */
async function getAuthToken() {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || null;
}

/**
 * Make authenticated request to Edge Function
 */
async function fetchEdgeFunction(endpoint, options = {}) {
  const token = await getAuthToken();
  
  if (!token) {
    throw new Error('Not authenticated');
  }

  // Clean up the endpoint - remove leading/trailing slashes
  const cleanEndpoint = endpoint.replace(/^\//, '').replace(/\/$/, '');
  const url = cleanEndpoint ? `${EDGE_FUNCTION_URL}/${cleanEndpoint}` : EDGE_FUNCTION_URL;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers
    }
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Request failed');
  }

  return data;
}

/**
 * Get all todos for the current user
 */
export async function getTodos() {
  return fetchEdgeFunction('', {
    method: 'GET'
  });
}

/**
 * Create a new todo
 * @param {string} title - The todo title
 * @param {boolean} completed - Whether the todo is completed (default: false)
 */
export async function createTodo(title, completed = false) {
  return fetchEdgeFunction('', {
    method: 'POST',
    body: JSON.stringify({ title, completed })
  });
}

/**
 * Update a todo
 * @param {string} id - The todo ID
 * @param {object} updates - Fields to update (title, completed)
 */
export async function updateTodo(id, updates) {
  return fetchEdgeFunction(`/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates)
  });
}

/**
 * Delete a todo
 * @param {string} id - The todo ID
 */
export async function deleteTodo(id) {
  return fetchEdgeFunction(`/${id}`, {
    method: 'DELETE'
  });
}
