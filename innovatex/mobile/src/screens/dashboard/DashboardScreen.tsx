import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Platform,
} from 'react-native';
import { COLORS, FONTS, SPACING } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import {
  Code2,
  Briefcase,
  TrendingUp,
  Trophy,
  GitPullRequest,
  BookOpen,
  ArrowUpRight,
  User,
  Sparkles,
  Zap,
} from 'lucide-react-native';

export default function DashboardScreen({ navigation }: any) {
  const { user } = useAuth();
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 500);
  };

  const quickFeatures = [
    {
      title: 'Find Jobs',
      desc: 'Resume match & listings',
      route: 'JobsTab',
      icon: Briefcase,
      badge: null,
      accent: 'default',
    },
    {
      title: 'Market Trends',
      desc: 'Demand & salary shifts',
      route: 'MarketTab',
      icon: TrendingUp,
      badge: 'Hot',
      accent: 'yellow',
    },
    {
      title: 'Contests',
      desc: 'Upcoming coding rounds',
      route: 'ContestsTab',
      icon: Trophy,
      badge: 'Live',
      accent: 'yellow',
    },
    {
      title: 'GitHub Review',
      desc: 'Portfolio & code check',
      route: 'GithubAudit',
      icon: Code2,
      badge: 'Audit',
      accent: 'red',
    },
  ];

  const exploreFeatures = [
    {
      title: 'Open Source Issues',
      desc: 'Find beginner-friendly repo issues & PR opportunities to contribute to',
      route: 'OpenSource',
      icon: GitPullRequest,
      tag: 'Contribute',
      tagType: 'yellow',
    },
  ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FFFFFF" />
      }
    >
      {/* Top Brand Bar & Profile */}
      <View style={styles.topBrandBar}>
        <View style={styles.brandContainer}>
          <Text style={styles.brandTitle}>
            Job<Text style={styles.brandAccent}>lio</Text>
          </Text>
          <View style={styles.proPill}>
            <Text style={styles.proPillText}>PRO</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.avatarButton}
          onPress={() => navigation.navigate('ProfileTab')}
          activeOpacity={0.7}
        >
          <User size={17} color="#FFFFFF" strokeWidth={2} />
        </TouchableOpacity>
      </View>

      {/* Greeting Banner */}
      <View style={styles.welcomeBanner}>
        <View style={styles.bannerRow}>
          <View>
            <Text style={styles.greetingText}>Welcome back,</Text>
            <Text style={styles.userName}>
              {user?.name || user?.email?.split('@')[0] || 'Developer'}
            </Text>
          </View>
          <View style={styles.statusPill}>
            <View style={styles.livePulseDot} />
            <Text style={styles.statusPillText}>Online</Text>
          </View>
        </View>
      </View>

      {/* Clean Status Overview with Modern Yellow/Red Highlights */}
      <View style={styles.overviewBox}>
        <View style={styles.overviewItem}>
          <Text style={styles.overviewValue}>Active</Text>
          <Text style={styles.overviewLabel}>Account</Text>
        </View>
        <View style={styles.dividerVertical} />
        <View style={styles.overviewItem}>
          <View style={styles.valueRow}>
            <View style={styles.yellowDot} />
            <Text style={[styles.overviewValue, { color: COLORS.yellowText }]}>80+</Text>
          </View>
          <Text style={styles.overviewLabel}>Live contests</Text>
        </View>
        <View style={styles.dividerVertical} />
        <View style={styles.overviewItem}>
          <View style={styles.valueRow}>
            <View style={styles.redDot} />
            <Text style={[styles.overviewValue, { color: COLORS.redText }]}>2</Text>
          </View>
          <Text style={styles.overviewLabel}>Audit alerts</Text>
        </View>
      </View>

      {/* Quick Access Grid */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Quick actions</Text>
        <Sparkles size={14} color="#888888" />
      </View>
      <View style={styles.grid}>
        {quickFeatures.map((item, idx) => {
          const Icon = item.icon;
          const isYellow = item.accent === 'yellow';
          const isRed = item.accent === 'red';
          return (
            <TouchableOpacity
              key={idx}
              style={[
                styles.gridCard,
                isYellow && styles.gridCardYellow,
                isRed && styles.gridCardRed,
              ]}
              onPress={() => navigation.navigate(item.route)}
              activeOpacity={0.75}
            >
              <View style={styles.cardHeaderRow}>
                <View
                  style={[
                    styles.iconCircle,
                    isYellow && styles.iconCircleYellow,
                    isRed && styles.iconCircleRed,
                  ]}
                >
                  <Icon
                    size={17}
                    color={
                      isYellow
                        ? COLORS.yellowText
                        : isRed
                        ? COLORS.redText
                        : '#FFFFFF'
                    }
                    strokeWidth={2}
                  />
                </View>
                {item.badge ? (
                  <View
                    style={[
                      styles.badgeBase,
                      isYellow && styles.badgeYellow,
                      isRed && styles.badgeRed,
                    ]}
                  >
                    <Text
                      style={[
                        styles.badgeTextBase,
                        isYellow && styles.badgeYellowText,
                        isRed && styles.badgeRedText,
                      ]}
                    >
                      {item.badge}
                    </Text>
                  </View>
                ) : (
                  <ArrowUpRight size={16} color="#666666" />
                )}
              </View>
              <View>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardDesc}>{item.desc}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Explore Section */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Explore</Text>
      </View>
      <View style={styles.exploreList}>
        {exploreFeatures.map((item, idx) => {
          const Icon = item.icon;
          const isYellowTag = item.tagType === 'yellow';
          return (
            <TouchableOpacity
              key={idx}
              style={styles.exploreRow}
              onPress={() => navigation.navigate(item.route)}
              activeOpacity={0.75}
            >
              <View style={[styles.iconCircle, isYellowTag && styles.iconCircleYellow]}>
                <Icon
                  size={17}
                  color={isYellowTag ? COLORS.yellowText : '#FFFFFF'}
                  strokeWidth={1.8}
                />
              </View>
              <View style={styles.exploreContent}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={styles.exploreTitle}>{item.title}</Text>
                  {item.tag && (
                    <View style={isYellowTag ? styles.badgeYellow : styles.badgeDefault}>
                      <Text style={isYellowTag ? styles.badgeYellowText : styles.badgeDefaultText}>
                        {item.tag}
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={styles.exploreDesc}>{item.desc}</Text>
              </View>
              <ArrowUpRight size={16} color="#666666" />
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: Platform.OS === 'android' ? 36 : 14,
    paddingBottom: 40,
  },
  topBrandBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#161616',
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: FONTS.medium,
    letterSpacing: -0.6,
  },
  brandAccent: {
    color: COLORS.yellowText,
  },
  proPill: {
    backgroundColor: COLORS.yellowBg,
    borderWidth: 1,
    borderColor: COLORS.yellowBorder,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  proPillText: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.yellowText,
    fontFamily: FONTS.mono,
    letterSpacing: 0.5,
  },
  avatarButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#161616',
    borderWidth: 1,
    borderColor: '#262626',
    alignItems: 'center',
    justifyContent: 'center',
  },
  welcomeBanner: {
    marginBottom: 20,
  },
  bannerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greetingText: {
    fontSize: 13,
    color: '#888888',
    fontFamily: FONTS.regular,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: FONTS.medium,
    letterSpacing: -0.5,
    marginTop: 2,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#111111',
    borderWidth: 1,
    borderColor: '#222222',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  livePulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.yellowText,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#CCCCCC',
    fontFamily: FONTS.medium,
  },
  overviewBox: {
    flexDirection: 'row',
    backgroundColor: '#0E0E0E',
    borderWidth: 1,
    borderColor: '#222222',
    borderRadius: 12,
    paddingVertical: 14,
    marginBottom: 24,
  },
  overviewItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dividerVertical: {
    width: 1,
    backgroundColor: '#202020',
  },
  overviewValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: FONTS.medium,
  },
  overviewLabel: {
    fontSize: 11,
    color: '#777777',
    fontFamily: FONTS.regular,
    marginTop: 3,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  yellowDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.yellowText,
  },
  redDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.redText,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E5E5E5',
    fontFamily: FONTS.medium,
    letterSpacing: -0.2,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  gridCard: {
    width: '48%',
    backgroundColor: '#0E0E0E',
    borderWidth: 1,
    borderColor: '#222222',
    borderRadius: 12,
    padding: 14,
    justifyContent: 'space-between',
    minHeight: 116,
  },
  gridCardYellow: {
    borderColor: COLORS.yellowBorder,
    backgroundColor: '#0F0E0B',
  },
  gridCardRed: {
    borderColor: COLORS.redBorder,
    backgroundColor: '#100B0B',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#181818',
    borderWidth: 1,
    borderColor: '#282828',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleYellow: {
    backgroundColor: COLORS.yellowBg,
    borderColor: COLORS.yellowBorder,
  },
  iconCircleRed: {
    backgroundColor: COLORS.redBg,
    borderColor: COLORS.redBorder,
  },
  badgeBase: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  badgeTextBase: {
    fontSize: 10,
    fontWeight: '700',
    fontFamily: FONTS.medium,
  },
  badgeYellow: {
    backgroundColor: COLORS.yellowBg,
    borderColor: COLORS.yellowBorder,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  badgeYellowText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.yellowText,
    fontFamily: FONTS.medium,
  },
  badgeRed: {
    backgroundColor: COLORS.redBg,
    borderColor: COLORS.redBorder,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  badgeRedText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.redText,
    fontFamily: FONTS.medium,
  },
  badgeDefault: {
    backgroundColor: '#1E1E1E',
    borderColor: '#2A2A2A',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  badgeDefaultText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#888888',
    fontFamily: FONTS.medium,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: FONTS.medium,
    marginBottom: 2,
  },
  cardDesc: {
    fontSize: 11,
    color: '#777777',
    fontFamily: FONTS.regular,
    lineHeight: 15,
  },
  exploreList: {
    gap: 10,
  },
  exploreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0E0E0E',
    borderWidth: 1,
    borderColor: '#222222',
    borderRadius: 12,
    padding: 14,
  },
  exploreContent: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  exploreTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: FONTS.medium,
  },
  exploreDesc: {
    fontSize: 12,
    color: '#777777',
    fontFamily: FONTS.regular,
    marginTop: 2,
  },
});
