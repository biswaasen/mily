declare const window: Window & { require: (module: string) => any };

export const getIpcRenderer = () => {
  if (typeof window !== 'undefined' && window.require) {
    try {
      return window.require('electron').ipcRenderer;
    } catch (error) {
      console.error('Failed to get IPC renderer:', error);
      throw new Error('IPC Renderer not available');
    }
  }
  throw new Error('IPC Renderer not available');
};

export const getConfig = async () => {
  if (typeof window !== 'undefined' && window.require) {
    const ipcRenderer = window.require('electron').ipcRenderer;
    return await ipcRenderer.invoke('get-config');
  }
  throw new Error('IPC Renderer not available');
};

export const invokeWithTimeout = async <T>(
  invokeFn: () => Promise<T>,
  timeoutMs: number = 5000,
  errorMessage: string = 'IPC connection timeout'
): Promise<T> => {
  return Promise.race([
    invokeFn(),
    new Promise<T>((_, reject) => 
      setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
    )
  ]);
};

