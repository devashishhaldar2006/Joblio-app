import AiLoadingIndicator from '../../components/AiLoadingIndicator';
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Linking,
  Modal,
  TextInput,
} from 'react-native';
import { COLORS, FONTS, SPACING } from '../../constants/theme';
import { OpenSourceService } from '../../services';
import {
  ExternalLink,
  ChevronDown,
  Sparkles,
  GitPullRequest,
  Check,
  Star,
  BookOpen,
  X,
  Target,
  Search,
  Code2,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react-native';
import AppHeader from '../../components/AppHeader';

const PROGRAMMING_LANGUAGES = [
  'JavaScript',
  'TypeScript',
  'Python',
  'Go',
  'Rust',
  'Java',
  'C++',
  'PHP',
  'Ruby',
  'Kotlin',
  'Swift',
];

const EXPERIENCE_LEVELS = [
  { id: 'beginner', label: 'Beginner', desc: 'Good First Issues & low friction' },
  { id: 'intermediate', label: 'Intermediate', desc: 'Bug fixes, component features' },
  { id: 'advanced', label: 'Advanced', desc: 'Core architecture & performance' },
];

const POPULAR_SKILLS = [
  'React',
  'Next.js',
  'Node.js',
  'Express',
  'Vue',
  'Docker',
  'TailwindCSS',
  'FastAPI',
  'GraphQL',
  'PostgreSQL',
  'MongoDB',
  'Kubernetes',
];

export default function OpenSourceScreen({ navigation }: any) {
  const [selectedLanguage, setSelectedLanguage] = useState<string>('TypeScript');
  const [selectedLevel, setSelectedLevel] = useState<string>('beginner');
  const [selectedSkills, setSelectedSkills] = useState<string[]>(['React', 'TypeScript']);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals
  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  const [levelModalVisible, setLevelModalVisible] = useState(false);

  const [loading, setLoading] = useState(false);
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const toggleSkill = (skill: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const handleSearch = async () => {
    setLoading(true);
    setHasSearched(true);
    try {
      const data = await OpenSourceService.findOpportunities(
        selectedSkills,
        selectedLevel,
        selectedLanguage.toLowerCase(),
        searchQuery.trim()
      );
      setOpportunities(Array.isArray(data) ? data : []);
    } catch (e: any) {
      alert(e.response?.data?.error || e.message || 'Failed to find open source issues.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <AppHeader
        title="Open Source"
        badge="Contribute"
        badgeType="yellow"
        subtitle="Good first issues & repo matching"
        canGoBack
        onBack={() => navigation?.goBack()}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* GitHub Audit Feature Card */}
        <TouchableOpacity
          style={styles.auditFeatureCard}
          onPress={() => navigation?.navigate('GithubAudit')}
          activeOpacity={0.8}
        >
          <View style={styles.auditIconCircle}>
            <Code2 size={18} color="#00E599" />
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={styles.auditCardTitle}>GitHub Profile & Code Audit</Text>
              <View style={styles.proBadge}>
                <Text style={styles.proBadgeText}>AI Audit</Text>
              </View>
            </View>
            <Text style={styles.auditCardSubtitle}>
              Run repository quality checks, commit velocity analysis, and automated fixes.
            </Text>
          </View>
          <ChevronRight size={18} color="#888888" />
        </TouchableOpacity>

        {/* Controls Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.iconCircle}>
              <GitPullRequest size={18} color="#FF7A00" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>Issue & Repository Finder</Text>
              <Text style={styles.cardDesc}>
                Personalized GitHub repository issues scored to match your tech stack.
              </Text>
            </View>
          </View>

          {/* Text Input Search Field for Exploring Topics & Features */}
          <View style={styles.fieldSection}>
            <Text style={styles.fieldLabel}>EXPLORE TOPICS OR FEATURES</Text>
            <View style={styles.queryInputContainer}>
              <Search size={14} color="#888888" style={{ marginRight: 8 }} />
              <TextInput
                style={styles.queryInput}
                placeholder="e.g. LLM, CLI, compiler, authentication, web3..."
                placeholderTextColor="#666666"
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={handleSearch}
                returnKeyType="search"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearBtn}>
                  <X size={12} color="#888888" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Language Selector Dropdown */}
          <View style={styles.fieldSection}>
            <Text style={styles.fieldLabel}>PREFERRED LANGUAGE</Text>
            <TouchableOpacity
              style={styles.dropdownBtn}
              onPress={() => setLanguageModalVisible(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.dropdownValue}>{selectedLanguage}</Text>
              <ChevronDown size={16} color="#888888" />
            </TouchableOpacity>
          </View>

          {/* Experience Level Selector Dropdown */}
          <View style={styles.fieldSection}>
            <Text style={styles.fieldLabel}>EXPERIENCE LEVEL</Text>
            <TouchableOpacity
              style={styles.dropdownBtn}
              onPress={() => setLevelModalVisible(true)}
              activeOpacity={0.8}
            >
              <View>
                <Text style={styles.dropdownValue}>
                  {EXPERIENCE_LEVELS.find((l) => l.id === selectedLevel)?.label || 'Beginner'}
                </Text>
                <Text style={styles.dropdownSubtext}>
                  {EXPERIENCE_LEVELS.find((l) => l.id === selectedLevel)?.desc}
                </Text>
              </View>
              <ChevronDown size={16} color="#888888" />
            </TouchableOpacity>
          </View>

          {/* Multi-Select Skills Chips */}
          <View style={styles.fieldSection}>
            <View style={styles.labelRow}>
              <Text style={styles.fieldLabel}>MATCHING SKILLS</Text>
              <Text style={styles.selectedCountText}>
                {selectedSkills.length} selected
              </Text>
            </View>
            <View style={styles.chipGrid}>
              {POPULAR_SKILLS.map((skill) => {
                const isSelected = selectedSkills.includes(skill);
                return (
                  <TouchableOpacity
                    key={skill}
                    style={[styles.chip, isSelected && styles.chipSelected]}
                    onPress={() => toggleSkill(skill)}
                    activeOpacity={0.7}
                  >
                    {isSelected && <Check size={12} color="#FFFFFF" strokeWidth={2.5} />}
                    <Text
                      style={[
                        styles.chipText,
                        isSelected && styles.chipTextSelected,
                      ]}
                    >
                      {skill}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Search CTA */}
          <TouchableOpacity
            style={[styles.searchBtn, loading && styles.searchBtnDisabled]}
            onPress={handleSearch}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#000000" size="small" />
            ) : (
              <View style={styles.btnRow}>
                <Sparkles size={16} color="#000000" strokeWidth={2.2} />
                <Text style={styles.searchBtnText}>Find Contribution Issues</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Results List */}
        {loading && (
          <AiLoadingIndicator
            title={`Discovering ${selectedLanguage} Open Source Issues...`}
            defaultSubtitle="Searching active GitHub repositories for verified good-first-issues."
          />
        )}

        {!loading && hasSearched && opportunities.length === 0 && (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyTitle}>No matching issues found</Text>
            <Text style={styles.emptyDesc}>
              Try selecting fewer skill filters or changing your experience level.
            </Text>
          </View>
        )}

        {!loading && opportunities.length > 0 && (
          <View style={styles.resultsContainer}>
            <View style={styles.resultsHeaderRow}>
              <Text style={styles.resultsHeading}>
                RECOMMENDED ISSUES ({opportunities.length})
              </Text>
            </View>

            {opportunities.map((item: any, idx: number) => {
              const stars = item.repo_stars ?? item.stars ?? null;
              const matchScore = item.match_score ?? null;
              const issueUrl = item.issue_url || item.url;
              const repoUrl = item.repo_url;

              return (
                <View key={idx} style={styles.issueCard}>
                  {/* Repo Bar */}
                  <View style={styles.issueTopRow}>
                    <TouchableOpacity
                      onPress={() => repoUrl && Linking.openURL(repoUrl)}
                      activeOpacity={0.7}
                      style={styles.repoNameWrapper}
                    >
                      <BookOpen size={13} color="#888888" />
                      <Text style={styles.repoNameText} numberOfLines={1}>
                        {item.repo_name || 'GitHub Repo'}
                      </Text>
                    </TouchableOpacity>

                    <View style={styles.badgesRow}>
                      {stars !== null && (
                        <View style={styles.starBadge}>
                          <Star size={11} color="#E5A93C" fill="#E5A93C" />
                          <Text style={styles.starText}>{stars}</Text>
                        </View>
                      )}
                      {matchScore !== null && matchScore > 0 && (
                        <View style={styles.matchScoreBadge}>
                          <Target size={11} color="#00E599" />
                          <Text style={styles.matchScoreText}>{matchScore}% Match</Text>
                        </View>
                      )}
                    </View>
                  </View>

                  {/* Issue Title */}
                  <Text style={styles.issueTitleText}>
                    {item.issue_title || item.title || 'Contribution Opportunity'}
                  </Text>

                  {/* Why Good Fit */}
                  {item.why_good_fit && (
                    <Text style={styles.whyFitText}>{item.why_good_fit}</Text>
                  )}

                  {/* Skills tags */}
                  {Array.isArray(item.skills_overlap) && item.skills_overlap.length > 0 && (
                    <View style={styles.skillsRow}>
                      {item.skills_overlap.map((s: string, sIdx: number) => (
                        <View key={sIdx} style={styles.skillTag}>
                          <Text style={styles.skillTagText}>{s}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Action Link */}
                  {issueUrl && (
                    <TouchableOpacity
                      style={styles.actionBtn}
                      onPress={() => Linking.openURL(issueUrl)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.actionBtnText}>Open GitHub Issue #{item.issue_number || ''}</Text>
                      <ExternalLink size={13} color="#FFFFFF" />
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Language Selector Modal */}
      <Modal
        visible={languageModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setLanguageModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setLanguageModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Language</Text>
              <TouchableOpacity onPress={() => setLanguageModalVisible(false)}>
                <X size={18} color="#888888" />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 360 }}>
              {PROGRAMMING_LANGUAGES.map((lang) => (
                <TouchableOpacity
                  key={lang}
                  style={[
                    styles.modalOption,
                    selectedLanguage === lang && styles.modalOptionActive,
                  ]}
                  onPress={() => {
                    setSelectedLanguage(lang);
                    setLanguageModalVisible(false);
                  }}
                >
                  <Text
                    style={[
                      styles.modalOptionText,
                      selectedLanguage === lang && styles.modalOptionTextActive,
                    ]}
                  >
                    {lang}
                  </Text>
                  {selectedLanguage === lang && <Check size={16} color="#FF7A00" />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Level Selector Modal */}
      <Modal
        visible={levelModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setLevelModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setLevelModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Experience Level</Text>
              <TouchableOpacity onPress={() => setLevelModalVisible(false)}>
                <X size={18} color="#888888" />
              </TouchableOpacity>
            </View>
            {EXPERIENCE_LEVELS.map((lvl) => (
              <TouchableOpacity
                key={lvl.id}
                style={[
                  styles.modalOption,
                  selectedLevel === lvl.id && styles.modalOptionActive,
                ]}
                onPress={() => {
                  setSelectedLevel(lvl.id);
                  setLevelModalVisible(false);
                }}
              >
                <View>
                  <Text
                    style={[
                      styles.modalOptionText,
                      selectedLevel === lvl.id && styles.modalOptionTextActive,
                    ]}
                  >
                    {lvl.label}
                  </Text>
                  <Text style={styles.modalOptionSubtext}>{lvl.desc}</Text>
                </View>
                {selectedLevel === lvl.id && <Check size={16} color="#FF7A00" />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
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
  },
  queryInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111111',
    borderWidth: 1,
    borderColor: '#262626',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
  },
  queryInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: FONTS.regular,
  },
  clearBtn: {
    padding: 4,
  },
  auditFeatureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#222222',
    borderRadius: 10,
    padding: 14,
    gap: 12,
  },
  auditIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#181818',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#282828',
  },
  auditCardTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  proBadge: {
    backgroundColor: 'rgba(0, 229, 153, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  proBadgeText: {
    color: '#00E599',
    fontSize: 10,
    fontWeight: '700',
  },
  auditCardSubtitle: {
    color: '#888888',
    fontSize: 11,
    marginTop: 2,
    lineHeight: 15,
  },
  card: {
    backgroundColor: '#121212',
    borderColor: '#222222',
    borderWidth: 1,
    borderRadius: 12,
    padding: 18,
    marginBottom: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 18,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 122, 0, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  cardDesc: {
    color: '#888888',
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  fieldSection: {
    marginBottom: 16,
  },
  fieldLabel: {
    color: '#777777',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  selectedCountText: {
    color: '#FF7A00',
    fontSize: 11,
    fontWeight: '600',
  },
  dropdownBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#181818',
    borderWidth: 1,
    borderColor: '#2A2A2A',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  dropdownValue: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  dropdownSubtext: {
    color: '#777777',
    fontSize: 11,
    marginTop: 2,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#181818',
    borderWidth: 1,
    borderColor: '#262626',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  chipSelected: {
    backgroundColor: '#FF7A00',
    borderColor: '#FF7A00',
  },
  chipText: {
    color: '#AAAAAA',
    fontSize: 12,
    fontWeight: '500',
  },
  chipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  searchBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  searchBtnDisabled: {
    opacity: 0.6,
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchBtnText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '700',
  },
  loadingBox: {
    padding: 24,
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    color: '#888888',
    fontSize: 13,
    textAlign: 'center',
  },
  emptyBox: {
    padding: 28,
    alignItems: 'center',
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#222222',
    borderRadius: 12,
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  emptyDesc: {
    color: '#777777',
    fontSize: 13,
    textAlign: 'center',
  },
  resultsContainer: {
    gap: 12,
  },
  resultsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  resultsHeading: {
    color: '#777777',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  issueCard: {
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#202020',
    borderRadius: 12,
    padding: 16,
  },
  issueTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  repoNameWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    marginRight: 8,
  },
  repoNameText: {
    color: '#888888',
    fontSize: 12,
    fontFamily: FONTS.mono,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  starBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(229, 169, 60, 0.12)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 4,
  },
  starText: {
    color: '#E5A93C',
    fontSize: 11,
    fontWeight: '600',
  },
  matchScoreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 229, 153, 0.1)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 4,
  },
  matchScoreText: {
    color: '#00E599',
    fontSize: 11,
    fontWeight: '600',
  },
  issueTitleText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
    marginBottom: 8,
  },
  whyFitText: {
    color: '#999999',
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 10,
  },
  skillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 14,
  },
  skillTag: {
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#2A2A2A',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  skillTagText: {
    color: '#CCCCCC',
    fontSize: 11,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#1B1B1B',
    borderWidth: 1,
    borderColor: '#2D2D2D',
    borderRadius: 6,
    paddingVertical: 9,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#161616',
    borderWidth: 1,
    borderColor: '#262626',
    borderRadius: 14,
    padding: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#242424',
    paddingBottom: 10,
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  modalOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  modalOptionActive: {
    backgroundColor: 'rgba(255, 122, 0, 0.1)',
  },
  modalOptionText: {
    color: '#CCCCCC',
    fontSize: 14,
    fontWeight: '500',
  },
  modalOptionTextActive: {
    color: '#FF7A00',
    fontWeight: '700',
  },
  modalOptionSubtext: {
    color: '#777777',
    fontSize: 11,
    marginTop: 2,
  },
});
