import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ApiResponse, CreateWorkspaceInput, WorkspaceDto } from '@pulse/shared';
import { api } from '@/shared/api';

export function useWorkspaces() {
  return useQuery({
    queryKey: ['workspaces'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<WorkspaceDto[]>>('/workspaces');
      if (!data.success) throw new Error(data.error.message);
      return data.data;
    },
  });
}

export function useCreateWorkspace() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateWorkspaceInput) => {
      const { data } = await api.post<ApiResponse<WorkspaceDto>>('/workspaces', input);
      if (!data.success) throw new Error(data.error.message);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workspaces'] }),
  });
}

export function useWorkspace(workspaceId?: string) {
  return useQuery({
    queryKey: ['workspaces', workspaceId],
    enabled: Boolean(workspaceId),
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<WorkspaceDto>>(`/workspaces/${workspaceId}`);
      if (!data.success) throw new Error(data.error.message);
      return data.data;
    },
  });
}
