import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Linking,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../../src/constants/theme';
import { LoadingScreen } from '../../src/components/LoadingScreen';
import { Button } from '../../src/components/Button';

const API_URL = '';

interface Customer {
  id: string;
  phone: string;
  name: string;
  address?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  total_orders: number;
}

export default function AdminMapScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [newLat, setNewLat] = useState('');
  const [newLng, setNewLng] = useState('');

  const fetchCustomers = async () => {
    try {
      const response = await fetch(`${API_URL}/api/customers/locations`);
      if (response.ok) {
        const data = await response.json();
        setCustomers(data);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchCustomers();
  };

  const openInMap = (customer: Customer) => {
    if (customer.latitude && customer.longitude) {
      Linking.openURL(
        `https://www.openstreetmap.org/?mlat=${customer.latitude}&mlon=${customer.longitude}#map=17/${customer.latitude}/${customer.longitude}`
      );
    }
  };

  const openAllInMap = () => {
    if (customers.length === 0) return;
    
    // Open first customer location
    const first = customers[0];
    if (first.latitude && first.longitude) {
      Linking.openURL(
        `https://www.openstreetmap.org/?mlat=${first.latitude}&mlon=${first.longitude}#map=12/${first.latitude}/${first.longitude}`
      );
    }
  };

  const openEditLocation = (customer: Customer) => {
    setSelectedCustomer(customer);
    setNewLat(customer.latitude?.toString() || '');
    setNewLng(customer.longitude?.toString() || '');
    setShowEditModal(true);
  };

  const saveLocation = async () => {
    if (!selectedCustomer || !newLat || !newLng) {
      Alert.alert('خطأ', 'الرجاء إدخال الإحداثيات');
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/api/admin/users/${selectedCustomer.id}/location?latitude=${newLat}&longitude=${newLng}`,
        { method: 'PUT' }
      );

      if (response.ok) {
        setShowEditModal(false);
        fetchCustomers();
        Alert.alert('تم', 'تم تحديث الموقع بنجاح');
      } else {
        Alert.alert('خطأ', 'فشل تحديث الموقع');
      }
    } catch (error) {
      Alert.alert('خطأ', 'فشل الاتصال بالخادم');
    }
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>خريطة الزبناء</Text>
        <Text style={styles.subtitle}>{customers.length} زبون بموقع محدد</Text>
      </View>

      {customers.length > 0 && (
        <View style={styles.mapAction}>
          <Button
            title="عرض الكل على الخريطة"
            onPress={openAllInMap}
            icon={<Ionicons name="map" size={20} color={COLORS.white} />}
          />
        </View>
      )}

      <FlatList
        data={customers}
        renderItem={({ item }) => (
          <View style={styles.customerCard}>
            <TouchableOpacity style={styles.customerInfo} onPress={() => openInMap(item)}>
              <View style={styles.customerHeader}>
                <Text style={styles.customerName}>{item.name || 'زبون'}</Text>
                <View style={styles.ordersBadge}>
                  <Text style={styles.ordersText}>{item.total_orders} طلبية</Text>
                </View>
              </View>
              <Text style={styles.customerPhone}>{item.phone}</Text>
              {item.city && <Text style={styles.customerCity}>{item.city}</Text>}
              <View style={styles.coordsRow}>
                <Ionicons name="location" size={14} color={COLORS.primary} />
                <Text style={styles.coords}>
                  {item.latitude?.toFixed(4)}, {item.longitude?.toFixed(4)}
                </Text>
              </View>
            </TouchableOpacity>
            <View style={styles.actions}>
              <TouchableOpacity style={styles.actionButton} onPress={() => openInMap(item)}>
                <Ionicons name="navigate" size={20} color={COLORS.primary} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton} onPress={() => openEditLocation(item)}>
                <Ionicons name="create-outline" size={20} color={COLORS.secondary} />
              </TouchableOpacity>
            </View>
          </View>
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="map-outline" size={64} color={COLORS.textLight} />
            <Text style={styles.emptyTitle}>لا توجد مواقع محددة</Text>
            <Text style={styles.emptySubtitle}>الزبناء الذين حددوا مواقعهم سيظهرون هنا</Text>
          </View>
        }
      />

      {/* Edit Location Modal */}
      <Modal visible={showEditModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowEditModal(false)}>
              <Ionicons name="close" size={24} color={COLORS.text} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>تعديل الموقع</Text>
            <View style={{ width: 24 }} />
          </View>

          {selectedCustomer && (
            <View style={styles.modalContent}>
              <Text style={styles.modalCustomerName}>{selectedCustomer.name || 'زبون'}</Text>
              <Text style={styles.modalCustomerPhone}>{selectedCustomer.phone}</Text>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>خط العرض (Latitude)</Text>
                <TextInput
                  style={styles.input}
                  value={newLat}
                  onChangeText={setNewLat}
                  placeholder="33.5731"
                  keyboardType="decimal-pad"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>خط الطول (Longitude)</Text>
                <TextInput
                  style={styles.input}
                  value={newLng}
                  onChangeText={setNewLng}
                  placeholder="-7.5898"
                  keyboardType="decimal-pad"
                />
              </View>

              <Button
                title="حفظ الموقع"
                onPress={saveLocation}
                size="large"
                style={{ marginTop: SIZES.lg }}
              />
            </View>
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    padding: SIZES.md,
  },
  title: {
    fontSize: SIZES.fontXxl,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: SIZES.fontMd,
    color: COLORS.textSecondary,
  },
  mapAction: {
    paddingHorizontal: SIZES.md,
    marginBottom: SIZES.md,
  },
  list: {
    padding: SIZES.md,
  },
  customerCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radiusMd,
    padding: SIZES.md,
    marginBottom: SIZES.sm,
    ...SHADOWS.small,
  },
  customerInfo: {
    flex: 1,
  },
  customerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  customerName: {
    fontSize: SIZES.fontMd,
    fontWeight: '600',
    color: COLORS.text,
  },
  ordersBadge: {
    backgroundColor: COLORS.primary + '20',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: SIZES.radiusFull,
  },
  ordersText: {
    fontSize: SIZES.fontXs,
    color: COLORS.primary,
    fontWeight: '600',
  },
  customerPhone: {
    fontSize: SIZES.fontSm,
    color: COLORS.textSecondary,
    textAlign: 'right',
  },
  customerCity: {
    fontSize: SIZES.fontSm,
    color: COLORS.textSecondary,
    textAlign: 'right',
  },
  coordsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: SIZES.xs,
  },
  coords: {
    fontSize: SIZES.fontXs,
    color: COLORS.primary,
  },
  actions: {
    justifyContent: 'center',
    gap: SIZES.sm,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    padding: SIZES.xxl,
  },
  emptyTitle: {
    fontSize: SIZES.fontLg,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: SIZES.md,
  },
  emptySubtitle: {
    fontSize: SIZES.fontMd,
    color: COLORS.textSecondary,
    marginTop: SIZES.xs,
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SIZES.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: SIZES.fontLg,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  modalContent: {
    padding: SIZES.lg,
  },
  modalCustomerName: {
    fontSize: SIZES.fontXl,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
  },
  modalCustomerPhone: {
    fontSize: SIZES.fontMd,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SIZES.lg,
  },
  inputContainer: {
    marginBottom: SIZES.md,
  },
  inputLabel: {
    fontSize: SIZES.fontMd,
    color: COLORS.text,
    marginBottom: SIZES.xs,
    textAlign: 'right',
  },
  input: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radiusMd,
    padding: SIZES.md,
    fontSize: SIZES.fontMd,
    borderWidth: 1,
    borderColor: COLORS.border,
    textAlign: 'right',
  },
});
