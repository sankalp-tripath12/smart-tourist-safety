import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import colors from '../constants/colors';
import AppHeader from '../components/AppHeader';
import { getTourists, registerTourist } from '../services/api';

export default function TouristIDScreen() {
  const [tourists, setTourists] = useState([]);
  const [selectedTourist, setSelectedTourist] = useState(null);
  const [showRegForm, setShowRegForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [itinerary, setItinerary] = useState('');

  useEffect(() => {
    fetchTouristsList();
  }, []);

  const fetchTouristsList = async () => {
    setLoading(true);
    try {
      const res = await getTourists();
      if (res?.data && res.data.length > 0) {
        setTourists(res.data);
        setSelectedTourist(res.data[0]);
      }
    } catch (err) {
      console.log('Error fetching tourists:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!fullName.trim() || !phone.trim() || !emergencyName.trim() || !emergencyPhone.trim()) {
      Alert.alert('Missing Fields', 'Please fill in all required fields (Name, Phone, Emergency Contact).');
      return;
    }

    setSubmitting(true);
    try {
      const res = await registerTourist({
        fullName: fullName.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        emergencyContactName: emergencyName.trim(),
        emergencyContactPhone: emergencyPhone.trim(),
        itinerary: itinerary.trim() || undefined,
        visitExpiry: new Date(Date.now() + 60 * 24 * 3600 * 1000).toISOString(),
      });

      Alert.alert('Registration Successful', `Digital Tourist ID Created: ${res.data.touristCode}`);
      setShowRegForm(false);
      // Reset form
      setFullName('');
      setPhone('');
      setEmail('');
      setEmergencyName('');
      setEmergencyPhone('');
      setItinerary('');

      await fetchTouristsList();
    } catch (err) {
      Alert.alert('Registration Failed', err.message || 'Unable to register tourist.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <AppHeader
        title="Digital Tourist ID"
        subtitle="Verifiable travel credentials & registration"
      />

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.secondary} />
          <Text style={styles.loadingText}>Fetching digital ID records...</Text>
        </View>
      ) : selectedTourist ? (
        /* Digital ID Card */
        <View style={styles.badgeCard}>
          <View style={styles.cardTop}>
            <View>
              <Text style={styles.cardOrg}>REPUBLIC TOURIST SAFETY PASS</Text>
              <Text style={styles.cardHeader}>VERIFIED DIGITAL IDENTITY</Text>
            </View>
            <View style={styles.chipBox}>
              <Text style={styles.chipText}>SIMULATED ID</Text>
            </View>
          </View>

          <View style={styles.idCodeContainer}>
            <Text style={styles.idCodeLabel}>TOURIST CODE</Text>
            <Text style={styles.idCode}>{selectedTourist.touristCode}</Text>
          </View>

          <View style={styles.touristInfo}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>HOLDER NAME</Text>
              <Text style={styles.infoValue}>{selectedTourist.fullName}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>PRIMARY PHONE</Text>
              <Text style={styles.infoValue}>{selectedTourist.phone}</Text>
            </View>

            {selectedTourist.email && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>EMAIL</Text>
                <Text style={styles.infoValue}>{selectedTourist.email}</Text>
              </View>
            )}

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>EMERGENCY CONTACT</Text>
              <Text style={styles.infoValue}>
                {selectedTourist.emergencyContactName} ({selectedTourist.emergencyContactPhone})
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>SCHEDULED ITINERARY</Text>
              <Text style={styles.infoValue}>
                {selectedTourist.itinerary || 'Golden Triangle Corridor (Delhi-Jaipur-Agra)'}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>PASS EXPIRY</Text>
              <Text style={styles.infoValue}>
                {new Date(selectedTourist.visitExpiry).toLocaleDateString()}
              </Text>
            </View>
          </View>

          <View style={styles.cardFooter}>
            <Text style={styles.hashText}>
              Audit Hash: SHA256-{(selectedTourist.id || 'abc').slice(0, 16).toUpperCase()}
            </Text>
            <Text style={styles.validStatus}>● VERIFIED ACTIVE</Text>
          </View>
        </View>
      ) : (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyTitle}>No Tourist Identity Found</Text>
          <Text style={styles.emptyDesc}>Register below to generate your digital tourist safety pass.</Text>
        </View>
      )}

      {/* Switch / Register Buttons */}
      <View style={styles.actionsRow}>
        <Pressable
          style={[styles.actionBtn, styles.actionBtnSecondary]}
          onPress={() => setShowRegForm(!showRegForm)}
        >
          <Text style={styles.actionBtnSecondaryText}>
            {showRegForm ? 'Cancel Registration' : '+ Register New Tourist'}
          </Text>
        </Pressable>
      </View>

      {/* Registration Form */}
      {showRegForm && (
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>New Tourist Registration</Text>
          <Text style={styles.formSub}>Registers identity with backend SQLite database</Text>

          <Text style={styles.fieldLabel}>Full Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Diya Sharma"
            value={fullName}
            onChangeText={setFullName}
          />

          <Text style={styles.fieldLabel}>Mobile Phone *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 9876512345"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />

          <Text style={styles.fieldLabel}>Email Address</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. diya@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />

          <Text style={styles.fieldLabel}>Emergency Contact Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Rohan Sharma"
            value={emergencyName}
            onChangeText={setEmergencyName}
          />

          <Text style={styles.fieldLabel}>Emergency Contact Phone *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 9876599999"
            keyboardType="phone-pad"
            value={emergencyPhone}
            onChangeText={setEmergencyPhone}
          />

          <Text style={styles.fieldLabel}>Travel Itinerary Corridor</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Jaipur to Jodhpur"
            value={itinerary}
            onChangeText={setItinerary}
          />

          <Pressable
            style={styles.submitBtn}
            disabled={submitting}
            onPress={handleRegister}
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitBtnText}>Submit & Generate ID</Text>
            )}
          </Pressable>
        </View>
      )}

      {/* Existing Tourist Selector if multiple */}
      {tourists.length > 1 && (
        <View style={styles.selectorCard}>
          <Text style={styles.selectorTitle}>Select Active Tourist Record:</Text>
          {tourists.map((t) => (
            <Pressable
              key={t.id}
              style={[
                styles.touristItem,
                selectedTourist?.id === t.id && styles.touristItemActive,
              ]}
              onPress={() => setSelectedTourist(t)}
            >
              <Text style={styles.touristItemCode}>{t.touristCode}</Text>
              <Text style={styles.touristItemName}>{t.fullName}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </ScrollView>
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
  centerContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 12,
    color: colors.muted,
  },
  badgeCard: {
    backgroundColor: '#0F273D',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#264A6E',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    marginBottom: 20,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: '#264A6E',
    paddingBottom: 12,
  },
  cardOrg: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.5,
    color: '#63B3ED',
  },
  cardHeader: {
    fontSize: 13,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: 2,
  },
  chipBox: {
    backgroundColor: '#F6E05E',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  chipText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#744210',
  },
  idCodeContainer: {
    marginTop: 14,
    marginBottom: 10,
  },
  idCodeLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#90CDF4',
    letterSpacing: 1,
  },
  idCode: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1.5,
    marginTop: 2,
  },
  touristInfo: {
    gap: 8,
    marginVertical: 10,
  },
  infoRow: {
    flexDirection: 'column',
  },
  infoLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#A0AEC0',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#E2E8F0',
    marginTop: 2,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#264A6E',
    paddingTop: 12,
    marginTop: 8,
  },
  hashText: {
    fontSize: 9,
    color: '#718096',
    fontFamily: 'monospace',
  },
  validStatus: {
    fontSize: 10,
    fontWeight: '800',
    color: '#48BB78',
  },
  emptyBox: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.primary,
  },
  emptyDesc: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 4,
    textAlign: 'center',
  },
  actionsRow: {
    marginBottom: 16,
  },
  actionBtn: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  actionBtnSecondary: {
    backgroundColor: '#E6F3F1',
  },
  actionBtnSecondaryText: {
    color: colors.secondary,
    fontWeight: '800',
    fontSize: 13,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 20,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primary,
  },
  formSub: {
    fontSize: 11,
    color: colors.muted,
    marginTop: 2,
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
    marginTop: 8,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    color: colors.text,
  },
  submitBtn: {
    backgroundColor: colors.secondary,
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 18,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  selectorCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 20,
  },
  selectorTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
    marginBottom: 8,
  },
  touristItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  touristItemActive: {
    backgroundColor: '#F0FDF4',
  },
  touristItemCode: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.secondary,
  },
  touristItemName: {
    fontSize: 12,
    color: colors.text,
  },
});
