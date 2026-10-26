import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { COLORS, FONTS, SPACING } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import AppHeader from '../../components/AppHeader';

export default function ProfileScreen() {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Confirm sign out of current session?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);
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
          <Text style={styles.label}>Gateway</Text>
          <Text style={styles.val}>10.0.2.2 (Localhost)</Text>
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
});
