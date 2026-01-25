import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../../src/constants/theme';
import { LoadingScreen } from '../../src/components/LoadingScreen';
import { Button } from '../../src/components/Button';
import { Input } from '../../src/components/Input';
import QRCode from 'react-native-qrcode-svg';

const API_URL = '';

interface Customer {
  id: string;
  phone: string;
  name: string;
  points: number;
  total_orders: number;
}

export default function DriverGiftScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [giftAmount, setGiftAmount] = useState('');
  const [generatedCode, setGeneratedCode] = useState<{ code: string; amount: number } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await fetch(`${API_URL}/api/admin/users?role=customer`);
      if (response.ok) {
        const data = await response.json();
        // Filter customers with points and 3+ orders
        const eligible = data.filter((c: Customer) => c.total_orders >= 3 && c.points > 0);
        setCustomers(eligible);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const openGiftModal = (customer: Customer) => {
    setSelectedCustomer(customer);
    setGiftAmount(customer.points.toString());
    setGeneratedCode(null);
    setShowModal(true);
  };

  const generateGiftCode = async () => {
    if (!selectedCustomer || !giftAmount) return;

    const amount = parseInt(giftAmount);
    if (amount <= 0 || amount > selectedCustomer.points) {
      Alert.alert('خطأ', 'القيمة غير صحيحة');
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch(
        `${API_URL}/api/gift/generate?user_id=${selectedCustomer.id}&amount=${amount}`,
        { method: 'POST' }
      );

      if (response.ok) {
        const data = await response.json();
        setGeneratedCode(data);
        fetchCustomers(); // Refresh to update points
      } else {
        const error = await response.json();
        Alert.alert('خطأ', error.detail || 'فشل توليد الكود');
      }
    } catch (error) {
      Alert.alert('خطأ', 'فشل الاتصال بالخادم');
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>خصم الهدية</Text>
        <Text style={styles.subtitle}>توليد كود QR للزبون</Text>
      </View>

      <FlatList
        data={customers}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.customerCard}
            onPress={() => openGiftModal(item)}
          >
            <View style={styles.customerInfo}>
              <Text style={styles.customerName}>{item.name || 'زبون'}</Text>
              <Text style={styles.customerPhone}>{item.phone}</Text>
            </View>
            <View style={styles.pointsBadge}>
              <Ionicons name="gift" size={16} color={COLORS.accent} />
              <Text style={styles.pointsText}>{item.points}</Text>
            </View>
          </TouchableOpacity>
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="gift-outline" size={64} color={COLORS.textLight} />
            <Text style={styles.emptyTitle}>لا يوجد زبناء مؤهلون</Text>
            <Text style={styles.emptySubtitle}>الزبناء الذين لديهم نقاط سيظهرون هنا</Text>
          </View>
        }
      />

      {/* Gift Modal */}
      <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowModal(false)}>
              <Ionicons name="close" size={24} color={COLORS.text} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>توليد كود الهدية</Text>
            <View style={{ width: 24 }} />
          </View>

          {selectedCustomer && (
            <View style={styles.modalContent}>
              {!generatedCode ? (
                <>
                  <View style={styles.customerHeader}>
                    <Text style={styles.modalCustomerName}>
                      {selectedCustomer.name || 'زبون'}
                    </Text>
                    <Text style={styles.modalCustomerPhone}>
                      {selectedCustomer.phone}
                    </Text>
                    <View style={styles.availablePoints}>
                      <Text style={styles.availableLabel}>النقاط المتاحة:</Text>
                      <Text style={styles.availableValue}>{selectedCustomer.points}</Text>
                    </View>
                  </View>

                  <Input
                    label="قيمة الهدية (نقاط)"
                    value={giftAmount}
                    onChangeText={setGiftAmount}
                    placeholder="أدخل عدد النقاط"
                    keyboardType="numeric"
                    icon="gift-outline"
                  />

                  <Text style={styles.euroValue}>
                    القيمة باليورو: {((parseInt(giftAmount) || 0) / 100).toFixed(2)} درهم
                  </Text>

                  <Button
                    title="توليد الكود"
                    onPress={generateGiftCode}
                    loading={isGenerating}
                    size="large"
                    style={{ marginTop: SIZES.lg }}
                  />
                </>
              ) : (
                <View style={styles.qrContainer}>
                  <Text style={styles.qrTitle}>كود الهدية</Text>
                  
                  <View style={styles.qrWrapper}>
                    <QRCode
                      value={JSON.stringify({
                        code: generatedCode.code,
                        amount: generatedCode.amount,
                        type: 'gift',
                      })}
                      size={200}
                      color={COLORS.text}
                      backgroundColor={COLORS.white}
                    />
                  </View>

                  <View style={styles.codeBox}>
                    <Text style={styles.codeLabel}>الكود:</Text>
                    <Text style={styles.codeValue}>{generatedCode.code}</Text>
                  </View>

                  <View style={styles.amountBox}>
                    <Text style={styles.amountLabel}>القيمة:</Text>
                    <Text style={styles.amountValue}>
                      {generatedCode.amount} نقطة = {(generatedCode.amount / 100).toFixed(2)} درهم
                    </Text>
                  </View>

                  <Button
                    title="إغلاق"
                    onPress={() => setShowModal(false)}
                    variant="outline"
                    style={{ marginTop: SIZES.lg }}
                  />
                </View>
              )}
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
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.accent + '20',
    paddingVertical: SIZES.sm,
    paddingHorizontal: SIZES.md,
    borderRadius: SIZES.radiusFull,
    gap: SIZES.xs,
  },
  pointsText: {
    fontSize: SIZES.fontMd,
    fontWeight: 'bold',
    color: COLORS.accent,
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
  customerHeader: {
    alignItems: 'center',
    marginBottom: SIZES.lg,
  },
  modalCustomerName: {
    fontSize: SIZES.fontXl,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  modalCustomerPhone: {
    fontSize: SIZES.fontMd,
    color: COLORS.textSecondary,
  },
  availablePoints: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.sm,
    marginTop: SIZES.md,
    backgroundColor: COLORS.accent + '20',
    padding: SIZES.md,
    borderRadius: SIZES.radiusMd,
  },
  availableLabel: {
    fontSize: SIZES.fontMd,
    color: COLORS.text,
  },
  availableValue: {
    fontSize: SIZES.fontXl,
    fontWeight: 'bold',
    color: COLORS.accent,
  },
  euroValue: {
    fontSize: SIZES.fontMd,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SIZES.sm,
  },
  qrContainer: {
    alignItems: 'center',
  },
  qrTitle: {
    fontSize: SIZES.fontXl,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SIZES.lg,
  },
  qrWrapper: {
    padding: SIZES.lg,
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusLg,
    ...SHADOWS.medium,
  },
  codeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.sm,
    marginTop: SIZES.lg,
  },
  codeLabel: {
    fontSize: SIZES.fontMd,
    color: COLORS.textSecondary,
  },
  codeValue: {
    fontSize: SIZES.fontXl,
    fontWeight: 'bold',
    color: COLORS.primary,
    letterSpacing: 2,
  },
  amountBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.sm,
    marginTop: SIZES.sm,
  },
  amountLabel: {
    fontSize: SIZES.fontMd,
    color: COLORS.textSecondary,
  },
  amountValue: {
    fontSize: SIZES.fontLg,
    fontWeight: '600',
    color: COLORS.success,
  },
});
