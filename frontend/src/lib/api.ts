// Dynamically determine the API URL based on the current hostname
function getApiUrl(): string {
  if (typeof window === 'undefined') {
    // Server-side: use localhost
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  }

  // Client-side: use the same host as the frontend
  const hostname = window.location.hostname;
  const protocol = window.location.protocol; // http: or https:

  // Always use port 3001 for the backend
  return `${protocol}//${hostname}:3001`;
}

export interface CreateSessionRequest {
  name?: string;
  template: string;
  timerDuration?: number;
  votesPerUser?: number;
  iceBreaker?: string;
}

export interface CreateSessionResponse {
  sessionId: string;
  hostId: string;
  url: string;
}

export async function createSession(data: CreateSessionRequest): Promise<CreateSessionResponse> {
  const apiUrl = getApiUrl();
  console.log('🌐 Creating session via:', apiUrl);

  const response = await fetch(`${apiUrl}/api/sessions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create session');
  }

  return response.json();
}

export async function getSession(sessionId: string) {
  const apiUrl = getApiUrl();
  const response = await fetch(`${apiUrl}/api/sessions/${sessionId}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch session');
  }

  return response.json();
}
