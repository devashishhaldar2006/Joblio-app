import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { COLORS, FONTS, SPACING } from '../../constants/theme';
import { ArrowRight } from 'lucide-react-native';

export default function AuthScreen() {
  const insets = useSafeAreaInsets();
  const { login, register } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async () => {
    setErrorMsg('');
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedEmail || !trimmedPassword || (isRegister && !name.trim())) {
      setErrorMsg('Please enter all required fields.');
      return;
    }

    if (trimmedPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      if (isRegister) {
        await register(name.trim(), trimmedEmail, trimmedPassword);
      } else {
        await login(trimmedEmail, trimmedPassword);
      }
    } catch (e: any) {
      setErrorMsg(e.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: Math.max(insets.top + SPACING.lg, SPACING.xl),
            paddingBottom: Math.max(insets.bottom + SPACING.lg, SPACING.xl),
          },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Editorial Minimal Brand Header with Logo Mark */}
        <View style={styles.brandContainer}>
          <View style={styles.brandHeaderRow}>
            <View style={styles.logoMark}>
              <View style={styles.logoInnerSquare} />
            </View>
            <Text style={styles.brandTitle}>Joblio</Text>
          </View>
          <Text style={styles.brandSubtitle}>Developer intelligence and market analytics.</Text>
        </View>

        {/* Clean Box Container */}
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>
            {isRegister ? 'Register' : 'Sign in'}
          </Text>

          {errorMsg ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          ) : null}

          {isRegister && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Full name"
                placeholderTextColor={COLORS.textMuted}
                value={name}
                onChangeText={setName}
              />
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="name@company.com"
              placeholderTextColor={COLORS.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor={COLORS.textMuted}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>

          <TouchableOpacity
            style={styles.submitBtn}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.textInverse} size="small" />
            ) : (
              <View style={styles.btnRow}>
                <Text style={styles.submitBtnText}>
                  {isRegister ? 'Create account' : 'Continue'}
                </Text>
                <ArrowRight size={16} color={COLORS.textInverse} />
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.toggleBtn}
            onPress={() => {
              setIsRegister(!isRegister);
              setErrorMsg('');
            }}
            activeOpacity={0.6}
          >
            <Text style={styles.toggleText}>
              {isRegister
                ? 'Already have an account? Sign in'
                : 'Need an account? Register'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgCanvas,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  brandHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  logoMark: {
    width: 32,
    height: 32,
    backgroundColor: COLORS.primary,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoInnerSquare: {
    width: 12,
    height: 12,
    borderWidth: 2,
    borderColor: COLORS.textInverse,
    borderRadius: 2,
  },
  brandTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: COLORS.textPrimary,
    fontFamily: FONTS.regular,
    letterSpacing: -0.6,
  },
  brandSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontFamily: FONTS.regular,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 18,
  },
  formCard: {
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    borderRadius: 4,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
    fontFamily: FONTS.medium,
    marginBottom: SPACING.md,
    letterSpacing: -0.2,
  },
  errorBox: {
    backgroundColor: COLORS.statusAlertBg,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.statusAlertText,
    padding: SPACING.sm,
    marginBottom: SPACING.md,
  },
  errorText: {
    color: COLORS.statusAlertText,
    fontSize: 12,
    fontFamily: FONTS.regular,
  },
  inputGroup: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.textSecondary,
    fontFamily: FONTS.regular,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: COLORS.inputBg,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    borderRadius: 2,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: COLORS.textPrimary,
    fontSize: 14,
    fontFamily: FONTS.regular,
  },
  submitBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 2,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  submitBtnText: {
    color: COLORS.textInverse,
    fontSize: 13,
    fontWeight: '600',
    fontFamily: FONTS.medium,
  },
  toggleBtn: {
    marginTop: SPACING.md,
    alignItems: 'center',
  },
  toggleText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontFamily: FONTS.regular,
  },
});
