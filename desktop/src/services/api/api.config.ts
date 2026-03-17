export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public statusText?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const getAuthHeaders = async (getToken: () => Promise<string | null>): Promise<Record<string, string>> => {
  const token = await getToken();
  
  if (!token) {
    throw new ApiError('Not authenticated', 401);
  }

  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};

export const handleApiResponse = async <T>(response: Response): Promise<T> => {
  if (response.status === 401) {
    throw new ApiError('Authentication required', 401);
  }

  if (!response.ok) {
    throw new ApiError(`Request failed: ${response.statusText}`, response.status, response.statusText);
  }

  return response.json();
};

