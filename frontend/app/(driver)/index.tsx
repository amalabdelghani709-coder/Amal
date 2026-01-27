import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Modal,
  ScrollView,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS, SIZES, SHADOWS } from '../../src/constants/theme';
import { useAuthStore } from '../../src/store/authStore';
import { OrderCard } from '../../src/components/OrderCard';
import { LoadingScreen } from '../../src/components/LoadingScreen';
import { Button } from '../../src/components/Button';
import { Input } from '../../src/components/Input';
import { ORDER_STATUS, getStatusInfo } from '../../src/constants/orderStatus';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

interface Order {
  id: string;
  customer_name: string;
  customer_phone: string;
  items: Array<{ product_name: string; quantity: number; price: number; total: number }>;
  total: number;
  subtotal: number;
  delivery_fee: number;
  status: string;
  created_at: string;
  delivery_address?: string;
  delivery_latitude?: number;
  delivery_longitude?: number;
}

export default function DriverOrdersScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modificationReason, setModificationReason] = useState('');

  const fetchOrders = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/orders/today`);
      if (response.ok) {
        const data = await response.json();
        setOrders(data);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const response = await fetch(`${API_URL}/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        fetchOrders();
        setShowModal(false);
        Alert.alert('تم', 'تم تحديث حالة الطلبية');
      }
    } catch (error) {
      Alert.alert('خطأ', 'فشل تحديث الحالة');
    }
  };

  const saveModification = async () => {
    if (!selectedOrder || !modificationReason) {
      Alert.alert('خطأ', 'الرجاء إدخال سبب التعديل');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/orders/${selectedOrder.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modification_reason: modificationReason }),
      });

      if (response.ok) {
        fetchOrders();
        setModificationReason('');
        Alert.alert('تم', 'تم حفظ التعديل');
      }
    } catch (error) {
      Alert.alert('خطأ', 'فشل حفظ التعديل');
    }
  };

  const openOrderDetails = (order: Order) => {
    setSelectedOrder(order);
    setShowModal(true);
  };

  const openWhatsApp = (phone: string, message: string) => {
    Linking.openURL(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`);
  };

  const openMap = (lat?: number, lng?: number, address?: string) => {
    if (lat && lng) {
      Linking.openURL(`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=17/${lat}/${lng}`);
    } else if (address) {
      Linking.openURL(`https://www.openstreetmap.org/search?query=${encodeURIComponent(address)}`);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('Logout error:', error);
      router.replace('/(auth)/login');
    }
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  const readyOrders = orders.filter(o => o.status === 'ready');
  const deliveringOrders = orders.filter(o => o.status === 'delivering');
  const otherOrders = orders.filter(o => !['ready', 'delivering', 'delivered'].includes(o.status));

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>مرحباً</Text>
          <Text style={styles.userName}>{user?.name || 'السائق'}</Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color={COLORS.error} />
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: COLORS.success + '20' }]}>
          <Text style={[styles.statValue, { color: COLORS.success }]}>{readyOrders.length}</Text>
          <Text style={styles.statLabel}>جاهزة</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: COLORS.warning + '20' }]}>
          <Text style={[styles.statValue, { color: COLORS.warning }]}>{deliveringOrders.length}</Text>
          <Text style={styles.statLabel}>قيد التوصيل</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: COLORS.primary + '20' }]}>
          <Text style={[styles.statValue, { color: COLORS.primary }]}>{orders.length}</Text>
          <Text style={styles.statLabel}>الإجمالي</Text>
        </View>
      </View>

      <FlatList
        data={[...readyOrders, ...deliveringOrders, ...otherOrders]}
        renderItem={({ item }) => (
          <OrderCard order={item} onPress={() => openOrderDetails(item)} showCustomer />
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="car-outline" size={64} color={COLORS.textLight} />
            <Text style={styles.emptyTitle}>لا توجد طلبيات اليوم</Text>
          </View>
        }
      />

      {/* Order Details Modal */}
      <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowModal(false)}>
              <Ionicons name="close" size={24} color={COLORS.text} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>تفاصيل الطلبية</Text>
            <View style={{ width: 24 }} />
          </View>

          {selectedOrder && (
            <ScrollView style={styles.modalContent}>
              {/* Customer Info */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>معلومات الزبون</Text>
                <View style={styles.infoCard}>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoText}>{selectedOrder.customer_name || 'غير محدد'}</Text>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => openWhatsApp(selectedOrder.customer_phone, `مرحباً، أنا سائق دار البقال. طلبيتك رقم #${selectedOrder.id.slice(-6)} في الطريق إليك.`)}
                    >
                      <Ionicons name="logo-whatsapp" size={20} color="#25D366" />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.phoneText}>{selectedOrder.customer_phone}</Text>
                  {selectedOrder.delivery_address && (
                    <TouchableOpacity
                      style={styles.addressRow}
                      onPress={() => openMap(selectedOrder.delivery_latitude, selectedOrder.delivery_longitude, selectedOrder.delivery_address)}
                    >
                      <Ionicons name="location" size={20} color={COLORS.primary} />
                      <Text style={styles.addressText}>{selectedOrder.delivery_address}</Text>
                      <Ionicons name="navigate" size={16} color={COLORS.primary} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {/* Order Items */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>المنتجات ({selectedOrder.items.length})</Text>
                <View style={styles.infoCard}>
                  {selectedOrder.items.map((item, index) => (
                    <View key={index} style={styles.itemRow}>
                      <Text style={styles.itemName}>
                        {item.quantity}x {item.product_name}
                      </Text>
                      <Text style={styles.itemTotal}>{item.total.toFixed(2)} درهم</Text>
                    </View>
                  ))}
                  <View style={[styles.totalRow, styles.grandTotal]}>
                    <Text style={styles.grandTotalLabel}>الإجمالي</Text>
                    <Text style={styles.grandTotalValue}>{selectedOrder.total.toFixed(2)} درهم</Text>
                  </View>
                </View>
              </View>

              {/* Modification */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>تعديل الطلبية</Text>
                <Input
                  label="سبب التعديل"
                  value={modificationReason}
                  onChangeText={setModificationReason}
                  placeholder="أدخل سبب التعديل"
                  multiline
                  numberOfLines={2}
                />
                <Button
                  title="حفظ التعديل"
                  onPress={saveModification}
                  variant="outline"
                  size="small"
                />
              </View>

              {/* Status Update */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>تغيير الحالة</Text>
                <View style={styles.statusButtons}>
                  {selectedOrder.status === 'ready' && (
                    <Button
                      title="بدء التوصيل"
                      onPress={() => updateOrderStatus(selectedOrder.id, 'delivering')}
                      style={{ flex: 1 }}
                    />
                  )}
                  {selectedOrder.status === 'delivering' && (
                    <Button
                      title="تم التوصيل"
                      onPress={() => updateOrderStatus(selectedOrder.id, 'delivered')}
                      style={{ flex: 1 }}
                    />
                  )}
                </View>
              </View>
            </ScrollView>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SIZES.md,
  },
  greeting: {
    fontSize: SIZES.fontMd,
    color: COLORS.textSecondary,
  },
  userName: {
    fontSize: SIZES.fontXl,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  logoutButton: {
    padding: SIZES.sm,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: SIZES.md,
    gap: SIZES.sm,
    marginBottom: SIZES.md,
  },
  statCard: {
    flex: 1,
    padding: SIZES.md,
    borderRadius: SIZES.radiusMd,
    alignItems: 'center',
  },
  statValue: {
    fontSize: SIZES.fontXxl,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: SIZES.fontSm,
    color: COLORS.textSecondary,
  },
  list: {
    padding: SIZES.md,
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
    padding: SIZES.md,
  },
  section: {
    marginBottom: SIZES.lg,
  },
  sectionTitle: {
    fontSize: SIZES.fontLg,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SIZES.sm,
  },
  infoCard: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radiusMd,
    padding: SIZES.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoText: {
    fontSize: SIZES.fontMd,
    fontWeight: '600',
    color: COLORS.text,
  },
  phoneText: {
    fontSize: SIZES.fontSm,
    color: COLORS.textSecondary,
    marginTop: SIZES.xs,
  },
  actionButton: {
    padding: SIZES.sm,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.sm,
    marginTop: SIZES.sm,
    padding: SIZES.sm,
    backgroundColor: COLORS.primary + '10',
    borderRadius: SIZES.radiusSm,
  },
  addressText: {
    flex: 1,
    fontSize: SIZES.fontSm,
    color: COLORS.text,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SIZES.xs,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  itemName: {
    fontSize: SIZES.fontMd,
    color: COLORS.text,
    flex: 1,
  },
  itemTotal: {
    fontSize: SIZES.fontMd,
    color: COLORS.text,
    fontWeight: '500',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SIZES.xs,
  },
  grandTotal: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    marginTop: SIZES.sm,
    paddingTop: SIZES.sm,
  },
  grandTotalLabel: {
    fontSize: SIZES.fontLg,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  grandTotalValue: {
    fontSize: SIZES.fontLg,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  statusButtons: {
    flexDirection: 'row',
    gap: SIZES.sm,
  },
});
