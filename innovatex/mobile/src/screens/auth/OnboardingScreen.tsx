import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import { useAuth } from '../../context/AuthContext';
import { AuthService, JobService } from '../../services';
import { COLORS, FONTS, SPACING } from '../../constants/theme';
import {
  FileText,
  UploadCloud,
  CheckCircle2,
  ArrowRight,
  Briefcase,
  Sparkles,
  AlertCircle
} from 'lucide-react-native';
import Svg, { Path } from 'react-native-svg';

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { user, updateUser } = useAuth();

  // Determine provider logic
  const isGithubUser = user?.authProvider === 'github' || Boolean(user?.githubUsername);
  const isGoogleUser = user?.authProvider === 'google';

  const [githubUsername, setGithubUsername] = useState(user?.githubUsername || '');
  const [targetRole, setTargetRole] = useState(user?.targetRole || 'Software Engineer');
  const [selectedResume, setSelectedResume] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [uploadProgressText, setUploadProgressText] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handlePickResume = async () => {
    try {
      setErrorMsg('');
      const res = await DocumentPicker.getDocumentAsync({
        type: [
          'application/pdf',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'text/plain'
        ],
        copyToCacheDirectory: false,
      });

      if (!res.canceled && res.assets && res.assets.length > 0) {
        const picked = res.assets[0];
        try {
          const FileSystem = require('expo-file-system/legacy');
          const cacheDir = FileSystem.cacheDirectory || FileSystem.documentDirectory;
          if (cacheDir && picked.uri) {
            const safeName = `resume_onboarding_${Date.now()}_${(picked.name || 'resume.pdf').replace(/\s+/g, '_')}`;
            const destUri = `${cacheDir}${safeName}`;
            await FileSystem.copyAsync({
              from: picked.uri,
              to: destUri,
            });
            setSelectedResume({ ...picked, uri: destUri });
            return;
          }
        } catch (copyErr) {
          console.warn('Cache copy warning:', copyErr);
        }
        setSelectedResume(picked);
      }
    } catch (err: any) {
      console.warn('Picker error:', err);
      setErrorMsg('Failed to select file. Please try again.');
    }
  };

  const handleCompleteOnboarding = async () => {
    if (!selectedResume) {
      setErrorMsg('Please upload your resume to complete your profile setup.');
      return;
    }

    // Non-github users (Email/password or Google) should provide or confirm their GitHub username
    if (!isGithubUser && !githubUsername.trim()) {
      setErrorMsg('Please enter your GitHub username to link developer metrics.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setUploadProgressText('Parsing resume & analyzing skills...');

    try {
      // Step 1: Send resume to JobService to extract structured profile
      let parsedSkills: string[] = user?.skills || ['TypeScript', 'React'];
      let parsedRole = targetRole;

      try {
        const searchRes = await JobService.uploadAndSearch(
          selectedResume.uri,
          selectedResume.name || 'resume.pdf',
          selectedResume.mimeType || 'application/pdf',
          targetRole,
          'India / Remote'
        );

        if (searchRes?.parsed_profile) {
          const p = searchRes.parsed_profile;
          if (Array.isArray(p.skills) && p.skills.length > 0) {
            parsedSkills = p.skills;
          }
          if (p.current_role) {
            parsedRole = p.current_role;
          }
        }
      } catch (resumeParseErr: any) {
        console.warn('Resume parse warning (continuing onboarding):', resumeParseErr.message);
      }

      setUploadProgressText('Finalizing your developer profile...');

      // Step 2: Complete onboarding in backend
      const res = await AuthService.completeOnboarding({
        githubUsername: isGithubUser ? user?.githubUsername : githubUsername.trim(),
        targetRole: parsedRole,
        skills: parsedSkills,
      });

      if (res?.user) {
        updateUser({
          ...res.user,
          hasCompletedOnboarding: true,
        });
      } else {
        updateUser({
          hasCompletedOnboarding: true,
          githubUsername: githubUsername.trim(),
          targetRole: parsedRole,
          skills: parsedSkills,
        });
      }
    } catch (err: any) {
      console.error('Onboarding failure:', err);
      setErrorMsg(err.response?.data?.error || err.message || 'Failed to complete profile setup.');
    } finally {
      setLoading(false);
      setUploadProgressText('');
    }
  };

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 24), paddingBottom: Math.max(insets.bottom, 24) }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header Badge & Title */}
        <View style={styles.header}>
          <View style={styles.badge}>
            <Sparkles color="#FFFFFF" size={12} strokeWidth={2.5} />
            <Text style={styles.badgeText}>SETUP PROFILE</Text>
          </View>
          <Text style={styles.title}>Let's build your profile</Text>
          <Text style={styles.subtitle}>
            {isGithubUser
              ? 'Your GitHub is connected! Upload your resume so our AI can match you with targeted jobs and internships.'
              : isGoogleUser
              ? 'Welcome via Google! Upload your resume and connect your GitHub username to personalize recommendations.'
              : 'Welcome! Upload your resume and link your GitHub username to access curated opportunities.'}
          </Text>
        </View>

        {/* Error message */}
        {errorMsg ? (
          <View style={styles.errorBanner}>
            <AlertCircle color="#FF4D4D" size={16} />
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        ) : null}

        {/* Section 1: Resume Upload (Mandatory for all) */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.iconCircle}>
              <FileText color="#FFFFFF" size={18} />
            </View>
            <View style={styles.cardHeaderText}>
              <Text style={styles.cardTitle}>1. Upload Resume</Text>
              <Text style={styles.cardSubtitle}>PDF, DOCX, or TXT (Max 10MB)</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.uploadBox, selectedResume && styles.uploadBoxSelected]}
            onPress={handlePickResume}
            activeOpacity={0.8}
          >
            {selectedResume ? (
              <View style={styles.selectedFileRow}>
                <CheckCircle2 color="#22C55E" size={24} />
                <View style={styles.selectedFileInfo}>
                  <Text style={styles.selectedFileName} numberOfLines={1}>
                    {selectedResume.name}
                  </Text>
                  <Text style={styles.selectedFileSize}>
                    {selectedResume.size ? `${(selectedResume.size / 1024).toFixed(0)} KB • Tap to replace` : 'Ready to parse • Tap to replace'}
                  </Text>
                </View>
              </View>
            ) : (
              <View style={styles.uploadPlaceholder}>
                <UploadCloud color="#888888" size={32} strokeWidth={1.5} />
                <Text style={styles.uploadPromptTitle}>Tap to select resume</Text>
                <Text style={styles.uploadPromptSubtitle}>Our AI parses your skills & experiences instantly</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Section 2: GitHub Profile */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.iconCircle}>
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="#FFFFFF">
                <Path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </Svg>
            </View>
            <View style={styles.cardHeaderText}>
              <Text style={styles.cardTitle}>2. GitHub Profile</Text>
              <Text style={styles.cardSubtitle}>
                {isGithubUser ? 'Auto-detected from your GitHub account' : 'Used to audit code quality & match repos'}
              </Text>
            </View>
          </View>

          {isGithubUser ? (
            <View style={styles.githubLinkedBox}>
              <CheckCircle2 color="#22C55E" size={20} />
              <Text style={styles.githubLinkedText}>
                Linked as <Text style={styles.githubLinkedUsername}>@{user?.githubUsername || 'connected'}</Text>
              </Text>
            </View>
          ) : (
            <View style={styles.inputWrapper}>
              <Text style={styles.inputPrefix}>github.com/</Text>
              <TextInput
                style={styles.input}
                placeholder="username"
                placeholderTextColor="#555555"
                value={githubUsername}
                onChangeText={setGithubUsername}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          )}
        </View>

        {/* Section 3: Target Role Preference */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.iconCircle}>
              <Briefcase color="#FFFFFF" size={18} />
            </View>
            <View style={styles.cardHeaderText}>
              <Text style={styles.cardTitle}>3. Target Role</Text>
              <Text style={styles.cardSubtitle}>Your primary role interest</Text>
            </View>
          </View>

          <TextInput
            style={styles.roleInput}
            placeholder="e.g. Full Stack Developer, ML Engineer, Backend..."
            placeholderTextColor="#555555"
            value={targetRole}
            onChangeText={setTargetRole}
          />
        </View>

        {/* Progress text if parsing */}
        {uploadProgressText ? (
          <View style={styles.progressContainer}>
            <ActivityIndicator size="small" color="#FFFFFF" />
            <Text style={styles.progressText}>{uploadProgressText}</Text>
          </View>
        ) : null}

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleCompleteOnboarding}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#000000" />
          ) : (
            <>
              <Text style={styles.submitButtonText}>Complete Setup & Explore Jobs</Text>
              <ArrowRight color="#000000" size={18} strokeWidth={2.2} />
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  header: {
    marginTop: 10,
    marginBottom: 24,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    alignSelf: 'flex-start',
    gap: 6,
    marginBottom: 12,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '700',
    fontFamily: FONTS.medium,
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subtitle: {
    color: '#888888',
    fontSize: 14,
    lineHeight: 20,
    fontFamily: FONTS.regular,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A1010',
    borderColor: '#FF4D4D',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    gap: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 13,
    flex: 1,
  },
  card: {
    backgroundColor: '#0F0F0F',
    borderColor: '#1E1E1E',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#1C1C1C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardHeaderText: {
    flex: 1,
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    fontFamily: FONTS.medium,
  },
  cardSubtitle: {
    color: '#777777',
    fontSize: 12,
    marginTop: 2,
    fontFamily: FONTS.regular,
  },
  uploadBox: {
    backgroundColor: '#141414',
    borderColor: '#262626',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadBoxSelected: {
    borderStyle: 'solid',
    borderColor: '#333333',
    backgroundColor: '#161616',
    padding: 14,
  },
  uploadPlaceholder: {
    alignItems: 'center',
    gap: 6,
  },
  uploadPromptTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 6,
  },
  uploadPromptSubtitle: {
    color: '#777777',
    fontSize: 12,
    textAlign: 'center',
  },
  selectedFileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    width: '100%',
  },
  selectedFileInfo: {
    flex: 1,
  },
  selectedFileName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  selectedFileSize: {
    color: '#888888',
    fontSize: 12,
    marginTop: 2,
  },
  githubLinkedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#141414',
    borderWidth: 1,
    borderColor: '#262626',
    borderRadius: 8,
    padding: 12,
    gap: 10,
  },
  githubLinkedText: {
    color: '#BBBBBB',
    fontSize: 14,
  },
  githubLinkedUsername: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#141414',
    borderWidth: 1,
    borderColor: '#262626',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 46,
  },
  inputPrefix: {
    color: '#666666',
    fontSize: 14,
    fontFamily: FONTS.regular,
  },
  input: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: FONTS.regular,
    paddingLeft: 2,
  },
  roleInput: {
    backgroundColor: '#141414',
    borderWidth: 1,
    borderColor: '#262626',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 46,
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: FONTS.regular,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginVertical: 12,
  },
  progressText: {
    color: '#CCCCCC',
    fontSize: 13,
  },
  submitButton: {
    backgroundColor: '#FFFFFF',
    height: 50,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#000000',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
});
