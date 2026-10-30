import * as FileSystemLegacy from 'expo-file-system/legacy';
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
  completeOnboarding: async (data: {
    githubUsername?: string;
    targetRole?: string;
    skills?: string[];
    resumeText?: string;
    resumeFileName?: string;
  }) => {
    const res = await apiClient.post('/auth/onboarding', data);
    return res.data;
  },
  getQuotas: async () => {
    const res = await apiClient.get('/auth/quotas');
    return res.data;
  },
  deleteAccount: async () => {
    const res = await apiClient.delete('/auth/account');
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
  uploadAndSearch: async (
    fileUri: string,
    fileName: string,
    fileType: string,
    query?: string,
    location?: string,
    filters?: {
      work_type?: string;
      job_type?: string;
      country?: string;
      source?: string;
    }
  ) => {
    // Read file as Base64 and send via apiClient
    // apiClient has automatic exponential retry for Render cold starts (502, 503, 504)
    let base64Data = '';
    if (fileUri && fileUri.trim() !== '') {
      try {
        base64Data = await FileSystemLegacy.readAsStringAsync(fileUri, {
          encoding: FileSystemLegacy.EncodingType.Base64,
        });
      } catch (e) {
        console.warn('Could not read file as base64 from fileUri, proceeding with profile data:', e);
      }
    }

    const res = await apiClient.post('/jobs/search', {
      ...(base64Data ? { base64: base64Data } : {}),
      filename: fileName || 'resume.pdf',
      mimetype: fileType || 'application/pdf',
      query,
      location,
      work_type: filters?.work_type,
      job_type: filters?.job_type,
      country: filters?.country,
      source: filters?.source,
    });
    return res.data;
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
  forecastSkill: async (skill: string, userSkills?: string[]) => {
    const res = await apiClient.post('/market/forecast', { skill, user_skills: userSkills || [] });
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
  findOpportunities: async (skills: string[], experienceLevel: string, preferredLanguage: string, customQuery?: string) => {
    const res = await apiClient.post('/opensource/find', {
      skills,
      experience_level: experienceLevel,
      preferred_language: preferredLanguage,
      query: customQuery || '',
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

export const ReportService = {
  getDashboardStats: async () => {
    const res = await apiClient.get('/reports/dashboard-stats');
    return res.data;
  },
};
