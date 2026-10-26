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
import AppHeader from '../../components/AppHeader';

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

  const formatISTDateTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      if (isNaN(date.getTime())) return isoString;
      return date.toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      }) + ' IST';
    } catch {
      return isoString;
    }
  };

  const isEnglishOnly = (text: string) => {
    if (!text) return false;
    const nonEnglishRegex = /[\u0400-\u04FF\u4E00-\u9FFF\u3040-\u309F\u30A0-\u30FF\uAC00-\uD7AF\u0600-\u06FF]/;
    return !nonEnglishRegex.test(text);
  };

  return (
    <View style={styles.container}>
      <AppHeader
        title="Coding Contests"
        badge="Live"
        badgeType="yellow"
        subtitle="Competitive programming schedule (IST)"
      />
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
            contests
              .filter((c) => isEnglishOnly(c.title))
              .map((c, idx) => (
              <View key={idx} style={styles.item}>
                <View style={styles.itemHeader}>
                  <View style={styles.platformBadge}>
                    <Text style={styles.platformBadgeText}>{(c.platform || 'Contest').toUpperCase()}</Text>
                  </View>
                  {c.difficulty ? (
                    <Text style={styles.difficulty}>{c.difficulty.toUpperCase()}</Text>
                  ) : null}
                </View>

                <Text style={styles.title}>{c.title}</Text>

                <View style={styles.metaRow}>
                  <View style={styles.yellowDot} />
                  <Text style={styles.metaText}>{formatISTDateTime(c.start_time)}</Text>
                  <Text style={styles.metaDuration}>· {formatDuration(c.duration_seconds)}</Text>
                </View>

                {c.url ? (
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => Linking.openURL(c.url)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.actionText}>Register & Participate</Text>
                    <ExternalLink size={12} color={COLORS.yellowText} />
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
    borderColor: '#222222',
    borderRadius: 12,
    padding: SPACING.md,
    backgroundColor: '#0E0E0E',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  platformBadge: {
    backgroundColor: COLORS.yellowBg,
    borderColor: COLORS.yellowBorder,
    borderWidth: 1,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
  },
  platformBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    fontFamily: FONTS.mono,
    color: COLORS.yellowText,
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
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  yellowDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.yellowText,
  },
  metaText: {
    fontSize: 12,
    color: '#CCCCCC',
    fontFamily: FONTS.mono,
  },
  metaDuration: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontFamily: FONTS.mono,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: SPACING.sm,
    alignSelf: 'flex-start',
    backgroundColor: COLORS.yellowBg,
    borderWidth: 1,
    borderColor: COLORS.yellowBorder,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.yellowText,
    fontFamily: FONTS.medium,
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontFamily: FONTS.regular,
  },
});
