import React from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import colors from '../constants/colors';

export default function LocationCard({
  coordinates,
  loading,
  error,
  permissionGranted,
  onRefresh,
  onPickPreset,
}) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.icon}>⌖</Text>
          <Text style={styles.title}>GPS Location</Text>
        </View>

        <View
          style={[
            styles.badge,
            permissionGranted ? styles.badgeGranted : styles.badgeDenied,
          ]}
        >
          <Text
            style={[
              styles.badgeText,
              permissionGranted ? styles.textGranted : styles.textDenied,
            ]}
          >
            {permissionGranted ? 'GPS Active' : 'Permission Needed'}
          </Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="small" color={colors.secondary} />
          <Text style={styles.loadingText}>Acquiring GPS fix...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>⚠ {error}</Text>
        </View>
      ) : coordinates ? (
        <View style={styles.coordsContainer}>
          <View style={styles.coordRow}>
            <View style={styles.coordBox}>
              <Text style={styles.coordLabel}>LATITUDE</Text>
              <Text style={styles.coordValue}>
                {coordinates.latitude ? coordinates.latitude.toFixed(5) : '--'}° N
              </Text>
            </View>

            <View style={styles.coordBox}>
              <Text style={styles.coordLabel}>LONGITUDE</Text>
              <Text style={styles.coordValue}>
                {coordinates.longitude ? coordinates.longitude.toFixed(5) : '--'}° E
              </Text>
            </View>
          </View>

          <View style={styles.metaRow}>
            <Text style={styles.metaText}>
              Accuracy: {coordinates.accuracy ? `±${coordinates.accuracy} m` : 'Demo / Balanced'}
            </Text>
            {coordinates.isSimulated && (
              <View style={styles.simBadge}>
                <Text style={styles.simText}>SIMULATED COORDS</Text>
              </View>
            )}
          </View>
        </View>
      ) : (
        <Text style={styles.placeholder}>No location data available yet.</Text>
      )}

      <View style={styles.footerRow}>
        <Pressable
          style={({ pressed }) => [
            styles.refreshButton,
            pressed && styles.buttonPressed,
          ]}
          onPress={onRefresh}
          disabled={loading}
        >
          <Text style={styles.refreshText}>↻ Refresh GPS</Text>
        </Pressable>

        {onPickPreset && (
          <Pressable
            style={({ pressed }) => [
              styles.simButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={onPickPreset}
          >
            <Text style={styles.simButtonText}>⚙ Demo Location</Text>
          </Pressable>
        )}
      </View>

      <View style={styles.consentNotice}>
        <Text style={styles.consentText}>
          🔒 Location data is shared exclusively for tourist safety monitoring, emergency SOS dispatch, and geo-fence alerts.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    fontSize: 20,
    color: colors.secondary,
    marginRight: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primary,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeGranted: {
    backgroundColor: '#E6F4EA',
  },
  badgeDenied: {
    backgroundColor: '#FCE8E6',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  textGranted: {
    color: '#137333',
  },
  textDenied: {
    color: '#C5221F',
  },
  centerContainer: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 12,
    color: colors.muted,
  },
  errorBox: {
    backgroundColor: '#FFF0F0',
    borderRadius: 8,
    padding: 10,
    marginVertical: 10,
  },
  errorText: {
    color: colors.danger,
    fontSize: 12,
  },
  coordsContainer: {
    marginVertical: 8,
  },
  coordRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  coordBox: {
    flex: 1,
    backgroundColor: '#F7F9FC',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#EAEFF5',
  },
  coordLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.muted,
    letterSpacing: 0.5,
  },
  coordValue: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.primary,
    marginTop: 4,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  metaText: {
    fontSize: 11,
    color: colors.muted,
  },
  simBadge: {
    backgroundColor: '#FFF4E5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  simText: {
    color: '#B25E00',
    fontSize: 9,
    fontWeight: '800',
  },
  placeholder: {
    fontSize: 12,
    color: colors.muted,
    marginVertical: 12,
  },
  footerRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  refreshButton: {
    flex: 1,
    backgroundColor: '#E6F3F1',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  refreshText: {
    color: colors.secondary,
    fontWeight: '700',
    fontSize: 12,
  },
  simButton: {
    flex: 1,
    backgroundColor: '#F1F4F8',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  simButtonText: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 12,
  },
  buttonPressed: {
    opacity: 0.7,
  },
  consentNotice: {
    borderTopWidth: 1,
    borderTopColor: '#EEF2F6',
    marginTop: 12,
    paddingTop: 8,
  },
  consentText: {
    fontSize: 10,
    color: colors.muted,
    lineHeight: 14,
  },
});
