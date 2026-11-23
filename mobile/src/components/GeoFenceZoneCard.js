import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import colors from '../constants/colors';

export default function GeoFenceZoneCard({ zone }) {
  const isDanger = zone.riskLevel === 'DANGER';
  const isCaution = zone.riskLevel === 'CAUTION';
  const isInside = zone.isInside;

  const badgeColor = isDanger ? colors.danger : isCaution ? '#D97706' : colors.success;
  const badgeBg = isDanger ? '#FCE8E6' : isCaution ? '#FEF3C7' : '#E6F7F2';

  return (
    <View style={[styles.card, isInside && styles.activeBorder]}>
      <View style={styles.topRow}>
        <View style={styles.titleContainer}>
          <Text style={styles.name}>{zone.name}</Text>
          <Text style={styles.radius}>Radius: {zone.radius}m</Text>
        </View>

        <View style={[styles.badge, { backgroundColor: badgeBg }]}>
          <Text style={[styles.badgeText, { color: badgeColor }]}>{zone.riskLevel}</Text>
        </View>
      </View>

      {zone.description ? (
        <Text style={styles.description}>{zone.description}</Text>
      ) : null}

      <View style={styles.footerRow}>
        <View style={styles.distanceBox}>
          <Text style={styles.distanceLabel}>DISTANCE:</Text>
          <Text style={styles.distanceValue}>
            {zone.distanceMeters !== undefined
              ? zone.distanceMeters > 1000
                ? `${(zone.distanceMeters / 1000).toFixed(1)} km`
                : `${zone.distanceMeters} m`
              : '--'}
          </Text>
        </View>

        {isInside ? (
          <View style={[styles.statusBadge, { backgroundColor: badgeColor }]}>
            <Text style={styles.statusText}>● YOU ARE INSIDE</Text>
          </View>
        ) : (
          <Text style={styles.outsideText}>Outside perimeter</Text>
        )}
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
  activeBorder: {
    borderColor: colors.danger,
    borderWidth: 1.5,
    backgroundColor: '#FFFAFA',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleContainer: {
    flex: 1,
    marginRight: 8,
  },
  name: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.primary,
  },
  radius: {
    fontSize: 11,
    color: colors.muted,
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  description: {
    fontSize: 11,
    color: '#526276',
    marginTop: 6,
    lineHeight: 16,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0F3F7',
  },
  distanceBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  distanceLabel: {
    fontSize: 10,
    color: colors.muted,
    fontWeight: '700',
  },
  distanceValue: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  outsideText: {
    fontSize: 10,
    color: colors.muted,
  },
});
