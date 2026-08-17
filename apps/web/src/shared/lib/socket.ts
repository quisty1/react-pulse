import { useEffect, useRef } from 'react';
import { io, type Socket } from 'socket.io-client';
import { SOCKET_EVENTS, type MessageDto } from '@pulse/shared';
import { useQueryClient, type InfiniteData } from '@tanstack/react-query';
import type { PaginatedResult } from '@pulse/shared';
import { useAuthStore } from '@/features/auth';
import { create } from 'zustand';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL ?? '';

interface PresenceState {
  onlineIds: Set<string>;
  setOnline: (userId: string, online: boolean) => void;
}

/** Presence: who is online from socket events */
export const usePresenceStore = create<PresenceState>((set) => ({
  onlineIds: new Set(),
  setOnline: (userId, online) =>
    set((state) => {
      const next = new Set(state.onlineIds);
      if (online) next.add(userId);
      else next.delete(userId);
      return { onlineIds: next };
    }),
}));

let socket: Socket | null = null;

export function getSocket(): Socket | null {
  return socket;
}

/** Connects Socket.IO when accessToken is set and syncs the message cache */
export function useSocket() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const qc = useQueryClient();
  const setOnline = usePresenceStore((s) => s.setOnline);
  const connected = useRef(false);

  useEffect(() => {
    if (!accessToken) {
      socket?.disconnect();
      socket = null;
      connected.current = false;
      return;
    }

    socket = io(SOCKET_URL, {
      auth: { token: accessToken },
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
    });

    socket.on('connect', () => {
      connected.current = true;
    });

    // Optimistic update of the messages infinite query
    socket.on(SOCKET_EVENTS.MESSAGE_CREATED, (message: MessageDto) => {
      const key = [
        'messages',
        message.channelId,
        message.conversationId,
        message.parentId,
      ] as const;
      qc.setQueryData<InfiniteData<PaginatedResult<MessageDto>>>(key, (old) => {
        if (!old) return old;
        // Already present by id or clientId (optimistic insert)
        const exists = old.pages.some((p) =>
          p.items.some(
            (m) => m.id === message.id || (message.clientId && m.clientId === message.clientId),
          ),
        );
        if (exists) {
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              items: page.items.map((m) =>
                m.id === message.id || (message.clientId && m.clientId === message.clientId)
                  ? message
                  : m,
              ),
            })),
          };
        }
        const pages = [...old.pages];
        const last = pages[pages.length - 1];
        if (!last) return old;
        pages[pages.length - 1] = { ...last, items: [...last.items, message] };
        return { ...old, pages };
      });
      qc.invalidateQueries({ queryKey: ['channels'] });
      qc.invalidateQueries({ queryKey: ['conversations'] });
    });

    socket.on(SOCKET_EVENTS.MESSAGE_UPDATED, (_message: MessageDto) => {
      qc.invalidateQueries({ queryKey: ['messages'] });
    });

    socket.on(SOCKET_EVENTS.MESSAGE_DELETED, () => {
      qc.invalidateQueries({ queryKey: ['messages'] });
    });

    socket.on(SOCKET_EVENTS.REACTION_ADDED, () => {
      qc.invalidateQueries({ queryKey: ['messages'] });
    });

    socket.on(SOCKET_EVENTS.REACTION_REMOVED, () => {
      qc.invalidateQueries({ queryKey: ['messages'] });
    });

    socket.on(SOCKET_EVENTS.PRESENCE_UPDATE, (payload: { userId: string; status: string }) => {
      setOnline(payload.userId, payload.status === 'online');
    });

    return () => {
      socket?.disconnect();
      socket = null;
      connected.current = false;
    };
  }, [accessToken, qc, setOnline]);
}

export function joinChannelRoom(channelId: string) {
  socket?.emit(SOCKET_EVENTS.JOIN_CHANNEL, channelId);
}

export function leaveChannelRoom(channelId: string) {
  socket?.emit(SOCKET_EVENTS.LEAVE_CHANNEL, channelId);
}

export function joinConversationRoom(conversationId: string) {
  socket?.emit(SOCKET_EVENTS.JOIN_CONVERSATION, conversationId);
}

export function leaveConversationRoom(conversationId: string) {
  socket?.emit(SOCKET_EVENTS.LEAVE_CONVERSATION, conversationId);
}

export function joinWorkspaceRoom(workspaceId: string) {
  socket?.emit(SOCKET_EVENTS.JOIN_WORKSPACE, workspaceId);
}

export function emitTyping(
  payload: { channelId?: string; conversationId?: string },
  active: boolean,
) {
  socket?.emit(active ? SOCKET_EVENTS.TYPING_START : SOCKET_EVENTS.TYPING_STOP, payload);
}
