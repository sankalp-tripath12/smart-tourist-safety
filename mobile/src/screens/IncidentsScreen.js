import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import colors from '../constants/colors';
import AppHeader from '../components/AppHeader';
import { getAllIncidents, getAllAnomalies } from '../services/api';

export default function IncidentsScreen() {
  const [filter, setFilter] = useState('ALL'); // ALL, SOS, GEOFENCE, ANOMALY
  const [incidents, setIncidents] = useState([]);
  const [anomalies, setAnomalies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const [incRes, anomRes] = await Promise.all([
        getAllIncidents(),
        getAllAnomalies(),
      ]);

      setIncidents(incRes?.data || []);
      setAnomalies(anomRes?.data || []);
    } catch (err) {
      setError(err.message || 'Unable to fetch incident history.');
    } finally {
      setLoading(false);
    }
  };

  // Combine and unify into single timeline
  const unifiedItems = [];

  // Add Incidents
  for (const inc of incidents) {
    unifiedItems.push({
      id: `inc-${inc.id}`,
      originalId: inc.id,
      category: inc.type === 'SOS' ? 'SOS' : 'INCIDENT',
      referenceCode: inc.referenceCode || `INC-${inc.id.slice(-6).toUpperCase()}`,
      title: inc.type === 'SOS' ? 'Emergency SOS Broadcast' : inc.type,
      description: inc.description || 'Emergency incident logged.',
      severity: inc.severity || 'CRITICAL',
      status: inc.status || 'OPEN',
      latitude: inc.latitude,
      longitude: inc.longitude,
      touristName: inc.tourist?.fullName,
      createdAt: inc.createdAt,
    });
  }

  // Add Anomalies
  for (const anom of anomalies) {
    const isGeofence = anom.type === 'DANGER_ZONE_ENTRY';
    unifiedItems.push({
      id: `anom-${anom.id}`,
      originalId: anom.id,
      category: isGeofence ? 'GEOFENCE' : 'ANOMALY',
      referenceCode: `ALT-${anom.id.slice(-6).toUpperCase()}`,
      title: anom.type.replace(/_/g, ' '),
      description: anom.description,
      severity: anom.severity,
      status: anom.status,
      latitude: anom.latitude,
      longitude: anom.longitude,
      touristName: anom.tourist?.fullName,
      createdAt: anom.createdAt,
    });
  }

  // Sort by date newest first
  unifiedItems.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  // Apply Filter
  const filteredItems = unifiedItems.filter((item) => {
    if (filter === 'ALL') return true;
    if (filter === 'SOS') return item.category === 'SOS';
    if (filter === 'GEOFENCE') return item.category === 'GEOFENCE';
    if (filter === 'ANOMALY') return item.category === 'ANOMALY';
    return true;
  });

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <AppHeader
          title="Incident History"
          subtitle="Audit trail of SOS calls, geo-fences & alerts"
        />

        {/* Filter Pills */}
        <View style={styles.filterRow}>
          {['ALL', 'SOS', 'GEOFENCE', 'ANOMALY'].map((f) => {
            const isActive = filter === f;
            return (
              <Pressable
                key={f}
                style={[styles.filterPill, isActive && styles.filterPillActive]}
                onPress={() => setFilter(f)}
              >
                <Text
                  style={[
                    styles.filterText,
                    isActive && styles.filterTextActive,
                  ]}
                >
                  {f === 'GEOFENCE' ? 'Geo-fence' : f === 'ALL' ? 'All Events' : f}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Refresh Row */}
        <View style={styles.statusBar}>
          <Text style={styles.countText}>
            Showing {filteredItems.length} records
          </Text>
          <Pressable onPress={fetchHistory} disabled={loading}>
            <Text style={styles.refreshLink}>↻ Refresh</Text>
          </Pressable>
        </View>

        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={colors.secondary} />
            <Text style={styles.loadingText}>Loading incident records...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorTitle}>Connection Error</Text>
            <Text style={styles.errorDesc}>{error}</Text>
            <Pressable style={styles.retryButton} onPress={fetchHistory}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </Pressable>
          </View>
        ) : filteredItems.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🛡</Text>
            <Text style={styles.emptyTitle}>No Incidents Found</Text>
            <Text style={styles.emptySub}>
              No events match the selected category. When SOS is pressed or anomalies are detected, they appear here.
            </Text>
          </View>
        ) : (
          filteredItems.map((item) => {
            const isCritical = item.severity === 'CRITICAL';
            const isHigh = item.severity === 'HIGH';
            const isMedium = item.severity === 'MEDIUM';

            const sevColor = isCritical
              ? '#DC2626'
              : isHigh
              ? colors.danger
              : isMedium
              ? '#D97706'
              : colors.secondary;

            const sevBg = isCritical
              ? '#FEE2E2'
              : isHigh
              ? '#FEE2E2'
              : isMedium
              ? '#FEF3C7'
              : '#E6F4EA';

            const formattedTime = new Date(item.createdAt).toLocaleString([], {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <View key={item.id} style={styles.itemCard}>
                <View style={styles.cardHeader}>
                  <View style={styles.refRow}>
                    <Text style={styles.refCode}>{item.referenceCode}</Text>
                    <View style={styles.catBadge}>
                      <Text style={styles.catText}>{item.category}</Text>
                    </View>
                  </View>

                  <View style={[styles.sevBadge, { backgroundColor: sevBg }]}>
                    <Text style={[styles.sevText, { color: sevColor }]}>
                      {item.severity}
                    </Text>
                  </View>
                </View>

                <Text style={styles.itemTitle}>{item.title}</Text>
                <Text style={styles.itemDesc}>{item.description}</Text>

                <View style={styles.cardFooter}>
                  <View>
                    <Text style={styles.timeText}>{formattedTime}</Text>
                    {item.latitude && item.longitude && (
                      <Text style={styles.coordsText}>
                        Coords: [{item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}]
                      </Text>
                    )}
                  </View>

                  <View style={styles.statusBox}>
                    <Text style={styles.statusLabel}>STATUS:</Text>
                    <Text style={styles.statusValue}>{item.status}</Text>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 20,
    paddingTop: 48,
    paddingBottom: 40,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  filterPill: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  countText: {
    fontSize: 11,
    color: colors.muted,
  },
  refreshLink: {
    fontSize: 12,
    color: colors.secondary,
    fontWeight: '700',
  },
  centerContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 12,
    color: colors.muted,
  },
  errorBox: {
    backgroundColor: '#FEE2E2',
    padding: 16,
    borderRadius: 12,
    marginVertical: 20,
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#991B1B',
  },
  errorDesc: {
    fontSize: 11,
    color: '#B91C1C',
    marginTop: 4,
  },
  retryButton: {
    backgroundColor: '#DC2626',
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 10,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 11,
  },
  emptyContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 10,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primary,
  },
  emptySub: {
    fontSize: 12,
    color: colors.muted,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  itemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  refRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  refCode: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.5,
  },
  catBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  catText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#475569',
  },
  sevBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  sevText: {
    fontSize: 9,
    fontWeight: '800',
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
  },
  itemDesc: {
    fontSize: 12,
    color: '#475569',
    marginTop: 4,
    lineHeight: 17,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  timeText: {
    fontSize: 10,
    color: colors.muted,
  },
  coordsText: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
    fontFamily: 'monospace',
  },
  statusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusLabel: {
    fontSize: 9,
    color: colors.muted,
    fontWeight: '700',
  },
  statusValue: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primary,
  },
});
