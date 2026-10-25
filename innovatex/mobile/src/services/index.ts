import apiClient from './apiClient';

export const AuthService = {
  getProfile: async () => {
    const res = await apiClient.get('/auth/profile');
    return res.data;
  },
  updateProfile: async (data: any) => {
    const res = await apiClient.put('/auth/profile', data);
    return res.data;
  },
};

export const GithubService = {
  analyze: async (username: string) => {
    const res = await apiClient.post('/github/analyze', { username });
    return res.data;
  },
  getLatest: async () => {
    const res = await apiClient.get('/github/latest');
    return res.data;
  },
  generateAiFix: async (actionType: string, report: any, targetRepo?: string) => {
    const res = await apiClient.post('/github/ai-generate', {
      action_type: actionType,
      report,
      target_repo: targetRepo,
    });
    return res.data;
  },
};

export const JobService = {
  uploadAndSearch: async (fileUri: string, fileName: string, fileType: string, query?: string, location?: string) => {
    const formData = new FormData();

    formData.append('resume', {
      uri: fileUri,
      name: fileName || 'resume.pdf',
      type: fileType || 'application/pdf',
    } as any);

    if (query) formData.append('query', query);
    if (location) formData.append('location', location);

    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    const token = await AsyncStorage.getItem('auth_token');

    const { API_CONFIG } = require('../config/api');
    const response = await fetch(`${API_CONFIG.NODE_URL}/api/jobs/search`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Job search pipeline failed.');
    }
    return data;
  },
  getBookmarks: async () => {
    const res = await apiClient.get('/jobs/bookmarks');
    return res.data;
  },
  bookmarkJob: async (jobData: any) => {
    const res = await apiClient.post('/jobs/bookmark', jobData);
    return res.data;
  },
  updateBookmarkStatus: async (id: string, status: string, notes?: string) => {
    const res = await apiClient.patch(`/jobs/bookmark/${id}/status`, { status, notes });
    return res.data;
  },
};

export const MarketService = {
  getTrending: async () => {
    const res = await apiClient.get('/market/trending');
    return res.data;
  },
  getSnapshot: async () => {
    const res = await apiClient.get('/market/snapshot');
    return res.data;
  },
  getSkillHistory: async (skill: string) => {
    const res = await apiClient.get(`/market/history/${skill}`);
    return res.data;
  },
  getGapReport: async (userSkills: string[]) => {
    const res = await apiClient.post('/market/gap-report', { user_skills: userSkills });
    return res.data;
  },
};

export const ContestService = {
  getContests: async (platform?: string) => {
    const res = await apiClient.get('/contests', {
      params: { platform: platform || 'all' },
    });
    return res.data;
  },
  getPersonalized: async (skillLevel: string, platforms?: string[]) => {
    const res = await apiClient.post('/contests/personalized', {
      skill_level: skillLevel,
      preferred_platforms: platforms,
    });
    return res.data;
  },
};

export const OpenSourceService = {
  findOpportunities: async (skills: string[], experienceLevel: string, preferredLanguage: string) => {
    const res = await apiClient.post('/opensource/find', {
      skills,
      experience_level: experienceLevel,
      preferred_language: preferredLanguage,
    });
    return res.data;
  },
  getGuide: async (issueUrl: string, repoName: string, issueNumber: number, issueTitle?: string) => {
    const res = await apiClient.post('/opensource/guide', {
      issue_url: issueUrl,
      repo_name: repoName,
      issue_number: issueNumber,
      issue_title: issueTitle,
    });
    return res.data;
  },
  reviewCode: async (userCode: string, issueUrl: string, originalCode?: string) => {
    const res = await apiClient.post('/opensource/review', {
      user_code: userCode,
      issue_url: issueUrl,
      original_code: originalCode,
    });
    return res.data;
  },
};

export const ResearchService = {
  explainPaper: async (input: string) => {
    const res = await apiClient.post('/research/explain', { input });
    return res.data;
  },
};
