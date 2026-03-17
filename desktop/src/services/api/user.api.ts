import { UserProfile } from '../../types';
import { getAuthHeaders, handleApiResponse, ApiError } from './api.config';

export interface UserResponse {
  success: boolean;
  user: UserProfile;
}

export interface UpdateUserRequest {
  memory?: any;
  history?: boolean;
}

export class UserApi {
  constructor(
    private backendUrl: string,
    private getToken: () => Promise<string | null>
  ) {}

  async getUser(): Promise<UserProfile> {
    const headers = await getAuthHeaders(this.getToken);
    
    const response = await fetch(`${this.backendUrl}/api/v1/user`, {
      headers,
    });

    const data = await handleApiResponse<UserResponse>(response);
    
    if (!data.success || !data.user) {
      throw new ApiError('Invalid user data received');
    }

    return data.user;
  }

  async updateUser(updates: UpdateUserRequest): Promise<UserProfile> {
    const headers = await getAuthHeaders(this.getToken);
    
    const response = await fetch(`${this.backendUrl}/api/v1/user`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(updates),
    });

    const data = await handleApiResponse<UserResponse>(response);
    
    if (!data.success || !data.user) {
      throw new ApiError('Failed to update user');
    }

    return data.user;
  }
}

