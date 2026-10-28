import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Sparkles, Server } from 'lucide-react-native';

interface AiLoadingIndicatorProps {
  title?: string;
  defaultSubtitle?: string;
}

export const AiLoadingIndicator: React.FC<AiLoadingIndicatorProps> = ({
  title = 'Processing AI Request...',
  defaultSubtitle = 'Analyzing technical parameters and computing results...',
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
      <View style={styles.topRow}>
        <ActivityIndicator size="small" color="#FF7A00" />
        <Text style={styles.titleText}>{title}</Text>
      </View>

      {isServerWaking ? (
        <View style={styles.warmupNotice}>
          <Server size={14} color="#FFA34D" style={{ marginTop: 2 }} />
          <View style={{ flex: 1 }}>
            <Text style={styles.warmupTitle}>Cloud Engine Warming Up</Text>
            <Text style={styles.warmupSubtitle}>
              Our cloud AI instances spin down when idle to conserve resources. Waking up may take 15–30 seconds. Please hold on!
            </Text>
          </View>
        </View>
      ) : (
        <Text style={styles.subtitleText}>{defaultSubtitle}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#141414',
    borderWidth: 1,
    borderColor: '#262626',
    borderRadius: 12,
    padding: 16,
    marginVertical: 12,
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
});

export default AiLoadingIndicator;

