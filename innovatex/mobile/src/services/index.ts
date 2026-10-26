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
  }) => {
    const res = await apiClient.post('/auth/onboarding', data);
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
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    const token = await AsyncStorage.getItem('auth_token');
    const { API_CONFIG } = require('../config/api');

    let targetUri = fileUri;
    try {
      const cacheDir = FileSystemLegacy.cacheDirectory || FileSystemLegacy.documentDirectory;
      if (cacheDir && !targetUri.startsWith(cacheDir)) {
        const destUri = `${cacheDir}upload_${Date.now()}_${(fileName || 'resume.pdf').replace(/\s+/g, '_')}`;
        await FileSystemLegacy.copyAsync({
          from: targetUri,
          to: destUri,
        });
        targetUri = destUri;
      }
    } catch (e) {
      console.warn('Could not mirror file to cache directory, trying direct URI', e);
    }

    // Try multipart uploadAsync first
    try {
      const uploadType = FileSystemLegacy?.FileSystemUploadType?.MULTIPART ?? 1;
      const uploadRes = await (FileSystemLegacy.uploadAsync || (FileSystemLegacy as any).default?.uploadAsync)(
        `${API_CONFIG.NODE_URL}/api/jobs/search`,
        targetUri,
        {
          fieldName: 'resume',
          httpMethod: 'POST',
          uploadType,
          headers: {
            Accept: 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          parameters: {
            ...(query ? { query } : {}),
            ...(location ? { location } : {}),
            ...(filters?.work_type ? { work_type: filters.work_type } : {}),
            ...(filters?.job_type ? { job_type: filters.job_type } : {}),
            ...(filters?.country ? { country: filters.country } : {}),
            ...(filters?.source ? { source: filters.source } : {}),
          },
        }
      );

      let data;
      try {
        data = JSON.parse(uploadRes.body);
      } catch {
        data = { error: uploadRes.body };
      }

      if (uploadRes.status >= 200 && uploadRes.status < 300) {
        return data;
      }
      if (uploadRes.status >= 400 && data.error && !data.error.includes('isn\'t readable')) {
        throw new Error(data.error);
      }
    } catch (uploadErr: any) {
      console.warn('uploadAsync failed, falling back to base64 payload:', uploadErr.message);
    }

    // Fallback: Read file as Base64 and send via JSON payload
    try {
      let base64Data: string;
      try {
        base64Data = await FileSystemLegacy.readAsStringAsync(targetUri, {
          encoding: FileSystemLegacy.EncodingType.Base64,
        });
      } catch {
        base64Data = await FileSystemLegacy.readAsStringAsync(fileUri, {
          encoding: FileSystemLegacy.EncodingType.Base64,
        });
      }

      const res = await apiClient.post('/jobs/search', {
        base64: base64Data,
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
    } catch (base64Err: any) {
      throw new Error(base64Err.response?.data?.error || base64Err.message || 'Job search upload failed');
    }
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
