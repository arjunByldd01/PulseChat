import { create } from "zustand";

export interface Message {
  id: string;
  content: string;
  userId: string;
  userName: string;
  channelId: string;
  createdAt: string;
}

interface WorkspaceStore {
  activeChannelId: string | null;
  messages: Record<string, Message[]>;
  searchOpen: boolean;
  setActiveChannel: (channelId: string) => void;
  setSearchOpen: (open: boolean) => void;
  appendMessage: (channelId: string, message: Message) => void;
  prependMessages: (channelId: string, messages: Message[]) => void;
  setMessages: (channelId: string, messages: Message[]) => void;
}

export const useWorkspaceStore = create<WorkspaceStore>((set) => ({
  activeChannelId: null,
  messages: {},
  searchOpen: false,
  setActiveChannel: (channelId) => set({ activeChannelId: channelId }),
  setSearchOpen: (open) => set({ searchOpen: open }),
  appendMessage: (channelId, message) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [channelId]: [...(state.messages[channelId] ?? []), message],
      },
    })),
  prependMessages: (channelId, messages) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [channelId]: [...messages, ...(state.messages[channelId] ?? [])],
      },
    })),
  setMessages: (channelId, messages) =>
    set((state) => ({
      messages: { ...state.messages, [channelId]: messages },
    })),
}));
