import { create } from 'zustand';

interface AuthUIState {
  isSignUpModalOpen: boolean;
  isLoginPopoverOpen: boolean;
  openSignUpModal: () => void;
  closeSignUpModal: () => void;
  openSignUpFromLogin: () => void;
  openLoginPopover: () => void;
  closeLoginPopover: () => void;
  closeAllAuth: () => void;
  // Aliases para compatibilidade com Home.tsx
  openRegister: () => void;
  openLogin: () => void;
}

export const useAuthUIStore = create<AuthUIState>((set) => ({
  isSignUpModalOpen: false,
  isLoginPopoverOpen: false,
  openSignUpModal: () => set({ isSignUpModalOpen: true }),
  closeSignUpModal: () => set({ isSignUpModalOpen: false }),
  openSignUpFromLogin: () => set({ isSignUpModalOpen: true }),
  openLoginPopover: () => set({ isLoginPopoverOpen: true }),
  closeLoginPopover: () => set({ isLoginPopoverOpen: false }),
  closeAllAuth: () => set({ isSignUpModalOpen: false, isLoginPopoverOpen: false }),
  // Aliases para compatibilidade com Home.tsx
  openRegister: () => set({ isSignUpModalOpen: true }),
  openLogin: () => set({ isLoginPopoverOpen: true }),
})); 