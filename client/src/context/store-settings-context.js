import { createContext, useContext } from 'react';

export const StoreSettingsContext = createContext(null);

export const useStoreSettings = () => useContext(StoreSettingsContext) ?? {};
