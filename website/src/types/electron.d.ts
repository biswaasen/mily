interface ElectronAPI {
    sendAuthToken: (token: string) => void;
  }
  
  interface Window {
    electronAPI?: ElectronAPI;
  }