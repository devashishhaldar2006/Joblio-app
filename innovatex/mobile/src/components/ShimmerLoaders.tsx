import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import ShimmerPlaceholder from './ShimmerPlaceholder';
import { SPACING } from '../constants/theme';

export const CardListShimmer: React.FC<{ count?: number }> = ({ count = 4 }) => {
  return (
    <View style={styles.container}>
      {Array.from({ length: count }).map((_, idx) => (
        <View key={idx} style={styles.card}>
          <View style={styles.headerRow}>
            <ShimmerPlaceholder width={70} height={20} borderRadius={4} />
            <ShimmerPlaceholder width={60} height={16} borderRadius={4} />
          </View>
          <ShimmerPlaceholder width="85%" height={22} borderRadius={4} style={{ marginTop: 12 }} />
          <ShimmerPlaceholder width="60%" height={16} borderRadius={4} style={{ marginTop: 8 }} />
          
          <View style={styles.footerRow}>
            <ShimmerPlaceholder width={110} height={14} borderRadius={4} />
            <ShimmerPlaceholder width={90} height={28} borderRadius={6} />
          </View>
        </View>
      ))}
    </View>
  );
};

export const MarketIntelligenceShimmer: React.FC = () => {
  return (
    <ScrollView contentContainerStyle={styles.marketContainer} showsVerticalScrollIndicator={false}>
      {/* Search Bar Shimmer */}
      <ShimmerPlaceholder width="100%" height={44} borderRadius={8} />

      {/* Metric Cards Row */}
      <View style={styles.metricRow}>
        <ShimmerPlaceholder width="48%" height={100} borderRadius={10} />
        <ShimmerPlaceholder width="48%" height={100} borderRadius={10} />
      </View>

      {/* Chart Block Shimmer */}
      <View style={styles.chartBlock}>
        <View style={styles.headerRow}>
          <ShimmerPlaceholder width={140} height={20} borderRadius={4} />
          <ShimmerPlaceholder width={70} height={20} borderRadius={12} />
        </View>
        <ShimmerPlaceholder width="100%" height={180} borderRadius={8} style={{ marginTop: 16 }} />
      </View>

      {/* Tech Cards List */}
      <View style={styles.container}>
        {Array.from({ length: 3 }).map((_, idx) => (
          <View key={idx} style={styles.card}>
            <View style={styles.headerRow}>
              <ShimmerPlaceholder width={100} height={20} borderRadius={4} />
              <ShimmerPlaceholder width={50} height={20} borderRadius={4} />
            </View>
            <ShimmerPlaceholder width="90%" height={14} borderRadius={4} style={{ marginTop: 10 }} />
            <ShimmerPlaceholder width="70%" height={14} borderRadius={4} style={{ marginTop: 6 }} />
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

export const AppBootShimmer: React.FC = () => {
  return (
    <View style={styles.bootContainer}>
      {/* Header Mock */}
      <View style={styles.bootHeader}>
        <View style={{ gap: 8 }}>
          <ShimmerPlaceholder width={130} height={24} borderRadius={6} />
          <ShimmerPlaceholder width={180} height={14} borderRadius={4} />
        </View>
        <ShimmerPlaceholder width={38} height={38} borderRadius={19} />
      </View>

      {/* Hero Banner / Highlight */}
      <ShimmerPlaceholder width="100%" height={140} borderRadius={12} style={{ marginTop: 20 }} />

      {/* 2x2 Grid */}
      <View style={[styles.metricRow, { marginTop: 20 }]}>
        <ShimmerPlaceholder width="48%" height={85} borderRadius={10} />
        <ShimmerPlaceholder width="48%" height={85} borderRadius={10} />
      </View>
      <View style={[styles.metricRow, { marginTop: 12 }]}>
        <ShimmerPlaceholder width="48%" height={85} borderRadius={10} />
        <ShimmerPlaceholder width="48%" height={85} borderRadius={10} />
      </View>

      {/* List items */}
      <View style={{ marginTop: 24, gap: 12 }}>
        <ShimmerPlaceholder width={160} height={20} borderRadius={4} />
        <ShimmerPlaceholder width="100%" height={75} borderRadius={10} />
        <ShimmerPlaceholder width="100%" height={75} borderRadius={10} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  card: {
    backgroundColor: '#0F0F0F',
    borderColor: '#1F1F1F',
    borderWidth: 1,
    borderRadius: 10,
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  marketContainer: {
    padding: SPACING.md,
    gap: 16,
    paddingBottom: 90,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  chartBlock: {
    backgroundColor: '#0F0F0F',
    borderColor: '#1F1F1F',
    borderWidth: 1,
    borderRadius: 10,
    padding: 16,
  },
  bootContainer: {
    flex: 1,
    backgroundColor: '#000000',
    padding: SPACING.lg,
    paddingTop: 50,
  },
  bootHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});

