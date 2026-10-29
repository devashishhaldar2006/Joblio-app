import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Linking,
  TextInput,
  ActivityIndicator,
  Modal,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { COLORS, FONTS, SPACING } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { AuthService, GithubService } from '../../services';
import {
  ExternalLink,
  User,
  FileText,
  Briefcase,
  Check,
  Edit3,
  Trash2,
  UploadCloud,
  LogOut,
  Sparkles,
  ShieldCheck,
  X,
  Code2,
  GitBranch,
} from 'lucide-react-native';
import AppHeader from '../../components/AppHeader';

export default function ProfileScreen({ navigation }: any) {
  const { user, updateUser, logout } = useAuth();

  // Edit Profile States
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [editGithub, setEditGithub] = useState(user?.githubUsername || '');
  const [editTargetRole, setEditTargetRole] = useState(user?.targetRole || 'Software Engineer');
  const [editSkills, setEditSkills] = useState(
    Array.isArray(user?.skills) ? user?.skills.join(', ') : ''
  );
  const [saving, setSaving] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);
  };


  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account & Data',
      'This will permanently delete your Joblio account, stored resumes, saved bookmarks, and GitHub analysis records. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Permanently',
          style: 'destructive',
          onPress: async () => {
            try {
              await AuthService.deleteAccount();
              await logout();
              Alert.alert('Account Deleted', 'Your account and data have been permanently removed.');
            } catch (err: any) {
              Alert.alert('Error', err.response?.data?.error || err.message || 'Failed to delete account.');
            }
          },
        },
      ]
    );
  };

  const openLink = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch (e) {
      console.warn('Error opening link:', e);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const skillsArray = editSkills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      const cleanGithub = editGithub.trim().replace(/^@/, '');

      const res = await AuthService.updateProfile({
        name: editName.trim(),
        githubUsername: cleanGithub,
        targetRole: editTargetRole.trim(),
        skills: skillsArray,
      });

      if (res?.user) {
        updateUser(res.user);
      } else {
        updateUser({
          name: editName.trim(),
          githubUsername: cleanGithub,
          targetRole: editTargetRole.trim(),
          skills: skillsArray,
        });
      }
      setIsEditing(false);
      Alert.alert('Success', 'Profile preferences updated successfully.');
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.error || e.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handlePickAndUploadResume = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: [
          'application/pdf',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'text/plain',
        ],
        copyToCacheDirectory: true,
      });

      if (!res.canceled && res.assets && res.assets.length > 0) {
        const picked = res.assets[0];
        setUploadingResume(true);
        const fileName = picked.name || 'resume.pdf';

        const updateRes = await AuthService.updateProfile({
          resumeFileName: fileName,
        });

        if (updateRes?.user) {
          updateUser(updateRes.user);
        } else {
          updateUser({ hasResume: true, resumeFileName: fileName });
        }
        Alert.alert('Resume Saved', `"${fileName}" is now attached to your account permanently.`);
      }
    } catch (e: any) {
      Alert.alert('Upload Error', e.message || 'Failed to pick document.');
    } finally {
      setUploadingResume(false);
    }
  };

  const handleRemoveResume = () => {
    Alert.alert(
      'Remove Resume',
      'Are you sure you want to remove your attached resume from file?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await AuthService.updateProfile({ removeResume: true });
              updateUser({ hasResume: false, resumeFileName: '' });
            } catch (e) {
              console.warn('Remove resume error:', e);
            }
          },
        },
      ]
    );
  };

  const handleOpenGithubAudit = () => {
    if (!user?.githubUsername) {
      Alert.alert(
        'GitHub Username Required',
        'Please enter and save your GitHub username in your profile to run a code audit.',
        [
          { text: 'Edit Profile', onPress: () => setIsEditing(true) },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
      return;
    }
    navigation?.navigate('GithubAudit');
  };

  return (
    <View style={styles.container}>
      <AppHeader
        title="Developer Profile"
        badge="Pro"
        badgeType="yellow"
        subtitle="Developer identity & active credentials"
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Main Identity Card */}
        <View style={styles.identityCard}>
          <View style={styles.identityHeaderRow}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarInitial}>
                {(user?.name || user?.email || 'D').charAt(0).toUpperCase()}
              </Text>
            </View>

            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={styles.nameText}>{user?.name || 'Developer'}</Text>
              <Text style={styles.emailText}>{user?.email}</Text>
              <View style={styles.verifiedRow}>
                <ShieldCheck size={13} color="#00E599" />
                <Text style={styles.verifiedText}>Verified Developer Account</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.editToggleBtn}
              onPress={() => {
                if (!isEditing) {
                  setEditName(user?.name || '');
                  setEditGithub(user?.githubUsername || '');
                  setEditTargetRole(user?.targetRole || 'Software Engineer');
                  setEditSkills(Array.isArray(user?.skills) ? user?.skills.join(', ') : '');
                }
                setIsEditing(!isEditing);
              }}
              activeOpacity={0.7}
            >
              <Edit3 size={15} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Connected GitHub Handle */}
          <View style={styles.githubBanner}>
            <View style={styles.githubLeftRow}>
              <Code2 size={16} color="#FFFFFF" />
              <View>
                <Text style={styles.githubTitle}>Connected GitHub Handle</Text>
                <Text style={styles.githubHandle}>
                  {user?.githubUsername
                    ? `github.com/${user.githubUsername}`
                    : 'No handle connected'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Edit Form Modal/Drawer */}
        {isEditing && (
          <View style={styles.editCard}>
            <View style={styles.editCardHeader}>
              <Text style={styles.editCardTitle}>Edit Profile Settings</Text>
              <TouchableOpacity onPress={() => setIsEditing(false)}>
                <X size={16} color="#888888" />
              </TouchableOpacity>
            </View>

            <View style={styles.editField}>
              <Text style={styles.fieldLabel}>FULL NAME</Text>
              <TextInput
                style={styles.editInput}
                value={editName}
                onChangeText={setEditName}
                placeholder="Developer Name"
                placeholderTextColor="#666666"
              />
            </View>

            <View style={styles.editField}>
              <Text style={styles.fieldLabel}>GITHUB USERNAME</Text>
              <TextInput
                style={styles.editInput}
                value={editGithub}
                onChangeText={setEditGithub}
                placeholder="e.g. devashishhaldar2006"
                placeholderTextColor="#666666"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.editField}>
              <Text style={styles.fieldLabel}>TARGET ENGINEERING ROLE</Text>
              <TextInput
                style={styles.editInput}
                value={editTargetRole}
                onChangeText={setEditTargetRole}
                placeholder="e.g. Full Stack Engineer"
                placeholderTextColor="#666666"
              />
            </View>

            <View style={styles.editField}>
              <Text style={styles.fieldLabel}>CORE SKILLS (COMMA SEPARATED)</Text>
              <TextInput
                style={styles.editInput}
                value={editSkills}
                onChangeText={setEditSkills}
                placeholder="React, TypeScript, Node.js, Docker"
                placeholderTextColor="#666666"
              />
            </View>

            <TouchableOpacity
              style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
              onPress={handleSaveProfile}
              disabled={saving}
              activeOpacity={0.8}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#000000" />
              ) : (
                <Text style={styles.saveBtnText}>Save Preferences</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Persistent Resume on File Card */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionCardHeader}>
            <View style={styles.iconCircleOrange}>
              <FileText size={16} color="#FF7A00" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionCardTitle}>Attached Resume File</Text>
              <Text style={styles.sectionCardDesc}>
                Persistently stored for automated ATS job matching across sessions.
              </Text>
            </View>
          </View>

          {user?.hasResume || user?.resumeFileName ? (
            <View style={styles.resumeAttachedBox}>
              <View style={styles.resumeInfoRow}>
                <View style={styles.docBadge}>
                  <Text style={styles.docBadgeText}>PDF</Text>
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.resumeFileNameText} numberOfLines={1}>
                    {user?.resumeFileName || 'resume.pdf'}
                  </Text>
                  <Text style={styles.resumeStatusText}>● Active on file</Text>
                </View>
              </View>

              <View style={styles.resumeActionsRow}>
                <TouchableOpacity
                  style={styles.replaceResumeBtn}
                  onPress={handlePickAndUploadResume}
                  disabled={uploadingResume}
                  activeOpacity={0.7}
                >
                  <UploadCloud size={13} color="#FFFFFF" />
                  <Text style={styles.replaceResumeBtnText}>Replace File</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.removeResumeBtn}
                  onPress={handleRemoveResume}
                  activeOpacity={0.7}
                >
                  <Trash2 size={13} color="#FF4D4D" />
                  <Text style={styles.removeResumeBtnText}>Remove</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.noResumeBox}>
              <Text style={styles.noResumeText}>No resume uploaded yet.</Text>
              <Text style={styles.noResumeSubtext}>
                Upload once to use automated AI matching in Job Search without re-uploading every time.
              </Text>
              <TouchableOpacity
                style={styles.uploadResumeCta}
                onPress={handlePickAndUploadResume}
                disabled={uploadingResume}
                activeOpacity={0.8}
              >
                {uploadingResume ? (
                  <ActivityIndicator size="small" color="#000000" />
                ) : (
                  <>
                    <UploadCloud size={15} color="#000000" />
                    <Text style={styles.uploadResumeCtaText}>Upload Resume File</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Career Preferences */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeading}>CAREER PARAMETERS</Text>

          <View style={styles.paramRow}>
            <Text style={styles.paramLabel}>Target Role</Text>
            <Text style={styles.paramValue}>{user?.targetRole || 'Software Engineer'}</Text>
          </View>

          <View style={styles.paramRow}>
            <Text style={styles.paramLabel}>Preferred Work</Text>
            <Text style={styles.paramValue}>
              {user?.preferences?.preferredWorkType || 'Remote / Hybrid'}
            </Text>
          </View>

          <View style={styles.paramRow}>
            <Text style={styles.paramLabel}>Skills Portfolio</Text>
            <Text style={styles.paramValueSkills}>
              {user?.skills && user.skills.length > 0
                ? user.skills.join('  •  ')
                : 'TypeScript • React • Node.js • Python'}
            </Text>
          </View>
        </View>

        {/* Built By Card */}
        <View style={styles.builtByCard}>
          <Text style={styles.sectionHeading}>BUILT BY</Text>
          <View style={styles.creatorsRow}>
            {/* Devashish */}
            <View style={styles.creatorCol}>
              <Text style={styles.creatorName}>Devashish</Text>
              <View style={styles.creatorLinks}>
                <TouchableOpacity
                  style={styles.creatorPill}
                  onPress={() => openLink('https://github.com/devashishhaldar2006')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.creatorPillText}>GitHub</Text>
                  <ExternalLink size={10} color="#888888" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.creatorPill}
                  onPress={() => openLink('https://linkedin.com/in/devashish-haldar-dev')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.creatorPillText}>LinkedIn</Text>
                  <ExternalLink size={10} color="#888888" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.creatorsDivider} />

            {/* Om */}
            <View style={styles.creatorCol}>
              <Text style={styles.creatorName}>Om</Text>
              <View style={styles.creatorLinks}>
                <TouchableOpacity
                  style={styles.creatorPill}
                  onPress={() => openLink('https://github.com/loqom')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.creatorPillText}>GitHub</Text>
                  <ExternalLink size={10} color="#888888" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.creatorPill}
                  onPress={() => openLink('https://linkedin.com/in/om-vishwakarma-codes')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.creatorPillText}>LinkedIn</Text>
                  <ExternalLink size={10} color="#888888" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <LogOut size={15} color="#FF4D4D" />
          <Text style={styles.logoutText}>Sign Out of Joblio</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  content: {
    padding: 16,
    paddingTop: 12,
    paddingBottom: 90,
    gap: 16,
  },
  identityCard: {
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#222222',
    borderRadius: 14,
    padding: 18,
  },
  identityHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1E1E1E',
    borderWidth: 1,
    borderColor: '#333333',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  nameText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  emailText: {
    color: '#777777',
    fontSize: 12,
    marginTop: 2,
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  verifiedText: {
    color: '#00E599',
    fontSize: 11,
    fontWeight: '600',
  },
  editToggleBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1E1E1E',
    borderWidth: 1,
    borderColor: '#2D2D2D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  githubBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#171717',
    borderWidth: 1,
    borderColor: '#262626',
    borderRadius: 10,
    padding: 12,
  },
  githubLeftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  githubTitle: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  githubHandle: {
    color: '#888888',
    fontSize: 11,
    marginTop: 1,
    fontFamily: FONTS.mono,
  },
  runAuditPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  runAuditPillText: {
    color: '#000000',
    fontSize: 11,
    fontWeight: '700',
  },
  connectGithubPill: {
    backgroundColor: '#262626',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  connectGithubPillText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  editCard: {
    backgroundColor: '#141414',
    borderWidth: 1,
    borderColor: '#2A2A2A',
    borderRadius: 14,
    padding: 16,
  },
  editCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#222222',
    paddingBottom: 8,
  },
  editCardTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  editField: {
    marginBottom: 12,
  },
  fieldLabel: {
    color: '#777777',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
    marginBottom: 5,
  },
  editInput: {
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#2E2E2E',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#FFFFFF',
    fontSize: 13,
  },
  saveBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingVertical: 11,
    alignItems: 'center',
    marginTop: 6,
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    color: '#000000',
    fontSize: 13,
    fontWeight: '700',
  },
  sectionCard: {
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#222222',
    borderRadius: 14,
    padding: 18,
  },
  sectionCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  iconCircleOrange: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 122, 0, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionCardTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  sectionCardDesc: {
    color: '#777777',
    fontSize: 11,
    lineHeight: 15,
    marginTop: 2,
  },
  resumeAttachedBox: {
    backgroundColor: '#171717',
    borderWidth: 1,
    borderColor: '#262626',
    borderRadius: 10,
    padding: 14,
  },
  resumeInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  docBadge: {
    backgroundColor: 'rgba(255, 122, 0, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  docBadgeText: {
    color: '#FF7A00',
    fontSize: 11,
    fontWeight: '700',
  },
  resumeFileNameText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  resumeStatusText: {
    color: '#00E599',
    fontSize: 11,
    marginTop: 2,
    fontWeight: '500',
  },
  resumeActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  replaceResumeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#222222',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 6,
  },
  replaceResumeBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  removeResumeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 77, 77, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 6,
  },
  removeResumeBtnText: {
    color: '#FF4D4D',
    fontSize: 11,
    fontWeight: '600',
  },
  noResumeBox: {
    padding: 16,
    backgroundColor: '#161616',
    borderRadius: 10,
    alignItems: 'center',
  },
  noResumeText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  noResumeSubtext: {
    color: '#777777',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 12,
    lineHeight: 16,
  },
  uploadResumeCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  uploadResumeCtaText: {
    color: '#000000',
    fontSize: 12,
    fontWeight: '700',
  },
  sectionHeading: {
    color: '#777777',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
    marginBottom: 12,
  },
  paramRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
  },
  paramLabel: {
    color: '#777777',
    fontSize: 11,
    marginBottom: 3,
  },
  paramValue: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  paramValueSkills: {
    color: '#DDDDDD',
    fontSize: 12,
    lineHeight: 18,
  },
  builtByCard: {
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#222222',
    borderRadius: 14,
    padding: 18,
  },
  creatorsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  creatorCol: {
    flex: 1,
  },
  creatorName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 6,
  },
  creatorLinks: {
    flexDirection: 'row',
    gap: 6,
  },
  creatorPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#2A2A2A',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  creatorPillText: {
    color: '#CCCCCC',
    fontSize: 11,
    fontWeight: '500',
  },
  creatorsDivider: {
    width: 1,
    height: 36,
    backgroundColor: '#222222',
    marginHorizontal: 16,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#141414',
    borderWidth: 1,
    borderColor: '#282828',
    borderRadius: 10,
    paddingVertical: 14,
    marginTop: 4,
  },
  logoutText: {
    color: '#FF4D4D',
    fontSize: 13,
    fontWeight: '700',
  },
});
