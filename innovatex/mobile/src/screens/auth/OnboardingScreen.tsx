import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Modal,
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
  AlertCircle,
  ChevronDown,
  X,
} from 'lucide-react-native';
import Svg, { Path } from 'react-native-svg';

export const POPULAR_ROLES = [
  'Full Stack Engineer',
  'Frontend Developer',
  'Backend Developer',
  'Mobile App Developer (React Native / Flutter)',
  'Software Engineer',
  'AI / Machine Learning Engineer',
  'Data Scientist',
  'DevOps & Cloud Engineer',
  'Systems & C++ Engineer',
  'Cybersecurity Analyst',
  'Blockchain / Web3 Developer',
];

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { user, updateUser } = useAuth();

  const isGithubUser = user?.authProvider === 'github' || Boolean(user?.githubUsername);

  const [githubUsername, setGithubUsername] = useState(user?.githubUsername || '');
  const [targetRole, setTargetRole] = useState(user?.targetRole || 'Full Stack Engineer');
  const [showRoleModal, setShowRoleModal] = useState(false);
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
          'text/plain',
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
    setLoading(true);
    setErrorMsg('');
    setUploadProgressText('Finalizing your developer profile...');

    try {
      let parsedSkills: string[] = user?.skills || ['TypeScript', 'React', 'Node.js'];
      let parsedRole = targetRole;

      // 1. If resume attached, attempt AI extraction & caching
      if (selectedResume?.uri) {
        try {
          setUploadProgressText('Analyzing resume & matching skills...');
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
          console.warn('Resume parse skipped, continuing:', resumeParseErr?.message);
        }
      }

      setUploadProgressText('Saving preferences...');

      // 2. Submit to backend
      const cleanGithub = githubUsername ? githubUsername.trim().replace(/^@/, '') : '';
      const res = await AuthService.completeOnboarding({
        githubUsername: isGithubUser ? user?.githubUsername : cleanGithub,
        targetRole: parsedRole,
        skills: parsedSkills,
        resumeFileName: selectedResume?.name || '',
      });

      if (res?.user) {
        updateUser({
          ...res.user,
          hasCompletedOnboarding: true,
          hasResume: Boolean(selectedResume?.name),
          resumeFileName: selectedResume?.name || '',
        });
      } else {
        updateUser({
          hasCompletedOnboarding: true,
          githubUsername: cleanGithub,
          targetRole: parsedRole,
          skills: parsedSkills,
          hasResume: Boolean(selectedResume?.name),
          resumeFileName: selectedResume?.name || '',
        });
      }
    } catch (err: any) {
      console.warn('Onboarding error, completing locally:', err);
      updateUser({
        hasCompletedOnboarding: true,
        githubUsername: githubUsername.trim(),
        targetRole,
      });
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
            <Text style={styles.badgeText}>GET STARTED</Text>
          </View>
          <Text style={styles.title}>Welcome to Joblio</Text>
          <Text style={styles.subtitle}>
            Select your target career path. GitHub and resume are optional now and can be updated anytime in your profile.
          </Text>
        </View>

        {/* Error banner */}
        {errorMsg ? (
          <View style={styles.errorBanner}>
            <AlertCircle color="#FF4D4D" size={16} />
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        ) : null}

        {/* Section 1: Target Role Dropdown (Required) */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.iconCircle}>
              <Briefcase color="#FFFFFF" size={18} />
            </View>
            <View style={styles.cardHeaderText}>
              <Text style={styles.cardTitle}>1. Target Role / Job Title</Text>
              <Text style={styles.cardSubtitle}>Select your primary specialization</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.dropdownTrigger}
            onPress={() => setShowRoleModal(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.dropdownValue}>{targetRole}</Text>
            <ChevronDown color="#888888" size={18} />
          </TouchableOpacity>
        </View>

        {/* Section 2: GitHub Username (Optional) */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.iconCircle}>
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                  fill="#FFFFFF"
                />
              </Svg>
            </View>
            <View style={styles.cardHeaderText}>
              <Text style={styles.cardTitle}>2. GitHub Profile</Text>
              <Text style={styles.cardSubtitle}>Optional • Used for repository analysis</Text>
            </View>
          </View>

          {isGithubUser ? (
            <View style={styles.githubLinkedBox}>
              <CheckCircle2 color="#22C55E" size={16} />
              <Text style={styles.githubLinkedText}>
                Connected as <Text style={styles.githubLinkedUsername}>@{user?.githubUsername}</Text>
              </Text>
            </View>
          ) : (
            <View style={styles.inputWrapper}>
              <Text style={styles.inputPrefix}>github.com/</Text>
              <TextInput
                style={styles.input}
                placeholder="your-username"
                placeholderTextColor="#666666"
                value={githubUsername}
                onChangeText={setGithubUsername}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          )}
        </View>

        {/* Section 3: Resume (Optional, stays uploaded) */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.iconCircle}>
              <FileText color="#FFFFFF" size={18} />
            </View>
            <View style={styles.cardHeaderText}>
              <Text style={styles.cardTitle}>3. Resume Document</Text>
              <Text style={styles.cardSubtitle}>Optional • Upload once, kept forever for jobs</Text>
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
                    {selectedResume.size ? `${(selectedResume.size / 1024).toFixed(0)} KB • Tap to replace` : 'Ready • Tap to replace'}
                  </Text>
                </View>
              </View>
            ) : (
              <View style={styles.uploadPlaceholder}>
                <UploadCloud color="#888888" size={32} />
                <Text style={styles.uploadPromptTitle}>Attach your resume (PDF/DOCX)</Text>
                <Text style={styles.uploadPromptSubtitle}>You can also upload this later in Job Search</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Progress indicator */}
        {loading && (
          <View style={styles.progressContainer}>
            <ActivityIndicator size="small" color="#FFFFFF" />
            <Text style={styles.progressText}>{uploadProgressText}</Text>
          </View>
        )}

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
              <Text style={styles.submitButtonText}>Enter Joblio Platform</Text>
              <ArrowRight color="#000000" size={18} strokeWidth={2.2} />
            </>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Role Picker Modal */}
      <Modal visible={showRoleModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Target Role</Text>
              <TouchableOpacity onPress={() => setShowRoleModal(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <X color="#FFFFFF" size={20} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 340 }}>
              {POPULAR_ROLES.map((r) => {
                const isSelected = targetRole === r;
                return (
                  <TouchableOpacity
                    key={r}
                    style={[styles.roleOption, isSelected && styles.roleOptionSelected]}
                    onPress={() => {
                      setTargetRole(r);
                      setShowRoleModal(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.roleOptionText, isSelected && styles.roleOptionTextSelected]}>
                      {r}
                    </Text>
                    {isSelected && <CheckCircle2 color="#FFFFFF" size={16} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#141414',
    borderWidth: 1,
    borderColor: '#262626',
    borderRadius: 8,
    paddingHorizontal: 14,
    height: 48,
  },
  dropdownValue: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    padding: 20,
  },
  modalBox: {
    backgroundColor: '#121212',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#262626',
    padding: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1E1E1E',
    paddingBottom: 10,
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  roleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  roleOptionSelected: {
    backgroundColor: '#1E1E1E',
  },
  roleOptionText: {
    color: '#CCCCCC',
    fontSize: 14,
  },
  roleOptionTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
