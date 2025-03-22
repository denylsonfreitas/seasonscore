import { create } from 'zustand';

interface AuthUIState {
  isLoginPopoverOpen: boolean;
  isSignUpModalOpen: boolean;
  openLoginPopover: () => void;
  closeLoginPopover: () => void;
  openSignUpModal: () => void;
  closeSignUpModal: () => void;
  openSignUpFromLogin: () => void;
}

export const useAuthUIStore = create<AuthUIState>((set) => ({
  isLoginPopoverOpen: false,
  isSignUpModalOpen: false,
  openLoginPopover: () => set({ isLoginPopoverOpen: true, isSignUpModalOpen: false }),
  closeLoginPopover: () => set({ isLoginPopoverOpen: false }),
  openSignUpModal: () => set({ isSignUpModalOpen: true, isLoginPopoverOpen: false }),
  closeSignUpModal: () => set({ isSignUpModalOpen: false }),
  openSignUpFromLogin: () => set({ isLoginPopoverOpen: false, isSignUpModalOpen: true }),
})); 