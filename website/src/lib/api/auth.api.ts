import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import { getBackendUrl, handleApiResponse } from "./api.config";

export interface LoginResponse {
  auth_token: string;
}

export const authApi = {
  async loginWithGoogle(): Promise<LoginResponse> {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    const idToken = await user.getIdToken();

    const backendUrl = getBackendUrl();
    if (!backendUrl) {
      throw new Error("Backend URL is not configured");
    }

    const response = await fetch(`${backendUrl}/api/v1/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ idToken }),
    });

    const backendData = await handleApiResponse<LoginResponse>(response);

    if (!backendData.auth_token) {
      throw new Error("No auth token received from backend");
    }

    return backendData;
  },

  async authenticateForDownload(): Promise<LoginResponse> {
    return this.loginWithGoogle();
  },
};

