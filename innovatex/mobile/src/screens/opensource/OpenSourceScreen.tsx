import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { COLORS, FONTS, SPACING } from '../../constants/theme';
import { OpenSourceService } from '../../services';
import { ExternalLink } from 'lucide-react-native';

export default function OpenSourceScreen() {
  const [skills, setSkills] = useState('javascript, react');
  const [language, setLanguage] = useState('javascript');
  const [level, setLevel] = useState('beginner');
  const [loading, setLoading] = useState(false);
  const [opportunities, setOpportunities] = useState<any[]>([]);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const skillList = skills.split(',').map((s) => s.trim()).filter(Boolean);
      const data = await OpenSourceService.findOpportunities(skillList, level, language);
      setOpportunities(data || []);
    } catch (e: any) {
      alert(e.response?.data?.error || 'Failed to find issues');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <Text style={styles.title}>Open Source Contribution Finder</Text>
        <Text style={styles.desc}>
          Filter beginner-friendly and good first issues across public repositories.
        </Text>

        <View style={styles.field}>
          <Text style={styles.label}>Skill tags</Text>
          <TextInput
            style={styles.input}
            value={skills}
            onChangeText={setSkills}
            placeholder="e.g. typescript, python, react"
            placeholderTextColor={COLORS.textMuted}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Language</Text>
          <TextInput
            style={styles.input}
            value={language}
            onChangeText={setLanguage}
            placeholder="e.g. javascript"
            placeholderTextColor={COLORS.textMuted}
          />
        </View>

        <TouchableOpacity style={styles.btn} onPress={handleSearch} disabled={loading} activeOpacity={0.8}>
          {loading ? (
            <ActivityIndicator color={COLORS.textInverse} size="small" />
          ) : (
            <Text style={styles.btnText}>Search repository issues</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Issues List */}
      {opportunities.length > 0 && (
        <View style={styles.list}>
          <Text style={styles.listHeader}>Identified issues ({opportunities.length})</Text>
          {opportunities.map((repo: any, idx: number) => (
            <View key={idx} style={styles.item}>
              <Text style={styles.repoName}>{repo.repo_name || repo.name || 'GitHub repository'}</Text>
              <Text style={styles.issueTitle}>{repo.title || repo.issue_title || repo.description || 'Open task'}</Text>
              {repo.url ? (
                <TouchableOpacity
                  style={styles.linkRow}
                  onPress={() => Linking.openURL(repo.url)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.linkText}>View issue details</Text>
                  <ExternalLink size={12} color={COLORS.textPrimary} />
                </TouchableOpacity>
              ) : null}
            </View>
          ))}
        </View>
      )}
    </ScrollView>
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
  card: {
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    backgroundColor: COLORS.bgCanvas,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    fontFamily: FONTS.regular,
  },
  desc: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontFamily: FONTS.regular,
    marginTop: 4,
    lineHeight: 16,
    marginBottom: SPACING.md,
  },
  field: {
    marginBottom: SPACING.sm,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
    fontFamily: FONTS.regular,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    borderRadius: 2,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: COLORS.textPrimary,
    fontSize: 13,
    fontFamily: FONTS.regular,
  },
  btn: {
    backgroundColor: COLORS.primary,
    borderRadius: 2,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  btnText: {
    color: COLORS.textInverse,
    fontSize: 13,
    fontWeight: '600',
    fontFamily: FONTS.medium,
  },
  list: {
    gap: SPACING.sm,
  },
  listHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    fontFamily: FONTS.regular,
  },
  item: {
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
  },
  repoName: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontFamily: FONTS.mono,
  },
  issueTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
    fontFamily: FONTS.medium,
    marginTop: 4,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: SPACING.sm,
    alignSelf: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderDark,
    paddingBottom: 2,
  },
  linkText: {
    color: COLORS.textPrimary,
    fontSize: 12,
    fontWeight: '600',
    fontFamily: FONTS.regular,
  },
});
