import { Response } from 'express';
import axios from 'axios';
import FormData from 'form-data';
import JobSearchHistory from '../models/JobSearchHistory.js';
import JobBookmark from '../models/JobBookmark.js';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';

export const searchJobs = async (req: AuthenticatedRequest, res: Response) => {
  try {
    let fileBuffer: Buffer | undefined = req.file?.buffer;
    let fileName: string = req.file?.originalname || 'resume.pdf';
    let fileMime: string = req.file?.mimetype || 'application/pdf';

    if (!fileBuffer && req.body?.base64) {
      fileBuffer = Buffer.from(req.body.base64, 'base64');
      fileName = req.body.filename || 'resume.pdf';
      fileMime = req.body.mimetype || 'application/pdf';
    }

    if (!fileBuffer) {
      return res.status(400).json({ error: 'Please upload a PDF, DOCX, or TXT resume file.' });
    }

    const pythonUrl = process.env.PYTHON_SERVICE_URL || 'http://localhost:8000';

    // Prepare multipart form data to forward to FastAPI
    const form = new FormData();
    form.append('resume', fileBuffer, {
      filename: fileName,
      contentType: fileMime
    });

    if (req.body?.query) {
      form.append('query', req.body.query);
    }
    if (req.body?.location) {
      form.append('location', req.body.location);
    }
    if (req.body?.work_type) {
      form.append('work_type', req.body.work_type);
    }
    if (req.body?.job_type) {
      form.append('job_type', req.body.job_type);
    }
    if (req.body?.country) {
      form.append('country', req.body.country);
    }
    if (req.body?.source) {
      form.append('source', req.body.source);
    }

    const pyRes = await axios.post(`${pythonUrl}/jobs/search`, form, {
      headers: {
        ...form.getHeaders()
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      timeout: 120000
    });

    const { parsed_profile, results } = pyRes.data;

    // Save to JobSearchHistory
    const historyDoc = new JobSearchHistory({
      userId: req.user!._id,
      parsedProfile: parsed_profile || {},
      results: results || [],
      searchedAt: new Date()
    });
    await historyDoc.save();

    // Auto-update user profile with parsed skills and role if candidate skills exist
    try {
      const User = (await import('../models/User.js')).default;
      const user = await User.findById(req.user!._id);
      if (user) {
        let changed = false;
        if (parsed_profile?.skills?.length && (!user.skills || user.skills.length === 0)) {
          user.skills = parsed_profile.skills;
          changed = true;
        }
        if (parsed_profile?.current_role && (!user.targetRole || user.targetRole === 'Software Engineer')) {
          user.targetRole = parsed_profile.current_role;
          changed = true;
        }
        if (fileName) {
          user.resumeFileName = fileName;
          changed = true;
        }
        if (changed) {
          await user.save();
        }
      }
    } catch (e) {
      // Non-critical profile sync error
    }

    return res.status(200).json({
      history_id: historyDoc._id,
      parsed_profile,
      results
    });
  } catch (err: any) {
    console.error('Job search error:', err.response?.data || err.message);
    const msg = err.response?.data?.detail || err.message || 'Job search pipeline failed.';
    return res.status(500).json({ error: msg });
  }
};

export const getHistory = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const history = await JobSearchHistory.find({ userId: req.user!._id })
      .sort({ searchedAt: -1 })
      .limit(10)
      .select('searchedAt parsedProfile.name parsedProfile.current_role results');

    return res.status(200).json(history);
  } catch (err) {
    console.error('Job history error:', err);
    return res.status(500).json({ error: 'Failed to retrieve job search history.' });
  }
};

export const getHistoryById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const doc = await JobSearchHistory.findOne({ _id: id, userId: req.user!._id });
    if (!doc) {
      return res.status(404).json({ error: 'Search history record not found or access denied.' });
    }
    return res.status(200).json(doc);
  } catch (err) {
    console.error('Job history by id error:', err);
    return res.status(500).json({ error: 'Failed to retrieve job search record.' });
  }
};

export const bookmarkJob = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      jobId,
      title,
      company,
      location,
      employmentType,
      salaryRange,
      applyLink,
      matchScore,
      matchReason,
      skillOverlap,
      missingSkills,
      status,
      notes,
      rawJobData
    } = req.body;

    if (!jobId || !title) {
      return res.status(400).json({ error: 'jobId and title are required.' });
    }

    let bookmark = await JobBookmark.findOne({ userId: req.user!._id, jobId });
    if (bookmark) {
      if (req.body.toggle) {
        await JobBookmark.deleteOne({ _id: bookmark._id });
        return res.status(200).json({ bookmarked: false, message: 'Bookmark removed.' });
      }
      if (status) bookmark.status = status;
      if (notes !== undefined) bookmark.notes = notes;
      bookmark.updatedAt = new Date();
      await bookmark.save();
      return res.status(200).json({ bookmarked: true, bookmark, message: 'Bookmark updated.' });
    }

    bookmark = new JobBookmark({
      userId: req.user!._id,
      jobId,
      title,
      company: company || 'Unknown Company',
      location: location || 'Remote',
      employmentType: employmentType || 'FULLTIME',
      salaryRange: salaryRange || 'Competitive',
      applyLink: applyLink || '',
      matchScore: matchScore || 0,
      matchReason: matchReason || '',
      skillOverlap: skillOverlap || [],
      missingSkills: missingSkills || [],
      status: status || 'Saved',
      notes: notes || '',
      rawJobData: rawJobData || {}
    });

    await bookmark.save();
    return res.status(201).json({ bookmarked: true, bookmark, message: 'Job saved to tracker.' });
  } catch (err) {
    console.error('Bookmark job error:', err);
    return res.status(500).json({ error: 'Failed to bookmark job.' });
  }
};

export const getBookmarks = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status } = req.query as { status?: string };
    const filter: Record<string, any> = { userId: req.user!._id };
    if (status && status !== 'ALL') {
      filter.status = status;
    }

    const bookmarks = await JobBookmark.find(filter).sort({ updatedAt: -1 });
    return res.status(200).json(bookmarks);
  } catch (err) {
    console.error('Get bookmarks error:', err);
    return res.status(500).json({ error: 'Failed to retrieve job bookmarks.' });
  }
};

export const updateBookmarkStatus = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const validStatuses = ['Saved', 'Applied', 'Interviewing', 'Offer', 'Rejected'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    const bookmark = await JobBookmark.findOne({ _id: id, userId: req.user!._id });
    if (!bookmark) {
      return res.status(404).json({ error: 'Bookmark not found.' });
    }

    if (status) bookmark.status = status;
    if (notes !== undefined) bookmark.notes = notes;
    bookmark.updatedAt = new Date();

    await bookmark.save();
    return res.status(200).json({ message: 'Status updated successfully.', bookmark });
  } catch (err) {
    console.error('Update bookmark status error:', err);
    return res.status(500).json({ error: 'Failed to update application status.' });
  }
};

export const deleteBookmark = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const result = await JobBookmark.deleteOne({ _id: id, userId: req.user!._id });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Bookmark not found.' });
    }
    return res.status(200).json({ message: 'Bookmark removed successfully.' });
  } catch (err) {
    console.error('Delete bookmark error:', err);
    return res.status(500).json({ error: 'Failed to delete bookmark.' });
  }
};
