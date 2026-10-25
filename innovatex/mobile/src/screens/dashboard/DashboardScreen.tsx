import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { COLORS, FONTS, SPACING } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { ArrowRight } from 'lucide-react-native';

export default function DashboardScreen({ navigation }: any) {
  const { user } = useAuth();
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 500);
  };

  const sections = [
    {
      title: 'GitHub Audit',
      meta: 'Code cadence, repository documentation, and CI/CD generation',
      route: 'GithubTab',
    },
    {
      title: 'Job Matcher',
      meta: 'Resume parsing, skill alignment score, and application tracker',
      route: 'JobsTab',
    },
    {
      title: 'Market Forecast',
      meta: '26-week skill trends, emerging tools, and demand velocity',
      route: 'MarketTab',
    },
    {
      title: 'Contest Directory',
      meta: 'Live programming rounds from LeetCode, Codeforces, AtCoder',
      route: 'ContestsTab',
    },
    {
      title: 'Open Source',
      meta: 'Issue discovery and pull request contribution steps',
      route: 'OpenSourceTab',
    },
    {
      title: 'Research Deconstruction',
      meta: 'ArXiv paper summary, architecture diagrams, and key findings',
      route: 'ResearchTab',
    },
  ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.textPrimary} />
      }
    >
      {/* Header Overview */}
      <View style={styles.header}>
        <Text style={styles.headerGreeting}>Account: {user?.email || 'developer'}</Text>
        <Text style={styles.headerTitle}>Overview</Text>
      </View>

      {/* Metrics Row */}
      <View style={styles.metricsRow}>
        <View style={styles.metricCell}>
          <Text style={styles.metricValue}>92%</Text>
          <Text style={styles.metricLabel}>Profile score</Text>
        </View>
        <View style={styles.metricCell}>
          <Text style={styles.metricValue}>14</Text>
          <Text style={styles.metricLabel}>Active roles</Text>
        </View>
        <View style={styles.metricCell}>
          <Text style={styles.metricValue}>5</Text>
          <Text style={styles.metricLabel}>Live rounds</Text>
        </View>
      </View>

      {/* Modules List */}
      <View style={styles.list}>
        {sections.map((item, idx) => (
          <TouchableOpacity
            key={idx}
            style={styles.listItem}
            onPress={() => navigation.navigate(item.route)}
            activeOpacity={0.7}
          >
            <View style={styles.listTextContainer}>
              <Text style={styles.itemTitle}>{item.title}</Text>
              <Text style={styles.itemMeta}>{item.meta}</Text>
            </View>
            <ArrowRight size={16} color={COLORS.textSecondary} />
          </TouchableOpacity>
        ))}
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
  },
  header: {
    marginBottom: SPACING.md,
    paddingTop: SPACING.xs,
  },
  headerGreeting: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontFamily: FONTS.mono,
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.textPrimary,
    fontFamily: FONTS.regular,
    letterSpacing: -0.5,
  },
  metricsRow: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.bgSubtle,
    marginBottom: SPACING.lg,
  },
  metricCell: {
    flex: 1,
    padding: SPACING.md,
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
    fontFamily: FONTS.mono,
  },
  metricLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontFamily: FONTS.regular,
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  list: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  listTextContainer: {
    flex: 1,
    paddingRight: SPACING.md,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
    fontFamily: FONTS.medium,
  },
  itemMeta: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontFamily: FONTS.regular,
    marginTop: 3,
    lineHeight: 16,
  },
});
