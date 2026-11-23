import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import colors from '../constants/colors';

export default function AnomalyAlertCard({ alert }) {
  const isCritical = alert.severity === 'CRITICAL';
  const isHigh = alert.severity === 'HIGH';
  const isMedium = alert.severity === 'MEDIUM';

  const badgeColor = isCritical
    ? '#7F1D1D'
    : isHigh
    ? colors.danger
    : isMedium
    ? '#B45309'
    : colors.secondary;

  const badgeBg = isCritical
    ? '#FEE2E2'
    : isHigh
    ? '#FEE2E2'
    : isMedium
    ? '#FEF3C7'
    : '#E6F4EA';

  const formattedDate = alert.createdAt
    ? new Date(alert.createdAt).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  return (
    <View style={[styles.card, isCritical && styles.criticalBorder]}>
      <View style={styles.topRow}>
        <View style={styles.typeBox}>
          <Text style={styles.icon}>◈</Text>
          <Text style={styles.type}>{alert.type.replace(/_/g, ' ')}</Text>
        </View>

        <View style={[styles.badge, { backgroundColor: badgeBg }]}>
          <Text style={[styles.badgeText, { color: badgeColor }]}>{alert.severity}</Text>
        </View>
      </View>

      <Text style={styles.description}>{alert.description}</Text>

      <View style={styles.footerRow}>
        <Text style={styles.timestamp}>Detected: {formattedDate || 'Just now'}</Text>
        <View style={styles.statusBox}>
          <Text style={styles.statusText}>STATUS: {alert.status || 'ACTIVE'}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 10,
  },
  criticalBorder: {
    borderColor: colors.danger,
    borderWidth: 1.5,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  typeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  icon: {
    fontSize: 14,
    color: colors.primary,
  },
  type: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
  },
  description: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 17,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  timestamp: {
    fontSize: 10,
    color: colors.muted,
  },
  statusBox: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748B',
  },
});
