import { create } from 'zustand';
import { api } from '@/lib/api';

interface ScoringConfig {
  groupId: string;
  ruleTypeId: string;
  points: number;
  enabled: boolean;
  ruleType: {
    id: string;
    code: string;
    name: string;
    description: string;
    defaultPoints: number;
  };
}

export interface Group {
  id: string;
  name: string;
  inviteCode: string;
  createdById: string;
  maxMembers: number;
  createdAt: string;
}

interface GroupState {
  activeGroup: Group | null;
  scoringConfigs: ScoringConfig[];
  myGroups: Group[];
  setActiveGroup: (group: Group) => void;
  fetchScoringConfig: (groupId: string) => Promise<ScoringConfig[]>;
  updateScoringConfig: (groupId: string, configs: { ruleTypeId: string; points: number; enabled: boolean }[]) => Promise<void>;
  fetchMyGroups: () => Promise<void>;
}

export const useGroupStore = create<GroupState>((set) => ({
  activeGroup: null,
  scoringConfigs: [],
  myGroups: [],
  setActiveGroup: (group) => set({ activeGroup: group }),
  fetchScoringConfig: async (groupId) => {
    try {
      const response = await api.get(`/groups/${groupId}/scoring-config`);
      const configs = response.data.data;
      set({ scoringConfigs: configs });
      return configs;
    } catch (error) {
      console.error('Error fetching scoring config:', error);
      return [];
    }
  },
  updateScoringConfig: async (groupId, configs) => {
    try {
      const response = await api.put(`/groups/${groupId}/scoring-config`, { configs });
      set({ scoringConfigs: response.data.data });
    } catch (error) {
      console.error('Error updating scoring config:', error);
      throw error;
    }
  },
  fetchMyGroups: async () => {
    try {
      const response = await api.get('/groups/me');
      set({ myGroups: response.data.data });
    } catch (error) {
      console.error('Error fetching my groups:', error);
    }
  }
}));
