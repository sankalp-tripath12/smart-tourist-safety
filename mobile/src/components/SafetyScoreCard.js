import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import colors from '../constants/colors';

export default function SafetyScoreCard({ scoreData }) {
  if (!scoreData) {
    return (
      <View style={styles.card}>
        <Text style={styles.loadingText}>Calculating safety status...</Text>
      </View>
    );
  }

  const { safetyScore = 100, category = 'SAFE', explanation = '', factors = [] } = scoreData;

  const isSafe = category === 'SAFE';
  const isModerate = category === 'MODERATE';
  const isDanger = category === 'HIGH RISK';

  const badgeColor = isSafe ? '#16A085' : isModerate ? '#D97706' : '#B83240';
  const badgeBg = isSafe ? '#E6F7F2' : isModerate ? '#FEF3C7' : '#FCE8E6';

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View>
          <Text style={styles.label}>TOURIST SAFETY SCORE</Text>
          <Text style={styles.subtext}>Rule-Based Deterministic Engine</Text>
        </View>

        <View style={[styles.badge, { backgroundColor: badgeBg }]}>
          <Text style={[styles.badgeText, { color: badgeColor }]}>{category}</Text>
        </View>
      </View>

      <View style={styles.scoreRow}>
        <View style={styles.scoreCircle}>
          <Text style={[styles.scoreNumber, { color: badgeColor }]}>{safetyScore}</Text>
          <Text style={styles.scoreMax}>/ 100</Text>
        </View>

        <View style={styles.summaryContainer}>
          <Text style={styles.statusTitle}>
            {isSafe
              ? 'Normal Conditions'
              : isModerate
              ? 'Heightened Vigilance'
              : 'Immediate Attention Required'}
          </Text>
          <Text style={styles.explanation}>{explanation}</Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.track}>
        <View
          style={[
            styles.fill,
            {
              width: `${Math.max(5, Math.min(100, safetyScore))}%`,
              backgroundColor: badgeColor,
            },
          ]}
        />
      </View>

      {/* Contributing Factors */}
      {factors && factors.length > 0 && (
        <View style={styles.factorsContainer}>
          <Text style={styles.factorsTitle}>Score Factors Breakdown:</Text>
          {factors.map((f, idx) => (
            <View key={idx} style={styles.factorItem}>
              <Text
                style={[
                  styles.factorImpact,
                  { color: f.impact < 0 ? colors.danger : colors.secondary },
                ]}
              >
                {f.impact > 0 ? `+${f.impact}` : f.impact} pts
              </Text>
              <Text style={styles.factorDetail}>{f.detail}</Text>
            </View>
          ))}
        </View>
      )}

      <Text style={styles.disclaimer}>
        * Configurable MVP scoring algorithm based on zone proximity, SOS status, and movement anomalies.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#173B57',
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    color: '#B8D5DF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  subtext: {
    color: '#8CAEC2',
    fontSize: 10,
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 14,
  },
  scoreCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  scoreNumber: {
    fontSize: 24,
    fontWeight: '900',
    lineHeight: 28,
  },
  scoreMax: {
    fontSize: 10,
    color: colors.muted,
    fontWeight: '700',
  },
  summaryContainer: {
    flex: 1,
  },
  statusTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  explanation: {
    color: '#D1E0E8',
    fontSize: 11,
    lineHeight: 16,
    marginTop: 4,
  },
  track: {
    height: 6,
    backgroundColor: '#35536D',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 10,
  },
  fill: {
    height: 6,
    borderRadius: 3,
  },
  factorsContainer: {
    borderTopWidth: 1,
    borderTopColor: '#2C4963',
    paddingTop: 10,
    marginTop: 4,
  },
  factorsTitle: {
    color: '#B8D5DF',
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 6,
  },
  factorItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  factorImpact: {
    fontWeight: '800',
    fontSize: 11,
    width: 48,
  },
  factorDetail: {
    color: '#E5EDF4',
    fontSize: 11,
    flex: 1,
  },
  disclaimer: {
    color: '#8CAEC2',
    fontSize: 9,
    fontStyle: 'italic',
    marginTop: 8,
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 12,
  },
});
