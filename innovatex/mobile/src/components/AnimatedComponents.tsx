import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { FONTS } from '../constants/theme';

interface AnimatedScoreBadgeProps {
  score: number;
  maxScore?: number;
}

export const AnimatedScoreBadge: React.FC<AnimatedScoreBadgeProps> = ({
  score,
  maxScore = 100,
}) => {
  const [displayScore, setDisplayScore] = useState(0);
  const scaleAnim = useRef(new Animated.Value(0.7)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Reset and start entrance spring & count-up
    scaleAnim.setValue(0.7);
    opacityAnim.setValue(0);

    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        tension: 50,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();

    // Smooth counter animation
    const duration = 1000;
    const start = 0;
    const end = Math.min(score, maxScore);
    const startTime = Date.now();

    const interval = setInterval(() => {
      const now = Date.now();
      const progress = Math.min(1, (now - startTime) / duration);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + (end - start) * eased);
      setDisplayScore(current);

      if (progress >= 1) {
        clearInterval(interval);
      }
    }, 25);

    return () => clearInterval(interval);
  }, [score, maxScore, opacityAnim, scaleAnim]);

  const scoreColor =
    score >= 80 ? '#00E599' : score >= 60 ? '#FFA34D' : '#FF4D4D';

  return (
    <Animated.View
      style={[
        styles.scoreBox,
        {
          opacity: opacityAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <Text style={[styles.scoreText, { color: scoreColor }]}>
        {displayScore}
      </Text>
      <Text style={styles.scoreSub}>/{maxScore}</Text>
    </Animated.View>
  );
};

interface AnimatedProgressBarProps {
  percent: number;
  color?: string;
  height?: number;
}

export const AnimatedProgressBar: React.FC<AnimatedProgressBarProps> = ({
  percent,
  color = '#00E599',
  height = 4,
}) => {
  const widthAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    widthAnim.setValue(0);
    Animated.timing(widthAnim, {
      toValue: Math.min(100, Math.max(0, percent)),
      duration: 800,
      useNativeDriver: false,
    }).start();
  }, [percent, widthAnim]);

  const widthInterpolation = widthAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={[styles.progressTrack, { height }]}>
      <Animated.View
        style={[
          styles.progressFill,
          {
            backgroundColor: color,
            width: widthInterpolation,
            height,
          },
        ]}
      />
    </View>
  );
};

interface AnimatedCardProps {
  children: React.ReactNode;
  delay?: number;
  style?: any;
}

export const AnimatedCard: React.FC<AnimatedCardProps> = ({
  children,
  delay = 0,
  style,
}) => {
  const translateY = useRef(new Animated.Value(20)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 450,
        delay,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        friction: 7,
        tension: 60,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, [delay, opacity, translateY]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity,
          transform: [{ translateY }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  scoreBox: {
    flexDirection: 'row',
    alignItems: 'baseline',
    backgroundColor: '#161616',
    borderWidth: 1,
    borderColor: '#282828',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  scoreText: {
    fontSize: 26,
    fontWeight: '800',
    fontFamily: FONTS.mono,
  },
  scoreSub: {
    fontSize: 12,
    color: '#666666',
    fontFamily: FONTS.mono,
    marginLeft: 2,
  },
  progressTrack: {
    backgroundColor: '#202020',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    borderRadius: 2,
  },
});

