import React, { useState } from 'react';
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
import { JobService } from '../../services';
import { Bookmark, ExternalLink } from 'lucide-react-native';

export default function JobSearchScreen() {
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [parsedProfile, setParsedProfile] = useState<any>(null);
  const [bookmarkedIds, setBookmarkedIds] = useState<Record<string, boolean>>({});

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
        copyToCacheDirectory: true,
      });

      if (!res.canceled && res.assets && res.assets.length > 0) {
        setSelectedFile(res.assets[0]);
      }
    } catch (err) {
      console.warn('Document picker error', err);
    }
  };

  const handleSearch = async () => {
    if (!selectedFile) {
      alert('Please upload a resume file (PDF, DOCX, or TXT).');
      return;
    }

    setLoading(true);
    try {
      const data = await JobService.uploadAndSearch(
        selectedFile.uri,
        selectedFile.name,
        selectedFile.mimeType || 'application/pdf',
        query.trim(),
        location.trim()
      );
      setResults(data.results || []);
      setParsedProfile(data.parsed_profile || null);
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
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
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

        <TouchableOpacity
          style={styles.searchBtn}
          onPress={handleSearch}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.textInverse} size="small" />
          ) : (
            <Text style={styles.searchBtnText}>Run matching</Text>
          )}
        </TouchableOpacity>
      </View>

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
                  <TouchableOpacity onPress={() => handleToggleBookmark(job)}>
                    <Bookmark
                      size={18}
                      color={COLORS.textPrimary}
                      fill={isBookmarked ? COLORS.textPrimary : 'transparent'}
                    />
                  </TouchableOpacity>
                </View>

                {job.match_score ? (
                  <Text style={styles.jobScore}>{job.match_score}% alignment</Text>
                ) : null}

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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgCanvas,
  },
  content: {
    padding: SPACING.md,
    paddingBottom: 48,
  },
  card: {
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    backgroundColor: COLORS.bgCanvas,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    fontFamily: FONTS.regular,
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
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    borderRadius: 2,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: COLORS.textPrimary,
    fontSize: 13,
    fontFamily: FONTS.regular,
  },
  searchBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 2,
    paddingVertical: 10,
    alignItems: 'center',
  },
  searchBtnText: {
    color: COLORS.textInverse,
    fontSize: 13,
    fontWeight: '600',
    fontFamily: FONTS.medium,
  },
  profileBox: {
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    marginTop: SPACING.md,
    backgroundColor: COLORS.bgSubtle,
  },
  profileRole: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
    fontFamily: FONTS.medium,
  },
  profileSkills: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontFamily: FONTS.regular,
    marginTop: 2,
  },
  resultsList: {
    marginTop: SPACING.lg,
    gap: SPACING.sm,
  },
  resultsHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    fontFamily: FONTS.regular,
    marginBottom: SPACING.xs,
  },
  jobItem: {
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  jobTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    fontFamily: FONTS.medium,
  },
  jobCompany: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontFamily: FONTS.regular,
    marginTop: 2,
  },
  jobScore: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textPrimary,
    fontFamily: FONTS.mono,
    marginTop: 6,
  },
  jobReason: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontFamily: FONTS.regular,
    marginTop: 4,
    lineHeight: 16,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  tag: {
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: COLORS.bgSubtle,
  },
  tagText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontFamily: FONTS.mono,
  },
  applyBtn: {
    marginTop: 12,
    backgroundColor: COLORS.textPrimary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    paddingHorizontal: 12,
    gap: 6,
  },
  applyBtnText: {
    color: COLORS.textInverse,
    fontSize: 12,
    fontWeight: '600',
    fontFamily: FONTS.medium,
  },
});
