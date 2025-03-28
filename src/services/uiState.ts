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
})); 