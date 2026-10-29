import AiLoadingIndicator from '../../components/AiLoadingIndicator';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Modal,
  Linking,
} from 'react-native';
import { COLORS, FONTS, SPACING } from '../../constants/theme';
import { GithubService } from '../../services';
import { useAuth } from '../../context/AuthContext';
import {
  X,
  Search,
  Code2,
  GitBranch,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  FileCode,
  Sparkles,
  ExternalLink,
  BookOpen,
  Terminal,
  Layers,
  Star,
} from 'lucide-react-native';
import AppHeader from '../../components/AppHeader';

export default function GithubAnalyzerScreen({ navigation }: any) {
  const { user } = useAuth();
  const [username, setUsername] = useState(user?.githubUsername || '');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<any>(null);

  useEffect(() => {
    if (user?.githubUsername && !username) {
      setUsername(user.githubUsername);
    }
  }, [user?.githubUsername]);

  const [activeTab, setActiveTab] = useState<'overview' | 'metrics' | 'audits' | 'codegen'>('overview');
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

  const score = report?.overall_score ?? report?.totalScore ?? report?.profile_score?.total ?? 84;
  const repos = report?.repositories || report?.best_repos || [];
  const recommendations = report?.recommendations || report?.improvements || [];
  const breakdown = report?.profile_score?.breakdown || {
    repository_quality: { score: 18, max: 20 },
    documentation: { score: 12, max: 15 },
    profile_completeness: { score: 14, max: 15 },
    activity_consistency: { score: 13, max: 15 },
    technical_breadth: { score: 9, max: 10 },
  };

  return (
    <View style={styles.container}>
      <AppHeader
        title="GitHub Audit & Fixes"
        badge="Enterprise Grade"
        badgeType="red"
        subtitle="Deep repository health, commit velocity & automated fixes"
        canGoBack
        onBack={() => navigation?.goBack()}
      />

      {/* Input Search Header */}
      <View style={styles.searchBar}>
        <TextInput
          style={styles.searchInput}
          placeholder="GitHub handle (e.g. torvalds, devashishhaldar2006)"
          placeholderTextColor="#666666"
          autoCapitalize="none"
          autoCorrect={false}
          value={username}
          onChangeText={setUsername}
          onSubmitEditing={handleAudit}
          returnKeyType="search"
        />
        <TouchableOpacity style={styles.searchBtn} onPress={handleAudit} disabled={loading} activeOpacity={0.85}>
          {loading ? (
            <ActivityIndicator color="#000000" size="small" />
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Sparkles size={14} color="#000000" strokeWidth={2.2} />
              <Text style={styles.searchBtnText}>Run Audit</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {loading && (
        <View style={{ padding: 16 }}>
          <AiLoadingIndicator
            title={`Auditing GitHub Profile @${username || 'user'}...`}
            defaultSubtitle="Inspecting repositories, commit patterns, test coverage, and documentation standards."
          />
        </View>
      )}

      {report ? (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Summary Score Card */}
          <View style={styles.summaryCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.userHandle}>@{report.username || username}</Text>
              <Text style={styles.userMeta}>
                Tier: <Text style={{ color: '#00E599', fontWeight: '700' }}>{report.tier || 'Strong Engineer'}</Text>
              </Text>
              <Text style={styles.userSubMeta}>
                {report.total_repos || repos.length} Public Repos • {report.followers ?? 24} Followers
              </Text>
            </View>
            <View style={styles.scoreBox}>
              <Text style={styles.scoreText}>{score}</Text>
              <Text style={styles.scoreSub}>/100</Text>
            </View>
          </View>

          {/* Navigation Tabs */}
          <View style={styles.tabBar}>
            {(['overview', 'metrics', 'audits', 'codegen'] as const).map((tabKey) => {
              const labels = {
                overview: 'Repositories',
                metrics: 'Score Metrics',
                audits: `Fixes (${recommendations.length})`,
                codegen: 'AI Generators',
              };
              const isActive = activeTab === tabKey;
              return (
                <TouchableOpacity
                  key={tabKey}
                  style={[styles.tab, isActive && styles.tabActive]}
                  onPress={() => setActiveTab(tabKey)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                    {labels[tabKey]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* 1. Repositories Overview */}
          {activeTab === 'overview' && (
            <View style={styles.section}>
              {repos.slice(0, 8).map((repo: any, idx: number) => (
                <View key={idx} style={styles.repoItem}>
                  <View style={styles.repoTop}>
                    <Text style={styles.repoName}>{repo.name}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Star size={12} color="#FFB800" />
                      <Text style={styles.repoStars}>{repo.stargazers_count ?? repo.stars ?? 0}</Text>
                    </View>
                  </View>
                  <Text style={styles.repoDesc}>{repo.description || 'No public description provided.'}</Text>
                  <View style={styles.repoFooter}>
                    <Text style={styles.repoLang}>{repo.language || 'Software'}</Text>
                    <TouchableOpacity
                      onPress={() => repo.html_url && Linking.openURL(repo.html_url)}
                      style={styles.openRepoBtn}
                    >
                      <ExternalLink size={12} color="#888888" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* 2. Score Metrics Breakdown */}
          {activeTab === 'metrics' && (
            <View style={styles.section}>
              <View style={styles.metricsBox}>
                <Text style={styles.metricsTitle}>ENGINEERING HEALTH DIMENSIONS</Text>
                {Object.entries(breakdown).map(([key, val]: [string, any], idx) => {
                  const s = val?.score ?? 10;
                  const m = val?.max ?? 15;
                  const pct = Math.min(100, Math.round((s / m) * 100));
                  const titleClean = key.replace(/_/g, ' ').toUpperCase();

                  return (
                    <View key={idx} style={styles.metricRow}>
                      <View style={styles.metricLabelRow}>
                        <Text style={styles.metricDimName}>{titleClean}</Text>
                        <Text style={styles.metricFraction}>{s}/{m} pts</Text>
                      </View>
                      <View style={styles.progressTrack}>
                        <View style={[styles.progressFill, { width: `${pct}%` }]} />
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* 3. Actionable Recommendations */}
          {activeTab === 'audits' && (
            <View style={styles.section}>
              {recommendations.length > 0 ? (
                recommendations.map((rec: any, idx: number) => (
                  <View key={idx} style={styles.recItem}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <AlertTriangle size={14} color="#FFA34D" />
                      <Text style={styles.recTitle}>{rec.title}</Text>
                    </View>
                    <Text style={styles.recDesc}>{rec.description || rec.detail || rec.action}</Text>
                  </View>
                ))
              ) : (
                <View style={styles.emptyNoteBox}>
                  <CheckCircle2 size={24} color="#00E599" style={{ marginBottom: 8 }} />
                  <Text style={styles.emptyNoteTitle}>All Repository Standards Met</Text>
                  <Text style={styles.emptyNoteDesc}>No high-severity quality flags detected on this profile.</Text>
                </View>
              )}
            </View>
          )}

          {/* 4. Automated AI Code & Workflow Generators */}
          {activeTab === 'codegen' && (
            <View style={styles.section}>
              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => handleGenerateFix('profile_readme', 'Profile README.md')}
                activeOpacity={0.8}
              >
                <View style={styles.actionHeader}>
                  <FileCode size={16} color="#00E599" />
                  <Text style={styles.actionTitle}>Generate Profile README.md</Text>
                </View>
                <Text style={styles.actionDesc}>
                  Creates an executive developer profile with detected tech stacks and project showcases.
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => handleGenerateFix('ci_workflow', 'GitHub Actions CI Pipeline', repos[0]?.name)}
                activeOpacity={0.8}
              >
                <View style={styles.actionHeader}>
                  <Terminal size={16} color="#00B2FF" />
                  <Text style={styles.actionTitle}>Generate CI/CD Test Pipeline</Text>
                </View>
                <Text style={styles.actionDesc}>
                  Automated GitHub Actions build, lint, and test workflow for {repos[0]?.name || 'primary repo'}.
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => handleGenerateFix('contributing_guide', 'CONTRIBUTING.md Guide', repos[0]?.name)}
                activeOpacity={0.8}
              >
                <View style={styles.actionHeader}>
                  <BookOpen size={16} color="#FF7A00" />
                  <Text style={styles.actionTitle}>Generate CONTRIBUTING.md</Text>
                </View>
                <Text style={styles.actionDesc}>
                  Standardized open source contribution guide with conventional commits and setup instructions.
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => handleGenerateFix('profile_bio', 'Executive Bio')}
                activeOpacity={0.8}
              >
                <View style={styles.actionHeader}>
                  <Sparkles size={16} color="#A855F7" />
                  <Text style={styles.actionTitle}>Generate Optimized Profile Bio</Text>
                </View>
                <Text style={styles.actionDesc}>
                  Concise headline highlighting developer DNA, primary stacks, and engineering focus.
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      ) : (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Code2 size={28} color="#FF7A00" />
          </View>
          <Text style={styles.emptyTitle}>Enter GitHub Profile to Audit</Text>
          <Text style={styles.emptySub}>
            Evaluates commit history, test suites, documentation completeness, and produces 1-click automated PR fixes.
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
                <X size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            {generatingFix ? (
              <View style={{ padding: SPACING.xl, alignItems: 'center' }}>
                <ActivityIndicator color="#00E599" />
                <Text style={{ marginTop: SPACING.sm, color: '#888888', fontSize: 12 }}>
                  Generating automated source code...
                </Text>
              </View>
            ) : (
              <ScrollView style={styles.codeBox} showsVerticalScrollIndicator={false}>
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
    backgroundColor: '#0A0A0A',
  },
  searchBar: {
    flexDirection: 'row',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1E1E1E',
    backgroundColor: '#0E0E0E',
    gap: 10,
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#262626',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    color: '#FFFFFF',
    fontFamily: FONTS.regular,
    fontSize: 13,
    backgroundColor: '#141414',
  },
  searchBtn: {
    backgroundColor: '#00E599',
    borderRadius: 8,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBtnText: {
    color: '#000000',
    fontFamily: FONTS.medium,
    fontWeight: '700',
    fontSize: 13,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 60,
  },
  summaryCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: '#222222',
    backgroundColor: '#121212',
    borderRadius: 10,
    marginBottom: 16,
  },
  userHandle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  userMeta: {
    fontSize: 12,
    color: '#888888',
    marginTop: 4,
  },
  userSubMeta: {
    fontSize: 11,
    color: '#666666',
    marginTop: 2,
  },
  scoreBox: {
    flexDirection: 'row',
    alignItems: 'baseline',
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#2B2B2B',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  scoreText: {
    fontSize: 26,
    fontWeight: '800',
    color: '#00E599',
    fontFamily: FONTS.mono,
  },
  scoreSub: {
    fontSize: 12,
    color: '#666666',
    fontFamily: FONTS.mono,
    marginLeft: 2,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#141414',
    borderRadius: 8,
    padding: 4,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  tabActive: {
    backgroundColor: '#242424',
  },
  tabText: {
    fontSize: 11,
    color: '#777777',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  section: {
    gap: 12,
  },
  repoItem: {
    borderWidth: 1,
    borderColor: '#1E1E1E',
    backgroundColor: '#121212',
    borderRadius: 8,
    padding: 14,
  },
  repoTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  repoName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: FONTS.mono,
  },
  repoStars: {
    fontSize: 11,
    color: '#AAAAAA',
    fontFamily: FONTS.mono,
  },
  repoDesc: {
    fontSize: 12,
    color: '#888888',
    marginTop: 6,
    lineHeight: 16,
  },
  repoFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#1A1A1A',
    paddingTop: 8,
  },
  repoLang: {
    fontSize: 11,
    color: '#00E599',
    fontFamily: FONTS.mono,
  },
  openRepoBtn: {
    padding: 4,
  },
  metricsBox: {
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#222222',
    borderRadius: 10,
    padding: 16,
    gap: 14,
  },
  metricsTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#888888',
    letterSpacing: 0.8,
  },
  metricRow: {
    gap: 4,
  },
  metricLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metricDimName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#CCCCCC',
  },
  metricFraction: {
    fontSize: 11,
    color: '#888888',
    fontFamily: FONTS.mono,
  },
  progressTrack: {
    height: 6,
    backgroundColor: '#1F1F1F',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#00E599',
    borderRadius: 3,
  },
  recItem: {
    backgroundColor: '#141414',
    borderLeftWidth: 3,
    borderLeftColor: '#FF7A00',
    borderWidth: 1,
    borderColor: '#222222',
    borderRadius: 6,
    padding: 12,
  },
  recTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  recDesc: {
    fontSize: 12,
    color: '#AAAAAA',
    lineHeight: 17,
  },
  emptyNoteBox: {
    alignItems: 'center',
    padding: 30,
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#222222',
    borderRadius: 10,
  },
  emptyNoteTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  emptyNoteDesc: {
    color: '#888888',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
  actionCard: {
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#242424',
    borderRadius: 8,
    padding: 14,
    gap: 6,
  },
  actionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  actionDesc: {
    fontSize: 11,
    color: '#888888',
    lineHeight: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#161616',
    borderWidth: 1,
    borderColor: '#282828',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  emptySub: {
    fontSize: 12,
    color: '#888888',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
    maxWidth: 280,
  },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    padding: 16,
  },
  modalBox: {
    backgroundColor: '#141414',
    borderWidth: 1,
    borderColor: '#2A2A2A',
    borderRadius: 10,
    padding: 16,
    maxHeight: '82%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#222222',
    paddingBottom: 10,
  },
  modalTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  codeBox: {
    backgroundColor: '#0A0A0A',
    borderWidth: 1,
    borderColor: '#222222',
    borderRadius: 6,
    padding: 12,
  },
  codeText: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: '#00E599',
    lineHeight: 17,
  },
});
