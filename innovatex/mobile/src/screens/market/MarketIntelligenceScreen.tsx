import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { COLORS, FONTS, SPACING } from '../../constants/theme';
import { MarketService } from '../../services';

export default function MarketIntelligenceScreen() {
  const [loading, setLoading] = useState(true);
  const [trendingData, setTrendingData] = useState<any>(null);
  const [snapshotData, setSnapshotData] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const [trend, snap] = await Promise.all([
        MarketService.getTrending().catch(() => null),
        MarketService.getSnapshot().catch(() => null),
      ]);
      setTrendingData(trend);
      setSnapshotData(snap);
    } catch (e) {
      console.warn('Market error', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const topSkills = snapshotData?.top_skills || [
    { skill: 'Python', percentage: 54.2, wow_change: 2.4 },
    { skill: 'React', percentage: 48.6, wow_change: 1.8 },
    { skill: 'TypeScript', percentage: 45.1, wow_change: 3.2 },
    { skill: 'AWS', percentage: 42.0, wow_change: 1.1 },
    { skill: 'Docker', percentage: 39.5, wow_change: 2.1 },
    { skill: 'Kubernetes', percentage: 31.4, wow_change: 4.5 },
  ];

  const emerging = trendingData?.top_5_emerging || ['vLLM', 'Mamba', 'Ollama', 'CrewAI', 'ChromaDB'];

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="small" color={COLORS.textPrimary} />
        <Text style={styles.loadingText}>Fetching market signals...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.textPrimary} />}
    >
      {/* Editorial Overview Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Market Forecast</Text>
        <Text style={styles.desc}>
          Aggregated technical competencies across active engineering job postings.
        </Text>
      </View>

      {/* Emerging Tools Strip */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>High-velocity tooling</Text>
        <View style={styles.chipRow}>
          {emerging.map((skill: string, idx: number) => (
            <View key={idx} style={styles.chip}>
              <Text style={styles.chipText}>{skill}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Demand Table */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Competency demand & momentum</Text>

        <View style={styles.table}>
          {topSkills.map((item: any, idx: number) => {
            const isPositive = (item.wow_change ?? 0) >= 0;
            return (
              <View key={idx} style={styles.tableRow}>
                <View style={styles.cellMain}>
                  <Text style={styles.skillName}>{item.skill}</Text>
                  {/* Subtle bar indicator */}
                  <View style={styles.track}>
                    <View style={[styles.fill, { width: `${Math.min(100, item.percentage || 40)}%` }]} />
                  </View>
                </View>

                <View style={styles.cellMeta}>
                  <Text style={styles.percentageText}>{item.percentage}%</Text>
                  <Text style={styles.deltaText}>
                    {isPositive ? `+${item.wow_change}%` : `${item.wow_change}%`}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      </View>
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
    gap: SPACING.lg,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.bgCanvas,
  },
  loadingText: {
    marginTop: SPACING.sm,
    color: COLORS.textSecondary,
    fontSize: 12,
    fontFamily: FONTS.regular,
  },
  header: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: SPACING.md,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.textPrimary,
    fontFamily: FONTS.regular,
    letterSpacing: -0.5,
  },
  desc: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontFamily: FONTS.regular,
    marginTop: 4,
    lineHeight: 18,
  },
  section: {
    gap: SPACING.xs,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textMuted,
    fontFamily: FONTS.regular,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  chip: {
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.bgSubtle,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  chipText: {
    fontSize: 12,
    fontFamily: FONTS.mono,
    color: COLORS.textPrimary,
  },
  table: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  cellMain: {
    flex: 1,
    marginRight: SPACING.md,
  },
  skillName: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
    fontFamily: FONTS.regular,
    marginBottom: 4,
  },
  track: {
    height: 3,
    backgroundColor: COLORS.bgSubtle,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: COLORS.primary,
  },
  cellMeta: {
    alignItems: 'flex-end',
  },
  percentageText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
    fontFamily: FONTS.mono,
  },
  deltaText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontFamily: FONTS.mono,
    marginTop: 1,
  },
});
