import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { COLORS, FONTS, SPACING } from '../../constants/theme';
import { GithubService } from '../../services';
import { X, Search } from 'lucide-react-native';
import AppHeader from '../../components/AppHeader';

export default function GithubAnalyzerScreen({ navigation }: any) {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'actions' | 'codegen'>('overview');
  const [fixModalContent, setFixModalContent] = useState<string | null>(null);
  const [fixModalTitle, setFixModalTitle] = useState('');
  const [generatingFix, setGeneratingFix] = useState(false);

  const handleAudit = async () => {
    const clean = username.trim();
    if (!clean) return;
    setLoading(true);
    try {
      const data = await GithubService.analyze(clean);
      setReport(data);
    } catch (e: any) {
      alert(e.response?.data?.error || e.message || 'Audit failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateFix = async (actionType: string, title: string, repo?: string) => {
    setGeneratingFix(true);
    setFixModalTitle(title);
    try {
      const res = await GithubService.generateAiFix(actionType, report, repo);
      setFixModalContent(res.generated_content || res.content || JSON.stringify(res, null, 2));
    } catch (e: any) {
      alert(e.response?.data?.error || 'Generation failed');
    } finally {
      setGeneratingFix(false);
    }
  };

  const score = report?.overall_score ?? report?.totalScore ?? 84;
  const repos = report?.repositories || report?.best_repos || [];
  const recommendations = report?.recommendations || [];

  return (
    <View style={styles.container}>
      <AppHeader
        title="GitHub Audit"
        badge="Quality Check"
        badgeType="red"
        subtitle="Repository standards & automated fixes"
        canGoBack
        onBack={() => navigation?.goBack()}
      />
      {/* Input Header */}
      <View style={styles.searchBar}>
        <TextInput
          style={styles.searchInput}
          placeholder="GitHub handle (e.g. torvalds)"
          placeholderTextColor={COLORS.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
          value={username}
          onChangeText={setUsername}
        />
        <TouchableOpacity style={styles.searchBtn} onPress={handleAudit} disabled={loading}>
          {loading ? (
            <ActivityIndicator color={COLORS.textInverse} size="small" />
          ) : (
            <Text style={styles.searchBtnText}>Audit</Text>
          )}
        </TouchableOpacity>
      </View>

      {report ? (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Summary Box */}
          <View style={styles.summaryCard}>
            <View>
              <Text style={styles.userHandle}>@{report.username || username}</Text>
              <Text style={styles.userMeta}>Tier: {report.tier || 'Strong'}</Text>
            </View>
            <View style={styles.scoreBox}>
              <Text style={styles.scoreText}>{score}</Text>
              <Text style={styles.scoreSub}>/100</Text>
            </View>
          </View>

          {/* Minimalist Tabs */}
          <View style={styles.tabBar}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'overview' && styles.tabActive]}
              onPress={() => setActiveTab('overview')}
            >
              <Text style={[styles.tabText, activeTab === 'overview' && styles.tabTextActive]}>
                Repositories
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'actions' && styles.tabActive]}
              onPress={() => setActiveTab('actions')}
            >
              <Text style={[styles.tabText, activeTab === 'actions' && styles.tabTextActive]}>
                Audits ({recommendations.length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'codegen' && styles.tabActive]}
              onPress={() => setActiveTab('codegen')}
            >
              <Text style={[styles.tabText, activeTab === 'codegen' && styles.tabTextActive]}>
                Workflows
              </Text>
            </TouchableOpacity>
          </View>

          {activeTab === 'overview' && (
            <View style={styles.section}>
              {repos.slice(0, 6).map((repo: any, idx: number) => (
                <View key={idx} style={styles.repoItem}>
                  <View style={styles.repoTop}>
                    <Text style={styles.repoName}>{repo.name}</Text>
                    <Text style={styles.repoStars}>{repo.stargazers_count ?? repo.stars ?? 0} stars</Text>
                  </View>
                  <Text style={styles.repoDesc}>{repo.description || 'No description provided.'}</Text>
                  <Text style={styles.repoLang}>{repo.language || 'Plain text'}</Text>
                </View>
              ))}
            </View>
          )}

          {activeTab === 'actions' && (
            <View style={styles.section}>
              {recommendations.length > 0 ? (
                recommendations.map((rec: any, idx: number) => (
                  <View key={idx} style={styles.recItem}>
                    <Text style={styles.recTitle}>{rec.title}</Text>
                    <Text style={styles.recDesc}>{rec.description || rec.detail}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyNote}>No pending actions. Repository standards met.</Text>
              )}
            </View>
          )}

          {activeTab === 'codegen' && (
            <View style={styles.section}>
              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => handleGenerateFix('profile_readme', 'Profile README')}
              >
                <Text style={styles.actionTitle}>Generate profile README.md</Text>
                <Text style={styles.actionDesc}>Documentation template for your primary account.</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => handleGenerateFix('ci_workflow', 'CI/CD Workflow', repos[0]?.name)}
              >
                <Text style={styles.actionTitle}>Generate GitHub Actions workflow</Text>
                <Text style={styles.actionDesc}>Build & test configuration for {repos[0]?.name || 'repository'}.</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>Enter a GitHub profile</Text>
          <Text style={styles.emptySub}>
            Evaluates commit history, file coverage, and repository engineering standards.
          </Text>
        </View>
      )}

      {/* Code Modal */}
      <Modal visible={!!fixModalContent || generatingFix} transparent animationType="fade">
        <View style={styles.modalBg}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{fixModalTitle}</Text>
              <TouchableOpacity onPress={() => setFixModalContent(null)}>
                <X size={18} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>
            {generatingFix ? (
              <View style={{ padding: SPACING.xl, alignItems: 'center' }}>
                <ActivityIndicator color={COLORS.textPrimary} />
                <Text style={{ marginTop: SPACING.sm, color: COLORS.textSecondary, fontSize: 12 }}>
                  Generating source...
                </Text>
              </View>
            ) : (
              <ScrollView style={styles.codeBox}>
                <Text style={styles.codeText}>{fixModalContent}</Text>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgCanvas,
  },
  searchBar: {
    flexDirection: 'row',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.bgCanvas,
    gap: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    borderRadius: 2,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: COLORS.textPrimary,
    fontFamily: FONTS.regular,
    fontSize: 13,
  },
  searchBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 2,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBtnText: {
    color: COLORS.textInverse,
    fontFamily: FONTS.medium,
    fontSize: 13,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: 48,
  },
  summaryCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.bgSubtle,
    marginBottom: SPACING.md,
  },
  userHandle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
    fontFamily: FONTS.regular,
  },
  userMeta: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontFamily: FONTS.regular,
    marginTop: 2,
  },
  scoreBox: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  scoreText: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.textPrimary,
    fontFamily: FONTS.mono,
  },
  scoreSub: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontFamily: FONTS.mono,
    marginLeft: 2,
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginBottom: SPACING.md,
  },
  tab: {
    paddingVertical: 8,
    marginRight: 16,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.borderDark,
  },
  tabText: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontFamily: FONTS.regular,
  },
  tabTextActive: {
    color: COLORS.textPrimary,
    fontFamily: FONTS.medium,
  },
  section: {
    gap: SPACING.sm,
  },
  repoItem: {
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
  },
  repoTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  repoName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    fontFamily: FONTS.mono,
  },
  repoStars: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontFamily: FONTS.mono,
  },
  repoDesc: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontFamily: FONTS.regular,
    marginTop: 4,
    lineHeight: 16,
  },
  repoLang: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontFamily: FONTS.mono,
    marginTop: 8,
  },
  recItem: {
    borderLeftWidth: 3,
    borderLeftColor: COLORS.borderDark,
    paddingLeft: SPACING.sm,
    paddingVertical: 4,
    marginBottom: SPACING.sm,
  },
  recTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
    fontFamily: FONTS.medium,
  },
  recDesc: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontFamily: FONTS.regular,
    marginTop: 2,
  },
  emptyNote: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontFamily: FONTS.regular,
    paddingVertical: SPACING.md,
  },
  actionCard: {
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
  },
  actionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
    fontFamily: FONTS.medium,
  },
  actionDesc: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontFamily: FONTS.regular,
    marginTop: 2,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    fontFamily: FONTS.medium,
  },
  emptySub: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontFamily: FONTS.regular,
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 280,
    lineHeight: 18,
  },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: SPACING.md,
  },
  modalBox: {
    backgroundColor: COLORS.bgCanvas,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
    padding: SPACING.md,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  modalTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    fontFamily: FONTS.medium,
  },
  codeBox: {
    backgroundColor: COLORS.bgSubtle,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.sm,
  },
  codeText: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.textPrimary,
    lineHeight: 16,
  },
});
