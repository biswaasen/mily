export const getBackendUrl = (): string => {
  if (typeof window === "undefined") {
    return "";
  }
  return process.env.NEXT_PUBLIC_BACKEND_URL || "";
};

export const apiConfig = {
  baseUrl: getBackendUrl(),
  headers: {
    "Content-Type": "application/json",
  },
};

export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public statusText?: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export const handleApiResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    throw new ApiError(
      `Backend error: ${response.statusText}`,
      response.status,
      response.statusText
    );
  }

  return response.json();
};

