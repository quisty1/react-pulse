import { describe, expect, it } from 'vitest';
import { WorkspaceService } from './workspaces.service.js';

describe('WorkspaceService helpers', () => {
  it('is constructable', () => {
    const service = new WorkspaceService();
    expect(service).toBeInstanceOf(WorkspaceService);
  });
});
