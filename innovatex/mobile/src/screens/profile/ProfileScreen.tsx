import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import { COLORS, FONTS, SPACING } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { ExternalLink } from 'lucide-react-native';
import AppHeader from '../../components/AppHeader';

export default function ProfileScreen() {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Confirm sign out of current session?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);
  };

  const openLink = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch (e) {
      console.warn('Error opening author link:', e);
    }
  };

  return (
    <View style={styles.container}>
      <AppHeader
        title="Developer Profile"
        badge="Pro"
        badgeType="yellow"
        subtitle="Account settings & career preferences"
      />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.name}>{user?.name || 'Developer'}</Text>
          <Text style={styles.email}>{user?.email}</Text>
          {user?.githubUsername && (
            <Text style={styles.github}>github.com/{user.githubUsername}</Text>
          )}
        </View>

      <View style={styles.card}>
        <Text style={styles.cardHeader}>Profile settings</Text>

        <View style={styles.row}>
          <Text style={styles.label}>Target role</Text>
          <Text style={styles.val}>{user?.targetRole || 'Software Engineer'}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Auth Provider</Text>
          <Text style={[styles.val, user?.clerkId ? { color: COLORS.accentWarning } : undefined]}>
            {user?.clerkId ? 'Clerk OAuth/SSO' : 'Joblio Secure JWT'}
          </Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Competencies</Text>
          <Text style={styles.val}>
            {user?.skills && user.skills.length > 0
              ? user.skills.join(', ')
              : 'TypeScript, Node.js, Python, React'}
          </Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Resume on file</Text>
          <Text style={[styles.val, user?.hasResume ? { color: '#22C55E' } : { color: COLORS.textMuted }]}>
            {user?.resumeFileName || (user?.hasResume ? 'Active Resume Attached' : 'None uploaded')}
          </Text>
        </View>
      </View>

      {/* Built By Section */}
      <View style={styles.builtByCard}>
        <Text style={styles.cardHeader}>Built by</Text>
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
                <ExternalLink size={10} color={COLORS.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.creatorPill}
                onPress={() => openLink('https://linkedin.com/in/devashish-haldar-dev')}
                activeOpacity={0.7}
              >
                <Text style={styles.creatorPillText}>LinkedIn</Text>
                <ExternalLink size={10} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Divider */}
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
                <ExternalLink size={10} color={COLORS.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.creatorPill}
                onPress={() => openLink('https://linkedin.com/in/om-vishwakarma-codes')}
                activeOpacity={0.7}
              >
                <Text style={styles.creatorPillText}>LinkedIn</Text>
                <ExternalLink size={10} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
        <Text style={styles.logoutText}>Sign out</Text>
      </TouchableOpacity>
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
    paddingBottom: 48,
    gap: SPACING.md,
  },
  header: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: SPACING.md,
  },
  name: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textPrimary,
    fontFamily: FONTS.regular,
    letterSpacing: -0.5,
  },
  email: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontFamily: FONTS.mono,
    marginTop: 2,
  },
  github: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontFamily: FONTS.mono,
    marginTop: 4,
  },
  card: {
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    backgroundColor: COLORS.bgCanvas,
    gap: SPACING.md,
  },
  cardHeader: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textMuted,
    fontFamily: FONTS.regular,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  label: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontFamily: FONTS.regular,
  },
  val: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.textPrimary,
    fontFamily: FONTS.mono,
    maxWidth: '60%',
    textAlign: 'right',
  },
  logoutBtn: {
    borderWidth: 1,
    borderColor: COLORS.borderDark,
    borderRadius: 2,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: COLORS.bgCanvas,
  },
  logoutText: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '600',
    fontFamily: FONTS.medium,
  },
  builtByCard: {
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    backgroundColor: COLORS.bgCanvas,
    gap: 12,
  },
  creatorsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  creatorCol: {
    flex: 1,
    gap: 8,
  },
  creatorName: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    fontFamily: FONTS.medium,
  },
  creatorLinks: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  creatorPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#161616',
    borderWidth: 1,
    borderColor: '#262626',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  creatorPillText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontFamily: FONTS.regular,
  },
  creatorsDivider: {
    width: 1,
    height: 40,
    backgroundColor: COLORS.border,
    marginHorizontal: 12,
  },
});
