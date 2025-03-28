import { create } from 'zustand';

interface AuthUIState {
  isSignUpModalOpen: boolean;
  openSignUpModal: () => void;
  closeSignUpModal: () => void;
  openSignUpFromLogin: () => void;
  closeAllAuth: () => void;
}

export const useAuthUIStore = create<AuthUIState>((set) => ({
  isSignUpModalOpen: false,
  openSignUpModal: () => set({ isSignUpModalOpen: true }),
  closeSignUpModal: () => set({ isSignUpModalOpen: false }),
  openSignUpFromLogin: () => set({ isSignUpModalOpen: true }),
  closeAllAuth: () => set({ isSignUpModalOpen: false }),
})); 