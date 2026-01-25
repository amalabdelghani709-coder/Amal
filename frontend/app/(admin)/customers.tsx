import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Linking,
  Alert,
  Modal,
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
  points: number;
  is_approved: boolean;
  created_at: string;
}

export default function AdminCustomersScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [pendingCustomers, setPendingCustomers] = useState<Customer[]>([]);
  const [sortBy, setSortBy] = useState<'created_at' | 'orders'>('orders');
  const [showPending, setShowPending] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showModal, setShowModal] = useState(false);

  const fetchCustomers = useCallback(async () => {
    try {
      const [customersRes, pendingRes] = await Promise.all([
        fetch(`${API_URL}/api/admin/users?role=customer&sort_by=${sortBy}`),
        fetch(`${API_URL}/api/admin/users/pending`),
      ]);

      if (customersRes.ok) {
        const data = await customersRes.json();
        // Filter only approved customers
        setCustomers(data.filter((c: Customer) => c.is_approved));
      }

      if (pendingRes.ok) {
        setPendingCustomers(await pendingRes.json());
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [sortBy]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchCustomers();
  };

  const openWhatsApp = (phone: string, message?: string) => {
    const url = message 
      ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
      : `https://wa.me/${phone}`;
    Linking.openURL(url);
  };

  const openMap = (lat?: number, lng?: number) => {
    if (lat && lng) {
      Linking.openURL(`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=17/${lat}/${lng}`);
    }
  };

  const approveCustomer = async (customerId: string) => {
    try {
      const response = await fetch(`${API_URL}/api/admin/users/${customerId}/approve`, {
        method: 'PUT',
      });

      if (response.ok) {
        Alert.alert('تم', 'تم تفعيل الحساب بنجاح');
        fetchCustomers();
      }
    } catch (error) {
      Alert.alert('خطأ', 'فشل تفعيل الحساب');
    }
  };

  const rejectCustomer = async (customerId: string) => {
    Alert.alert(
      'تأكيد الرفض',
      'هل أنت متأكد من رفض هذا الحساب؟ سيتم حذفه نهائياً.',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'رفض',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch(`${API_URL}/api/admin/users/${customerId}/reject`, {
                method: 'PUT',
              });

              if (response.ok) {
                Alert.alert('تم', 'تم رفض وحذف الحساب');
                fetchCustomers();
              }
            } catch (error) {
              Alert.alert('خطأ', 'فشل رفض الحساب');
            }
          },
        },
      ]
    );
  };

  const notifyApproval = (phone: string) => {
    openWhatsApp(phone, 'مرحباً! تم تفعيل حسابك في دار البقال. يمكنك الآن التسوق والطلب. نتمنى لك تجربة ممتعة! 🛒');
  };

  const renderPendingCustomer = ({ item }: { item: Customer }) => (
    <View style={styles.pendingCard}>
      <View style={styles.pendingHeader}>
        <View style={styles.pendingBadge}>
          <Ionicons name="time" size={16} color={COLORS.warning} />
          <Text style={styles.pendingBadgeText}>في الانتظار</Text>
        </View>
        <Text style={styles.pendingDate}>
          {new Date(item.created_at).toLocaleDateString('ar-MA')}
        </Text>
      </View>
      
      <View style={styles.pendingInfo}>
        <Text style={styles.pendingName}>{item.name || 'بدون اسم'}</Text>
        <Text style={styles.pendingPhone}>{item.phone}</Text>
        {item.latitude && item.longitude && (
          <TouchableOpacity 
            style={styles.locationRow}
            onPress={() => openMap(item.latitude, item.longitude)}
          >
            <Ionicons name="location" size={16} color={COLORS.primary} />
            <Text style={styles.locationText}>عرض الموقع</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.pendingActions}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.approveBtn]}
          onPress={() => {
            approveCustomer(item.id);
            // Send WhatsApp notification after approval
            setTimeout(() => notifyApproval(item.phone), 500);
          }}
        >
          <Ionicons name="checkmark" size={20} color={COLORS.white} />
          <Text style={styles.actionBtnText}>قبول</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionBtn, styles.rejectBtn]}
          onPress={() => rejectCustomer(item.id)}
        >
          <Ionicons name="close" size={20} color={COLORS.white} />
          <Text style={styles.actionBtnText}>رفض</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderCustomer = ({ item, index }: { item: Customer; index: number }) => (
    <TouchableOpacity 
      style={styles.customerCard}
      onPress={() => {
        setSelectedCustomer(item);
        setShowModal(true);
      }}
    >
      <View style={styles.rankBadge}>
        <Text style={styles.rankText}>{index + 1}</Text>
      </View>
      
      <View style={styles.customerInfo}>
        <Text style={styles.customerName}>{item.name || 'زبون'}</Text>
        <Text style={styles.customerPhone}>{item.phone}</Text>
        {item.city && <Text style={styles.customerCity}>{item.city}</Text>}
      </View>
      
      <View style={styles.customerStats}>
        <View style={styles.statBadge}>
          <Ionicons name="cart" size={14} color={COLORS.primary} />
          <Text style={styles.statText}>{item.total_orders}</Text>
        </View>
        <View style={[styles.statBadge, { backgroundColor: COLORS.accent + '20' }]}>
          <Ionicons name="star" size={14} color={COLORS.accent} />
          <Text style={[styles.statText, { color: COLORS.accent }]}>{item.points}</Text>
        </View>
      </View>
      
      <TouchableOpacity style={styles.whatsappButton} onPress={() => openWhatsApp(item.phone)}>
        <Ionicons name="logo-whatsapp" size={24} color="#25D366" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>الزبناء</Text>
        <Text style={styles.subtitle}>{customers.length} زبون مفعّل</Text>
      </View>

      {/* Pending Alert */}
      {pendingCustomers.length > 0 && (
        <TouchableOpacity 
          style={styles.pendingAlert}
          onPress={() => setShowPending(true)}
        >
          <View style={styles.pendingAlertContent}>
            <View style={styles.pendingAlertIcon}>
              <Ionicons name="notifications" size={24} color={COLORS.warning} />
            </View>
            <View style={styles.pendingAlertText}>
              <Text style={styles.pendingAlertTitle}>طلبات تفعيل جديدة</Text>
              <Text style={styles.pendingAlertSubtitle}>
                {pendingCustomers.length} زبون في انتظار الموافقة
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-back" size={24} color={COLORS.textSecondary} />
        </TouchableOpacity>
      )}

      {/* Sort Options */}
      <View style={styles.sortRow}>
        <TouchableOpacity
          style={[styles.sortButton, sortBy === 'orders' && styles.sortButtonActive]}
          onPress={() => setSortBy('orders')}
        >
          <Text style={[styles.sortText, sortBy === 'orders' && styles.sortTextActive]}>
            بعدد الطلبيات
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.sortButton, sortBy === 'created_at' && styles.sortButtonActive]}
          onPress={() => setSortBy('created_at')}
        >
          <Text style={[styles.sortText, sortBy === 'created_at' && styles.sortTextActive]}>
            بتاريخ التسجيل
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={customers}
        renderItem={renderCustomer}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={64} color={COLORS.textLight} />
            <Text style={styles.emptyTitle}>لا يوجد زبناء</Text>
          </View>
        }
      />

      {/* Pending Customers Modal */}
      <Modal visible={showPending} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowPending(false)}>
              <Ionicons name="close" size={24} color={COLORS.text} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>طلبات التفعيل ({pendingCustomers.length})</Text>
            <View style={{ width: 24 }} />
          </View>

          <FlatList
            data={pendingCustomers}
            renderItem={renderPendingCustomer}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="checkmark-circle-outline" size={64} color={COLORS.success} />
                <Text style={styles.emptyTitle}>لا توجد طلبات معلقة</Text>
              </View>
            }
          />
        </SafeAreaView>
      </Modal>

      {/* Customer Details Modal */}
      <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowModal(false)}>
              <Ionicons name="close" size={24} color={COLORS.text} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>تفاصيل الزبون</Text>
            <View style={{ width: 24 }} />
          </View>

          {selectedCustomer && (
            <View style={styles.modalContent}>
              <View style={styles.detailCard}>
                <Text style={styles.detailName}>{selectedCustomer.name || 'زبون'}</Text>
                <Text style={styles.detailPhone}>{selectedCustomer.phone}</Text>
              </View>

              <View style={styles.statsCard}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{selectedCustomer.total_orders}</Text>
                  <Text style={styles.statLabel}>طلبيات</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{selectedCustomer.points}</Text>
                  <Text style={styles.statLabel}>نقاط</Text>
                </View>
              </View>

              {selectedCustomer.latitude && selectedCustomer.longitude && (
                <TouchableOpacity
                  style={styles.mapButton}
                  onPress={() => openMap(selectedCustomer.latitude, selectedCustomer.longitude)}
                >
                  <Ionicons name="location" size={24} color={COLORS.primary} />
                  <Text style={styles.mapButtonText}>عرض الموقع على الخريطة</Text>
                  <Ionicons name="navigate" size={20} color={COLORS.primary} />
                </TouchableOpacity>
              )}

              <Button
                title="تواصل عبر واتساب"
                onPress={() => openWhatsApp(selectedCustomer.phone)}
                icon="logo-whatsapp"
                style={{ marginTop: SIZES.md, backgroundColor: '#25D366' }}
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
  pendingAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.warning + '15',
    marginHorizontal: SIZES.md,
    marginBottom: SIZES.md,
    padding: SIZES.md,
    borderRadius: SIZES.radiusMd,
    borderWidth: 1,
    borderColor: COLORS.warning + '30',
  },
  pendingAlertContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  pendingAlertIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.warning + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.sm,
  },
  pendingAlertText: {
    flex: 1,
  },
  pendingAlertTitle: {
    fontSize: SIZES.fontMd,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  pendingAlertSubtitle: {
    fontSize: SIZES.fontSm,
    color: COLORS.textSecondary,
  },
  sortRow: {
    flexDirection: 'row',
    paddingHorizontal: SIZES.md,
    marginBottom: SIZES.sm,
    gap: SIZES.sm,
  },
  sortButton: {
    paddingVertical: SIZES.sm,
    paddingHorizontal: SIZES.md,
    borderRadius: SIZES.radiusFull,
    backgroundColor: COLORS.surface,
  },
  sortButtonActive: {
    backgroundColor: COLORS.primary,
  },
  sortText: {
    fontSize: SIZES.fontSm,
    color: COLORS.textSecondary,
  },
  sortTextActive: {
    color: COLORS.white,
    fontWeight: '600',
  },
  list: {
    padding: SIZES.md,
  },
  customerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radiusMd,
    padding: SIZES.md,
    marginBottom: SIZES.sm,
    ...SHADOWS.small,
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.sm,
  },
  rankText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: SIZES.fontSm,
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: SIZES.fontMd,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'right',
  },
  customerPhone: {
    fontSize: SIZES.fontSm,
    color: COLORS.textSecondary,
    textAlign: 'right',
  },
  customerCity: {
    fontSize: SIZES.fontXs,
    color: COLORS.textLight,
    textAlign: 'right',
  },
  customerStats: {
    flexDirection: 'row',
    gap: SIZES.xs,
    marginRight: SIZES.sm,
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary + '20',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: SIZES.radiusFull,
    gap: 4,
  },
  statText: {
    fontSize: SIZES.fontXs,
    fontWeight: '600',
    color: COLORS.primary,
  },
  whatsappButton: {
    padding: SIZES.sm,
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
  // Modal styles
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
  // Pending customer styles
  pendingCard: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radiusMd,
    padding: SIZES.md,
    marginBottom: SIZES.md,
    ...SHADOWS.small,
  },
  pendingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.sm,
  },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.warning + '20',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: SIZES.radiusFull,
    gap: 4,
  },
  pendingBadgeText: {
    fontSize: SIZES.fontXs,
    color: COLORS.warning,
    fontWeight: '600',
  },
  pendingDate: {
    fontSize: SIZES.fontXs,
    color: COLORS.textSecondary,
  },
  pendingInfo: {
    marginBottom: SIZES.md,
  },
  pendingName: {
    fontSize: SIZES.fontLg,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'right',
  },
  pendingPhone: {
    fontSize: SIZES.fontMd,
    color: COLORS.textSecondary,
    textAlign: 'right',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SIZES.sm,
    gap: SIZES.xs,
  },
  locationText: {
    fontSize: SIZES.fontSm,
    color: COLORS.primary,
  },
  pendingActions: {
    flexDirection: 'row',
    gap: SIZES.sm,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SIZES.sm,
    borderRadius: SIZES.radiusMd,
    gap: SIZES.xs,
  },
  approveBtn: {
    backgroundColor: COLORS.success,
  },
  rejectBtn: {
    backgroundColor: COLORS.error,
  },
  actionBtnText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: SIZES.fontMd,
  },
  // Detail modal styles
  detailCard: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radiusMd,
    padding: SIZES.lg,
    alignItems: 'center',
    marginBottom: SIZES.md,
  },
  detailName: {
    fontSize: SIZES.fontXxl,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SIZES.xs,
  },
  detailPhone: {
    fontSize: SIZES.fontLg,
    color: COLORS.textSecondary,
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radiusMd,
    padding: SIZES.lg,
    marginBottom: SIZES.md,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: COLORS.border,
    marginHorizontal: SIZES.md,
  },
  statValue: {
    fontSize: SIZES.fontXxl,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: SIZES.fontSm,
    color: COLORS.textSecondary,
    marginTop: SIZES.xs,
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary + '10',
    borderRadius: SIZES.radiusMd,
    padding: SIZES.md,
    gap: SIZES.sm,
  },
  mapButtonText: {
    flex: 1,
    fontSize: SIZES.fontMd,
    color: COLORS.primary,
    fontWeight: '600',
  },
});
