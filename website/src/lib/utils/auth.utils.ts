const AUTH_TOKEN_KEY = "mily_auth_token";

export const authUtils = {
  saveAuthToken(token: string): void {
    if (typeof window !== "undefined") {
      localStorage.setItem(AUTH_TOKEN_KEY, token);
    }
  },

  getAuthToken(): string | null {
    if (typeof window === "undefined") {
      return null;
    }
    return localStorage.getItem(AUTH_TOKEN_KEY);
  },

  removeAuthToken(): void {
    if (typeof window !== "undefined") {
      localStorage.removeItem(AUTH_TOKEN_KEY);
    }
  },

  sendTokenToElectron(token: string): void {
    if (typeof window !== "undefined" && window.electronAPI) {
      window.electronAPI.sendAuthToken(token);
    }
  },

  sendTokenViaDeepLink(token: string): void {
    if (typeof window === "undefined") {
      return;
    }

    const deepLinkUrl = `mily://auth?token=${encodeURIComponent(token)}`;
    window.location.href = deepLinkUrl;
  },

  handleAuthSuccess(token: string): void {
    this.saveAuthToken(token);
    
    if (typeof window !== "undefined" && window.electronAPI) {
      this.sendTokenToElectron(token);
      setTimeout(() => {
        window.location.href = `/`;
      }, 500);
    } else {
      this.sendTokenViaDeepLink(token);
    }
  },

  handleDownloadAuthSuccess(token: string): void {
    this.saveAuthToken(token);
  },

  isAuthenticated(): boolean {
    return !!this.getAuthToken();
  },
};

