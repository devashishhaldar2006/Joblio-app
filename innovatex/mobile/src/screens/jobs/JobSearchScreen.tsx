import AiLoadingIndicator from '../../components/AiLoadingIndicator';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  Linking,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { COLORS, FONTS, SPACING } from '../../constants/theme';
import { AuthService, JobService } from '../../services';
import { ExternalLink, FileText, CheckCircle2 } from 'lucide-react-native';
import AppHeader from '../../components/AppHeader';
import { useAuth } from '../../context/AuthContext';

export default function JobSearchScreen() {
  const { user, updateUser } = useAuth();
  const [selectedFile, setSelectedFile] = useState<any>(
    user?.resumeFileName ? { name: user.resumeFileName, isExisting: true } : null
  );
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [parsedProfile, setParsedProfile] = useState<any>(null);
  const [bookmarkedIds, setBookmarkedIds] = useState<Record<string, boolean>>({});

  // Filter states
  const [jobType, setJobType] = useState<'both' | 'job' | 'internship'>('both');
  const [workType, setWorkType] = useState<'all' | 'remote' | 'onsite' | 'hybrid'>('all');
  const [country, setCountry] = useState<'all' | 'india'>('all');
  const [source, setSource] = useState<'all' | 'linkedin' | 'ycombinator' | 'internshala'>('all');

  useEffect(() => {
    const fetchExistingBookmarks = async () => {
      try {
        const bookmarks = await JobService.getBookmarks();
        if (Array.isArray(bookmarks)) {
          const map: Record<string, boolean> = {};
          bookmarks.forEach((b: any) => {
            if (b.jobId) map[b.jobId] = true;
          });
          setBookmarkedIds(map);
        }
      } catch (e) {
        // Silently skip if user is not authenticated or offline
      }
    };
    fetchExistingBookmarks();
  }, []);

  const handleOpenApplyLink = async (url: string) => {
    if (!url) return;
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        await Linking.openURL(url.startsWith('http') ? url : `https://${url}`);
      }
    } catch (e) {
      console.warn('Error opening URL', e);
    }
  };

  const handlePickDocument = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'],
        copyToCacheDirectory: false,
      });

      if (!res.canceled && res.assets && res.assets.length > 0) {
        const picked = res.assets[0];
        try {
          const FileSystem = require('expo-file-system/legacy');
          const cacheDir = FileSystem.cacheDirectory || FileSystem.documentDirectory;
          if (cacheDir && picked.uri) {
            const safeName = `resume_${Date.now()}_${picked.name || 'resume.pdf'}`.replace(/\s+/g, '_');
            const destUri = `${cacheDir}${safeName}`;
            await FileSystem.copyAsync({
              from: picked.uri,
              to: destUri,
            });
            setSelectedFile({
              ...picked,
              uri: destUri,
            });
            return;
          }
        } catch (copyErr) {
          console.warn('Failed to cache picked file locally, using raw uri', copyErr);
        }
        setSelectedFile(picked);
      }
    } catch (err) {
      console.warn('Document picker error', err);
    }
  };

  const handleSearch = async () => {
    const resumeToUse = selectedFile || (user?.resumeFileName ? { name: user.resumeFileName, isExisting: true } : null);
    if (!resumeToUse) {
      alert('Please upload a resume file (PDF, DOCX, or TXT).');
      return;
    }

    setLoading(true);
    try {
      const data = await JobService.uploadAndSearch(
        resumeToUse.uri || '',
        resumeToUse.name || 'resume.pdf',
        resumeToUse.mimeType || 'application/pdf',
        query.trim(),
        location.trim(),
        {
          work_type: workType,
          job_type: jobType,
          country: country,
          source: source,
        }
      );
      setResults(data.results || []);
      setParsedProfile(data.parsed_profile || null);
      if (resumeToUse.name) {
        updateUser({ hasResume: true, resumeFileName: resumeToUse.name });
        try {
          await AuthService.updateProfile({ resumeFileName: resumeToUse.name });
        } catch (syncErr) {
          console.warn('Failed to sync resume name to backend profile:', syncErr);
        }
      }
    } catch (e: any) {
      alert(e.response?.data?.error || e.message || 'Job search failed');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleBookmark = async (job: any) => {
    const jobId = job.job_id || job.id || job.title;
    try {
      await JobService.bookmarkJob({
        jobId,
        title: job.title,
        company: job.company,
        location: job.location,
        salaryRange: job.salary || 'Competitive',
        applyLink: job.apply_link || job.url,
        matchScore: job.match_score || 85,
        matchReason: job.match_reason || '',
        skillOverlap: job.skill_overlap || [],
        missingSkills: job.missing_skills || [],
        toggle: true,
      });

      setBookmarkedIds((prev) => ({
        ...prev,
        [jobId]: !prev[jobId],
      }));
    } catch (e) {
      console.warn('Bookmark error', e);
    }
  };

  return (
    <View style={styles.container}>
      <AppHeader
        title="Jobs & Matches"
        badge="Active"
        badgeType="yellow"
        subtitle="Resume-aligned engineering listings"
      />
      <ScrollView contentContainerStyle={styles.content}>
        {/* Upload & Query Box */}
        <View style={styles.card}>
        <Text style={styles.cardTitle}>Resume Analysis & Role Matching</Text>
        <Text style={styles.cardSub}>
          Select your resume file to match open engineering listings by competency.
        </Text>

        <TouchableOpacity style={styles.uploadArea} onPress={handlePickDocument} activeOpacity={0.7}>
          <Text style={styles.uploadText}>
            {selectedFile ? selectedFile.name : 'Choose file (PDF, DOCX, TXT)'}
          </Text>
          {selectedFile && <Text style={styles.uploadSub}>File attached</Text>}
        </TouchableOpacity>

        <View style={styles.inputStack}>
          <TextInput
            style={styles.textInput}
            placeholder="Role filter (optional)"
            placeholderTextColor={COLORS.textMuted}
            value={query}
            onChangeText={setQuery}
          />
          <TextInput
            style={styles.textInput}
            placeholder="Location filter (e.g. Remote)"
            placeholderTextColor={COLORS.textMuted}
            value={location}
            onChangeText={setLocation}
          />
        </View>

        {/* Multi-Dimensional Filters */}
        <View style={styles.filterSection}>
          {/* Opportunity Type */}
          <Text style={styles.filterSectionLabel}>OPPORTUNITY TYPE</Text>
          <View style={styles.filterRow}>
            {(['both', 'job', 'internship'] as const).map((type) => {
              const active = jobType === type;
              return (
                <TouchableOpacity
                  key={type}
                  style={[styles.filterChip, active && styles.filterChipActive]}
                  onPress={() => setJobType(type)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                    {type === 'both' ? 'Both' : type === 'job' ? 'Jobs' : 'Internships'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Workplace Type */}
          <Text style={[styles.filterSectionLabel, { marginTop: 10 }]}>WORKPLACE</Text>
          <View style={styles.filterRow}>
            {(['all', 'remote', 'hybrid', 'onsite'] as const).map((wt) => {
              const active = workType === wt;
              return (
                <TouchableOpacity
                  key={wt}
                  style={[styles.filterChip, active && styles.filterChipActive]}
                  onPress={() => setWorkType(wt)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                    {wt === 'all' ? 'All' : wt.charAt(0).toUpperCase() + wt.slice(1)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Location / India Filter */}
          <Text style={[styles.filterSectionLabel, { marginTop: 10 }]}>GEOGRAPHY</Text>
          <View style={styles.filterRow}>
            {(['all', 'india'] as const).map((loc) => {
              const active = country === loc;
              return (
                <TouchableOpacity
                  key={loc}
                  style={[styles.filterChip, active && styles.filterChipActive]}
                  onPress={() => setCountry(loc)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                    {loc === 'all' ? 'Global' : 'India-Based Only 🇮🇳'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Platform / Source */}
          <Text style={[styles.filterSectionLabel, { marginTop: 10 }]}>SOURCE PLATFORM</Text>
          <View style={styles.filterRow}>
            {(['all', 'linkedin', 'ycombinator', 'internshala'] as const).map((src) => {
              const active = source === src;
              const label =
                src === 'all'
                  ? 'All Platforms'
                  : src === 'linkedin'
                  ? 'LinkedIn'
                  : src === 'ycombinator'
                  ? 'Y Combinator'
                  : 'Internshala';
              return (
                <TouchableOpacity
                  key={src}
                  style={[styles.filterChip, active && styles.filterChipActive]}
                  onPress={() => setSource(src)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <TouchableOpacity
          style={[styles.searchBtn, loading && { opacity: 0.7 }]}
          onPress={handleSearch}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.textInverse} size="small" />
          ) : (
            <Text style={styles.searchBtnText}>Run Matching with Filters</Text>
          )}
        </TouchableOpacity>
      </View>

      {loading && (
        <AiLoadingIndicator
          title="Matching Resume with Active Jobs..."
          defaultSubtitle="Extracting technical profile and matching against verified engineering listings."
        />
      )}

      {/* Candidate Profile summary */}
      {parsedProfile && (
        <View style={styles.profileBox}>
          <Text style={styles.profileRole}>Candidate: {parsedProfile.current_role || 'Developer'}</Text>
          <Text style={styles.profileSkills}>
            Identified: {(parsedProfile.skills || []).slice(0, 6).join(', ')}
          </Text>
        </View>
      )}

      {/* Results */}
      {results.length > 0 && (
        <View style={styles.resultsList}>
          <Text style={styles.resultsHeader}>Matches ({results.length})</Text>
          {results.map((job, idx) => {
            const jobId = job.job_id || job.id || job.title;
            const isBookmarked = !!bookmarkedIds[jobId];
            return (
              <View key={idx} style={styles.jobItem}>
                <View style={styles.jobHeader}>
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <Text style={styles.jobTitle}>{job.title}</Text>
                    <Text style={styles.jobCompany}>{job.company} · {job.location || 'Remote'}</Text>
                  </View>

                </View>

                <View style={styles.jobMetaRow}>
                  {job.source ? (
                    <View style={styles.platformBadge}>
                      <Text style={styles.platformBadgeText}>{job.source.toUpperCase()}</Text>
                    </View>
                  ) : null}
                  {job.match_score ? (
                    <Text style={styles.jobScore}>{job.match_score}% alignment</Text>
                  ) : null}
                </View>

                {job.match_reason ? (
                  <Text style={styles.jobReason}>{job.match_reason}</Text>
                ) : null}

                {job.skill_overlap && job.skill_overlap.length > 0 && (
                  <View style={styles.tagRow}>
                    {job.skill_overlap.slice(0, 5).map((s: string, sIdx: number) => (
                      <View key={sIdx} style={styles.tag}>
                        <Text style={styles.tagText}>{s}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {(job.apply_link || job.url) && (
                  <TouchableOpacity
                    style={styles.applyBtn}
                    onPress={() => handleOpenApplyLink(job.apply_link || job.url)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.applyBtnText}>Apply Now</Text>
                    <ExternalLink size={13} color={COLORS.textInverse} />
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </View>
      )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgCanvas,
  },
  content: {
    padding: SPACING.md,
    paddingTop: 12,
    paddingBottom: 90,
  },
  card: {
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: SPACING.md,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    fontFamily: FONTS.medium,
  },
  cardSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontFamily: FONTS.regular,
    marginTop: 4,
    lineHeight: 16,
    marginBottom: SPACING.md,
  },
  uploadArea: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: COLORS.borderStrong,
    backgroundColor: COLORS.bgSubtle,
    borderRadius: 8,
    padding: SPACING.md,
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  uploadText: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontFamily: FONTS.regular,
    fontWeight: '500',
  },
  uploadSub: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontFamily: FONTS.mono,
    marginTop: 2,
  },
  inputStack: {
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  textInput: {
    backgroundColor: COLORS.bgInput,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: COLORS.textPrimary,
    fontSize: 13,
    fontFamily: FONTS.regular,
  },
  searchBtn: {
    backgroundColor: COLORS.textPrimary,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  searchBtnText: {
    color: COLORS.textInverse,
    fontSize: 13,
    fontWeight: '600',
    fontFamily: FONTS.medium,
  },
  filterSection: {
    marginTop: 14,
    marginBottom: 6,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#1A1A1A',
  },
  filterSectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#777777',
    fontFamily: FONTS.mono,
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  filterChip: {
    backgroundColor: '#141414',
    borderWidth: 1,
    borderColor: '#262626',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  filterChipActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
  },
  filterChipText: {
    color: '#888888',
    fontSize: 11,
    fontFamily: FONTS.medium,
  },
  filterChipTextActive: {
    color: '#000000',
    fontWeight: '700',
  },
  profileBox: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: SPACING.md,
    marginTop: SPACING.md,
    backgroundColor: COLORS.bgCard,
  },
  profileRole: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    fontFamily: FONTS.medium,
  },
  profileSkills: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontFamily: FONTS.regular,
    marginTop: 4,
  },
  resultsList: {
    marginTop: SPACING.lg,
    gap: SPACING.sm,
  },
  resultsHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    fontFamily: FONTS.medium,
    marginBottom: SPACING.xs,
  },
  jobItem: {
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: SPACING.md,
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  jobTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
    fontFamily: FONTS.medium,
    letterSpacing: -0.2,
  },
  jobCompany: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontFamily: FONTS.regular,
    marginTop: 2,
  },
  jobMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  platformBadge: {
    backgroundColor: COLORS.accentSubtle,
    borderWidth: 1,
    borderColor: 'rgba(56, 139, 253, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  platformBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.accentText,
    fontFamily: FONTS.mono,
    letterSpacing: 0.5,
  },
  jobScore: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.statusSuccessText,
    fontFamily: FONTS.mono,
    backgroundColor: COLORS.statusSuccessBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  jobReason: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontFamily: FONTS.regular,
    marginTop: 8,
    lineHeight: 18,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  tag: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    backgroundColor: COLORS.bgSubtle,
  },
  tagText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontFamily: FONTS.mono,
  },
  applyBtn: {
    marginTop: 12,
    backgroundColor: COLORS.bgSubtle,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    paddingHorizontal: 12,
    gap: 6,
  },
  applyBtnText: {
    color: COLORS.textPrimary,
    fontSize: 12,
    fontWeight: '600',
    fontFamily: FONTS.medium,
  },
});
