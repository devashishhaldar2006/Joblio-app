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
import { useSignIn, useSignUp, useOAuth } from '@clerk/clerk-expo';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { useAuth } from '../../context/AuthContext';
import { getClerkFrontendApi } from '../../config/clerk';
import { COLORS, FONTS, SPACING } from '../../constants/theme';
import { ArrowRight, Mail, CheckCircle2 } from 'lucide-react-native';
import Svg, { Path } from 'react-native-svg';

WebBrowser.maybeCompleteAuthSession();

export default function AuthScreen() {
  const insets = useSafeAreaInsets();
  const { syncClerkSession } = useAuth();

  // Clerk hooks
  let clerkSignIn: any = null;
  let clerkSignUp: any = null;
  let googleOAuth: any = null;
  let githubOAuth: any = null;

  try {
    clerkSignIn = useSignIn();
    clerkSignUp = useSignUp();
  } catch (e) {}

  try {
    googleOAuth = useOAuth({ strategy: 'oauth_google' });
  } catch (e) {}

  try {
    githubOAuth = useOAuth({ strategy: 'oauth_github' });
  } catch (e) {}

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [pendingVerification, setPendingVerification] = useState(false);
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<'google' | 'github' | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Handle Native OAuth via Clerk API
  const handleNativeOAuth = async (strategy: 'oauth_google' | 'oauth_github') => {
    setErrorMsg('');
    setOauthLoading(strategy === 'oauth_google' ? 'google' : 'github');
    try {
      const redirectUrl = 'joblio://oauth-native-callback';
      
      // Step 1: Create sign-in attempt on Clerk's Native API
      const clerkFrontendApi = getClerkFrontendApi();
      const resp = await fetch(`${clerkFrontendApi}/v1/client/sign_ins?_is_native=1`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `strategy=${strategy}&redirect_url=${encodeURIComponent(redirectUrl)}`
      });
      const data = await resp.json();
      const authUrl = data?.response?.first_factor_verification?.external_verification_redirect_url;
      
      if (!authUrl) {
        throw new Error('Unable to generate verification link from identity provider.');
      }

      // Step 2: Open system in-app browser for user to authenticate
      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUrl);

      // Step 3: When user returns with session
      if (result.type === 'success' && result.url) {
        const parsedUrl = new URL(result.url);
        const rotatingTokenNonce = parsedUrl.searchParams.get('rotating_token_nonce') || '';
        
        if (clerkSignIn?.signIn) {
          await clerkSignIn.signIn.reload({ rotatingTokenNonce });
          if (clerkSignIn.signIn.status === 'complete') {
            await clerkSignIn.setActive({ session: clerkSignIn.signIn.createdSessionId });
            await syncClerkSession();
            return;
          }
        }
        await syncClerkSession();
      }
    } catch (err: any) {
      console.warn('Native OAuth error:', err);
      setErrorMsg(err.message || 'Authentication was cancelled.');
    } finally {
      setOauthLoading(null);
    }
  };

  const handleGoogleSignIn = () => handleNativeOAuth('oauth_google');
  const handleGithubSignIn = () => handleNativeOAuth('oauth_github');

  // Clerk Email/Password Sign In
  const handleClerkSignIn = async () => {
    if (!clerkSignIn?.signIn) {
      setErrorMsg('Authentication service is still initializing. Please wait a moment.');
      return;
    }

    const result = await clerkSignIn.signIn.create({
      identifier: email.trim(),
      password: password.trim(),
    });

    if (result.status === 'complete') {
      await clerkSignIn.setActive({ session: result.createdSessionId });
      await syncClerkSession();
    } else {
      setErrorMsg('Additional authentication step required.');
    }
  };

  // Clerk Email/Password Sign Up with Email Verification OTP
  const handleClerkSignUp = async () => {
    if (!clerkSignUp?.signUp) {
      setErrorMsg('Authentication service is still initializing. Please wait a moment.');
      return;
    }

    const nameParts = name.trim().split(' ');
    const firstName = nameParts[0] || 'Developer';
    const lastName = nameParts.slice(1).join(' ') || '';

    await clerkSignUp.signUp.create({
      emailAddress: email.trim(),
      password: password.trim(),
      firstName,
      lastName,
    });

    await clerkSignUp.signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
    setPendingVerification(true);
  };

  // Confirm verification code from email
  const handleVerifyCode = async () => {
    if (!clerkSignUp?.signUp) return;
    setLoading(true);
    setErrorMsg('');
    try {
      const completeSignUp = await clerkSignUp.signUp.attemptEmailAddressVerification({
        code: verificationCode.trim(),
      });
      if (completeSignUp.status === 'complete') {
        await clerkSignUp.setActive({ session: completeSignUp.createdSessionId });
        await syncClerkSession();
      } else {
        setErrorMsg('Verification incomplete. Please check code.');
      }
    } catch (err: any) {
      setErrorMsg(err.errors?.[0]?.message || err.message || 'Verification failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  // Main Submit Handler (Clerk Email/Password)
  const handleSubmit = async () => {
    setErrorMsg('');
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedEmail || !trimmedPassword || (mode === 'signup' && !name.trim())) {
      setErrorMsg('Please enter all required fields.');
      return;
    }

    if (trimmedPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'signup') {
        await handleClerkSignUp();
      } else {
        await handleClerkSignIn();
      }
    } catch (e: any) {
      const msg =
        e.errors?.[0]?.message ||
        e.response?.data?.error ||
        e.message ||
        'Authentication failed.';
      setErrorMsg(msg);
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
        {/* Editorial Minimal Brand Header */}
        <View style={styles.brandContainer}>
          <View style={styles.brandHeaderRow}>
            <View style={styles.logoMark}>
              <View style={styles.logoInnerSquare} />
            </View>
            <Text style={styles.brandTitle}>
              Job<Text style={styles.brandAccent}>lio</Text>
            </Text>
          </View>
          <Text style={styles.brandSubtitle}>Developer intelligence & career analytics</Text>
        </View>

        {/* Verification Code View */}
        {pendingVerification ? (
          <View style={styles.formCard}>
            <View style={styles.cardHeaderRow}>
              <Mail size={16} color={COLORS.accentWarning} />
              <Text style={styles.formTitle}>Check your inbox</Text>
            </View>
            <Text style={styles.verificationHint}>
              Enter the 6-digit verification code sent to <Text style={styles.emailHighlight}>{email}</Text>
            </Text>

            {errorMsg ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            ) : null}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Verification Code</Text>
              <TextInput
                style={[styles.input, styles.codeInput]}
                placeholder="123456"
                placeholderTextColor={COLORS.textMuted}
                keyboardType="number-pad"
                maxLength={6}
                value={verificationCode}
                onChangeText={setVerificationCode}
              />
            </View>

            <TouchableOpacity
              style={styles.submitBtn}
              onPress={handleVerifyCode}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.textInverse} size="small" />
              ) : (
                <View style={styles.btnRow}>
                  <Text style={styles.submitBtnText}>Verify & Continue</Text>
                  <CheckCircle2 size={16} color={COLORS.textInverse} />
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.toggleBtn}
              onPress={() => {
                setPendingVerification(false);
                setErrorMsg('');
              }}
              activeOpacity={0.6}
            >
              <Text style={styles.toggleText}>← Back to registration</Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* Main Clerk Auth Form */
          <View style={styles.formCard}>
            {/* Social OAuth Buttons (Google & GitHub) */}
            <View style={styles.socialButtonsContainer}>
              <TouchableOpacity
                style={styles.socialBtn}
                onPress={handleGoogleSignIn}
                disabled={Boolean(oauthLoading) || loading}
                activeOpacity={0.8}
              >
                {oauthLoading === 'google' ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <View style={styles.socialBtnContent}>
                    <Svg width="18" height="18" viewBox="0 0 24 24">
                      <Path
                        fill="#EA4335"
                        d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"
                      />
                      <Path
                        fill="#4285F4"
                        d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"
                      />
                      <Path
                        fill="#FBBC05"
                        d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12 0 14.5s.7 4.8 1.9 7.2l3.7-2.9z"
                      />
                      <Path
                        fill="#34A853"
                        d="M12 24c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 17C3.7 20.7 7.5 24 12 24z"
                      />
                    </Svg>
                    <Text style={styles.socialBtnText}>Continue with Google</Text>
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.socialBtn}
                onPress={handleGithubSignIn}
                disabled={Boolean(oauthLoading) || loading}
                activeOpacity={0.8}
              >
                {oauthLoading === 'github' ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <View style={styles.socialBtnContent}>
                    <Svg width="18" height="18" viewBox="0 0 24 24" fill="#FFFFFF">
                      <Path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                    </Svg>
                    <Text style={styles.socialBtnText}>Continue with GitHub</Text>
                  </View>
                )}
              </TouchableOpacity>

              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or continue with email</Text>
                <View style={styles.dividerLine} />
              </View>
            </View>

            <Text style={styles.formTitle}>
              {mode === 'signup' ? 'Create developer account' : 'Sign in with Email'}
            </Text>

            {errorMsg ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            ) : null}

            {mode === 'signup' && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Full Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Devashish"
                  placeholderTextColor={COLORS.textMuted}
                  value={name}
                  onChangeText={setName}
                />
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address</Text>
              <TextInput
                style={styles.input}
                placeholder="dev@joblio.io"
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
              disabled={loading || Boolean(oauthLoading)}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.textInverse} size="small" />
              ) : (
                <View style={styles.btnRow}>
                  <Text style={styles.submitBtnText}>
                    {mode === 'signup' ? 'Create account' : 'Sign in'}
                  </Text>
                  <ArrowRight size={16} color={COLORS.textInverse} />
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.toggleBtn}
              onPress={() => {
                setMode(mode === 'signup' ? 'signin' : 'signup');
                setErrorMsg('');
              }}
              activeOpacity={0.6}
            >
              <Text style={styles.toggleText}>
                {mode === 'signup'
                  ? 'Already have an account? Sign in'
                  : "Don't have an account? Sign up"}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
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
    width: 38,
    height: 38,
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#262626',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoInnerSquare: {
    width: 14,
    height: 14,
    borderWidth: 2,
    borderColor: COLORS.accentWarning,
    borderRadius: 3,
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: FONTS.medium,
    letterSpacing: -0.8,
  },
  brandAccent: {
    color: COLORS.accentWarning,
  },
  brandSubtitle: {
    fontSize: 13,
    color: '#888888',
    fontFamily: FONTS.regular,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 18,
  },
  formCard: {
    backgroundColor: '#0A0A0A',
    borderWidth: 1,
    borderColor: '#1F1F1F',
    padding: SPACING.lg,
    borderRadius: 14,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  socialButtonsContainer: {
    gap: 10,
    marginBottom: SPACING.md,
  },
  socialBtn: {
    backgroundColor: '#141414',
    borderWidth: 1,
    borderColor: '#242424',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  socialBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    fontFamily: FONTS.medium,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#1F1F1F',
  },
  dividerText: {
    color: '#555555',
    fontSize: 11,
    fontFamily: FONTS.regular,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  formTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: FONTS.medium,
    marginBottom: SPACING.md,
    letterSpacing: -0.3,
  },
  verificationHint: {
    fontSize: 13,
    color: '#999999',
    lineHeight: 18,
    marginBottom: SPACING.md,
  },
  emailHighlight: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  errorBox: {
    backgroundColor: 'rgba(255, 92, 92, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 92, 92, 0.35)',
    borderRadius: 8,
    padding: SPACING.sm,
    marginBottom: SPACING.md,
  },
  errorText: {
    color: COLORS.accentAlert,
    fontSize: 12,
    fontFamily: FONTS.regular,
  },
  inputGroup: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: '#888888',
    fontFamily: FONTS.regular,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  input: {
    backgroundColor: '#141414',
    borderWidth: 1,
    borderColor: '#242424',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: FONTS.regular,
  },
  codeInput: {
    letterSpacing: 8,
    fontSize: 18,
    textAlign: 'center',
    fontWeight: '700',
  },
  submitBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  submitBtnText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: FONTS.medium,
  },
  toggleBtn: {
    marginTop: SPACING.md,
    alignItems: 'center',
  },
  toggleText: {
    color: '#888888',
    fontSize: 13,
    fontFamily: FONTS.regular,
  },
});
