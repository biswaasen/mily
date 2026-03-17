import { useMemo } from 'react';
import { getIpcRenderer } from '../utils/ipc';

export const useIpc = () => {
  return useMemo(() => getIpcRenderer(), []);
};

