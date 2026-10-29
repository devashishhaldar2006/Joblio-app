import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { COLORS, FONTS } from '../constants/theme';
import { ChevronLeft } from 'lucide-react-native';

interface AppHeaderProps {
  title: string;
  badge?: string;
  badgeType?: 'yellow' | 'red' | 'default';
  subtitle?: string;
  canGoBack?: boolean;
  onBack?: () => void;
  rightElement?: React.ReactNode;
}

export default function AppHeader({
  title,
  badge,
  badgeType = 'yellow',
  subtitle,
  canGoBack = false,
  onBack,
  rightElement,
}: AppHeaderProps) {
  const isYellow = badgeType === 'yellow';
  const isRed = badgeType === 'red';

  return (
    <View style={styles.headerRoot}>
      <View style={styles.topRow}>
        <View style={styles.leftGroup}>
          {canGoBack && (
            <TouchableOpacity
              style={styles.backButton}
              onPress={onBack}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <ChevronLeft size={20} color="#FFFFFF" strokeWidth={2.2} />
            </TouchableOpacity>
          )}

          <View style={styles.titleWrapper}>
            <View style={styles.titleRow}>
              <Text style={styles.headerTitle}>{title}</Text>
              {badge && (
                <View
                  style={[
                    styles.badgeBase,
                    isYellow && styles.badgeYellow,
                    isRed && styles.badgeRed,
                  ]}
                >
                  <Text
                    style={[
                      styles.badgeText,
                      isYellow && styles.badgeTextYellow,
                      isRed && styles.badgeTextRed,
                    ]}
                  >
                    {badge}
                  </Text>
                </View>
              )}
            </View>
            {subtitle ? <Text style={styles.headerSubtitle}>{subtitle}</Text> : null}
          </View>
        </View>

        {rightElement ? <View style={styles.rightGroup}>{rightElement}</View> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerRoot: {
    backgroundColor: '#000000',
    borderBottomWidth: 1,
    borderBottomColor: '#161616',
    paddingHorizontal: 18,
    paddingTop: Platform.OS === 'android' ? 48 : 22,
    paddingBottom: 16,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#242424',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleWrapper: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: FONTS.medium,
    letterSpacing: -0.4,
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#777777',
    fontFamily: FONTS.regular,
    marginTop: 1,
  },
  badgeBase: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
    borderWidth: 1,
    backgroundColor: '#1E1E1E',
    borderColor: '#2E2E2E',
  },
  badgeYellow: {
    backgroundColor: COLORS.yellowBg,
    borderColor: COLORS.yellowBorder,
  },
  badgeRed: {
    backgroundColor: COLORS.redBg,
    borderColor: COLORS.redBorder,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
    fontFamily: FONTS.mono,
    color: '#888888',
    letterSpacing: 0.5,
  },
  badgeTextYellow: {
    color: COLORS.yellowText,
  },
  badgeTextRed: {
    color: COLORS.redText,
  },
  rightGroup: {
    marginLeft: 12,
  },
});
