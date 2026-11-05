import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Server } from 'lucide-react-native';
import ShimmerPlaceholder from './ShimmerPlaceholder';

interface AiLoadingIndicatorProps {
  title?: string;
  defaultSubtitle?: string;
  showShimmerCards?: boolean;
}

export const AiLoadingIndicator: React.FC<AiLoadingIndicatorProps> = ({
  title = 'Processing AI Request...',
  defaultSubtitle = 'Analyzing technical parameters and computing results...',
  showShimmerCards = true,
}) => {
  const [secondsElapsed, setSecondsElapsed] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const isServerWaking = secondsElapsed >= 7;

  return (
    <View style={styles.container}>
      <View style={styles.topCard}>
        <View style={styles.topRow}>
          <ShimmerPlaceholder width={18} height={18} borderRadius={9} />
          <Text style={styles.titleText}>{title}</Text>
        </View>

        {isServerWaking ? (
          <View style={styles.warmupNotice}>
            <Server size={14} color="#FFA34D" style={{ marginTop: 2 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.warmupTitle}>Cloud Server Waking Up ({secondsElapsed}s)</Text>
              <Text style={styles.warmupSubtitle}>
                Our backend or AI instance spins down when idle to conserve cloud resources. Booting takes ~15–30s. Please hold tight!
              </Text>
            </View>
          </View>
        ) : (
          <Text style={styles.subtitleText}>{defaultSubtitle}</Text>
        )}
      </View>

      {showShimmerCards && (
        <View style={styles.shimmerSection}>
          <View style={styles.shimmerCard}>
            <View style={styles.shimmerHeader}>
              <ShimmerPlaceholder width={100} height={16} borderRadius={4} />
              <ShimmerPlaceholder width={50} height={16} borderRadius={4} />
            </View>
            <ShimmerPlaceholder width="80%" height={18} borderRadius={4} style={{ marginTop: 10 }} />
            <ShimmerPlaceholder width="50%" height={14} borderRadius={4} style={{ marginTop: 8 }} />
            <View style={styles.shimmerFooter}>
              <ShimmerPlaceholder width={90} height={14} borderRadius={4} />
              <ShimmerPlaceholder width={80} height={24} borderRadius={6} />
            </View>
          </View>

          <View style={styles.shimmerCard}>
            <View style={styles.shimmerHeader}>
              <ShimmerPlaceholder width={120} height={16} borderRadius={4} />
              <ShimmerPlaceholder width={40} height={16} borderRadius={4} />
            </View>
            <ShimmerPlaceholder width="75%" height={18} borderRadius={4} style={{ marginTop: 10 }} />
            <ShimmerPlaceholder width="40%" height={14} borderRadius={4} style={{ marginTop: 8 }} />
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
    gap: 12,
  },
  topCard: {
    backgroundColor: '#141414',
    borderWidth: 1,
    borderColor: '#262626',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 10,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  titleText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  subtitleText: {
    color: '#888888',
    fontSize: 12,
    textAlign: 'center',
  },
  warmupNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: 'rgba(255, 122, 0, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 122, 0, 0.25)',
    borderRadius: 8,
    padding: 10,
    width: '100%',
  },
  warmupTitle: {
    color: '#FFA34D',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  warmupSubtitle: {
    color: '#CCCCCC',
    fontSize: 11,
    lineHeight: 15,
  },
  shimmerSection: {
    gap: 10,
  },
  shimmerCard: {
    backgroundColor: '#0F0F0F',
    borderWidth: 1,
    borderColor: '#1E1E1E',
    borderRadius: 10,
    padding: 14,
  },
  shimmerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  shimmerFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
  },
});

export default AiLoadingIndicator;
