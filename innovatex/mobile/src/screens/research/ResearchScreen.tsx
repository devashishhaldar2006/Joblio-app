import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { COLORS, FONTS, SPACING } from '../../constants/theme';
import { ResearchService } from '../../services';

export default function ResearchScreen() {
  const [input, setInput] = useState('https://arxiv.org/abs/1706.03762');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleExplain = async () => {
    const clean = input.trim();
    if (!clean) return;
    setLoading(true);
    try {
      const data = await ResearchService.explainPaper(clean);
      setResult(data);
    } catch (e: any) {
      alert(e.response?.data?.error || 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  const explanation = result?.explanation || {};

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <Text style={styles.title}>Research Paper Synthesis</Text>
        <Text style={styles.desc}>
          Extract methodology, key contributions, and real-world system architecture from academic papers.
        </Text>

        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="ArXiv URL or paper title"
          placeholderTextColor={COLORS.textMuted}
          autoCapitalize="none"
        />

        <TouchableOpacity style={styles.btn} onPress={handleExplain} disabled={loading} activeOpacity={0.8}>
          {loading ? (
            <ActivityIndicator color={COLORS.textInverse} size="small" />
          ) : (
            <Text style={styles.btnText}>Deconstruct paper</Text>
          )}
        </TouchableOpacity>
      </View>

      {result && (
        <View style={styles.resultBox}>
          <Text style={styles.paperTitle}>{result.title || 'Paper synthesis'}</Text>
          <Text style={styles.paperAuthors}>
            {Array.isArray(result.authors) ? result.authors.join(', ') : result.authors || 'Researchers'}
          </Text>

          {explanation.tldr && (
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionHeader}>Summary</Text>
              <Text style={styles.bodyText}>{explanation.tldr}</Text>
            </View>
          )}

          {explanation.intuitive_explanation && (
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionHeader}>Core intuition</Text>
              <Text style={styles.bodyText}>{explanation.intuitive_explanation}</Text>
            </View>
          )}

          {explanation.key_contributions && (
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionHeader}>Primary innovations</Text>
              {explanation.key_contributions.map((c: string, idx: number) => (
                <View key={idx} style={styles.bulletRow}>
                  <Text style={styles.bulletSymbol}>—</Text>
                  <Text style={styles.bulletText}>{c}</Text>
                </View>
              ))}
            </View>
          )}
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
  input: {
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    borderRadius: 2,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: COLORS.textPrimary,
    fontSize: 13,
    fontFamily: FONTS.mono,
    marginBottom: SPACING.sm,
  },
  btn: {
    backgroundColor: COLORS.primary,
    borderRadius: 2,
    paddingVertical: 10,
    alignItems: 'center',
  },
  btnText: {
    color: COLORS.textInverse,
    fontSize: 13,
    fontWeight: '600',
    fontFamily: FONTS.medium,
  },
  resultBox: {
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    backgroundColor: COLORS.bgCanvas,
    gap: SPACING.md,
  },
  paperTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    fontFamily: FONTS.medium,
  },
  paperAuthors: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontFamily: FONTS.mono,
  },
  sectionBlock: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: SPACING.sm,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
    fontFamily: FONTS.regular,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  bodyText: {
    fontSize: 13,
    color: COLORS.textPrimary,
    fontFamily: FONTS.regular,
    lineHeight: 18,
  },
  bulletRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 4,
  },
  bulletSymbol: {
    color: COLORS.textSecondary,
    fontFamily: FONTS.mono,
  },
  bulletText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.textPrimary,
    fontFamily: FONTS.regular,
    lineHeight: 16,
  },
});
