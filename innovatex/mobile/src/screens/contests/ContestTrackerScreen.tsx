import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Linking,
  RefreshControl,
} from 'react-native';
import { COLORS, FONTS, SPACING } from '../../constants/theme';
import { ContestService } from '../../services';
import { ExternalLink } from 'lucide-react-native';

export default function ContestTrackerScreen() {
  const [contests, setContests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');

  const platforms = ['all', 'leetcode', 'codeforces', 'atcoder', 'codechef'];

  const fetchContests = async (platform = selectedPlatform) => {
    try {
      const data = await ContestService.getContests(platform);
      setContests(data || []);
    } catch (e) {
      console.warn('Contest fetch error', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchContests();
  }, []);

  const handleSelectPlatform = (plat: string) => {
    setSelectedPlatform(plat);
    setLoading(true);
    fetchContests(plat);
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchContests();
  };

  const formatDuration = (seconds: number) => {
    if (!seconds) return '2h';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hrs}h${mins > 0 ? ` ${mins}m` : ''}`;
  };

  return (
    <View style={styles.container}>
      {/* Platform Filter Bar */}
      <View style={styles.filterBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {platforms.map((plat) => (
            <TouchableOpacity
              key={plat}
              style={[styles.platBtn, selectedPlatform === plat && styles.platBtnActive]}
              onPress={() => handleSelectPlatform(plat)}
            >
              <Text style={[styles.platText, selectedPlatform === plat && styles.platTextActive]}>
                {plat.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="small" color={COLORS.textPrimary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.textPrimary} />}
        >
          {contests.length > 0 ? (
            contests.map((c, idx) => (
              <View key={idx} style={styles.item}>
                <View style={styles.itemHeader}>
                  <Text style={styles.platformBadge}>{c.platform || 'Contest'}</Text>
                  {c.difficulty ? (
                    <Text style={styles.difficulty}>{c.difficulty.toUpperCase()}</Text>
                  ) : null}
                </View>

                <Text style={styles.title}>{c.title}</Text>

                <View style={styles.metaRow}>
                  <Text style={styles.metaText}>
                    {new Date(c.start_time).toLocaleDateString()} {new Date(c.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                  <Text style={styles.metaText}>· {formatDuration(c.duration_seconds)}</Text>
                </View>

                {c.url ? (
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => Linking.openURL(c.url)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.actionText}>Register</Text>
                    <ExternalLink size={12} color={COLORS.textPrimary} />
                  </TouchableOpacity>
                ) : null}
              </View>
            ))
          ) : (
            <View style={styles.center}>
              <Text style={styles.emptyText}>No upcoming contests listed.</Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgCanvas,
  },
  filterBar: {
    backgroundColor: COLORS.bgCanvas,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingVertical: SPACING.sm,
  },
  filterScroll: {
    paddingHorizontal: SPACING.md,
    gap: SPACING.xs,
  },
  platBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.bgCanvas,
  },
  platBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  platText: {
    fontSize: 11,
    fontFamily: FONTS.mono,
    color: COLORS.textSecondary,
  },
  platTextActive: {
    color: COLORS.textInverse,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: 48,
    gap: SPACING.sm,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  item: {
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    backgroundColor: COLORS.bgCanvas,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  platformBadge: {
    fontSize: 11,
    fontFamily: FONTS.mono,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
  },
  difficulty: {
    fontSize: 10,
    fontFamily: FONTS.mono,
    color: COLORS.textMuted,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    fontFamily: FONTS.medium,
    marginTop: 6,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 6,
  },
  metaText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontFamily: FONTS.mono,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: SPACING.sm,
    alignSelf: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderDark,
    paddingBottom: 2,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textPrimary,
    fontFamily: FONTS.regular,
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontFamily: FONTS.regular,
  },
});
