import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS, SIZES, SHADOWS } from '../../src/constants/theme';
import { useAuthStore } from '../../src/store/authStore';
import { Input } from '../../src/components/Input';
import { Button } from '../../src/components/Button';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

export default function AdminMoreScreen() {
  const router = useRouter();
  const { logout } = useAuthStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createRole, setCreateRole] = useState<'driver' | 'collector'>('driver');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.dismissAll();
    router.replace('/(auth)/login');
  };

  const openCreateModal = (role: 'driver' | 'collector') => {
    setCreateRole(role);
    setPhone('');
    setName('');
    setShowCreateModal(true);
  };

  const createAccount = async () => {
    if (!phone || !name) {
      Alert.alert('خطأ', 'الرجاء إدخال جميع البيانات');
      return;
    }

    setIsCreating(true);
    try {
      const response = await fetch(`${API_URL}/api/admin/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, name, role: createRole }),
      });

      if (response.ok) {
        Alert.alert(
          'تم',
          createRole === 'driver' 
            ? 'تم إنشاء حساب السائق بنجاح'
            : 'تم إنشاء حساب مُجمّع الطلبيات بنجاح'
        );
        setShowCreateModal(false);
      } else {
        Alert.alert('خطأ', 'فشل إنشاء الحساب');
      }
    } catch (error) {
      Alert.alert('خطأ', 'حدث خطأ أثناء إنشاء الحساب');
    } finally {
      setIsCreating(false);
    }
  };

  const menuItems = [
    {
      title: 'الإعدادات',
      icon: 'settings-outline',
      color: COLORS.textSecondary,
      onPress: () => router.push('/(admin)/settings'),
    },
    {
      title: 'خريطة الزبناء',
      icon: 'map-outline',
      color: COLORS.info,
      onPress: () => router.push('/(admin)/map'),
    },
    {
      title: 'إدارة التخفيضات',
      icon: 'pricetags-outline',
      color: COLORS.error,
      onPress: () => router.push('/(admin)/discounts'),
    },
    {
      title: 'واجهة التطبيق',
      icon: 'images-outline',
      color: COLORS.primary,
      onPress: () => router.push('/(admin)/interface'),
    },
    {
      title: 'المنتجات الأكثر مبيعاً',
      icon: 'trending-up-outline',
      color: COLORS.success,
      onPress: () => router.push('/(admin)/topselling'),
    },
    {
      title: 'إدارة نظام النقاط',
      icon: 'gift-outline',
      color: COLORS.accent,
      onPress: () => router.push('/(admin)/settings'),
    },
  ];

  const accountItems = [
    {
      title: 'إنشاء حساب سائق',
      icon: 'car-outline',
      color: COLORS.secondary,
      onPress: () => openCreateModal('driver'),
    },
    {
      title: 'إنشاء حساب مُجمّع',
      icon: 'cube-outline',
      color: COLORS.info,
      onPress: () => openCreateModal('collector'),
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>المزيد</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Account Creation Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>إدارة الحسابات</Text>
          <View style={styles.accountsRow}>
            {accountItems.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.accountItem}
                onPress={item.onPress}
              >
                <View style={[styles.accountIcon, { backgroundColor: item.color + '20' }]}>
                  <Ionicons name={item.icon as any} size={32} color={item.color} />
                </View>
                <Text style={styles.accountLabel}>{item.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Menu Grid */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>الأدوات</Text>
          <View style={styles.menuGrid}>
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.menuItem}
                onPress={item.onPress}
              >
                <View style={[styles.menuIcon, { backgroundColor: item.color + '20' }]}>
                  <Ionicons name={item.icon as any} size={28} color={item.color} />
                </View>
                <Text style={styles.menuLabel}>{item.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color={COLORS.error} />
          <Text style={styles.logoutText}>تسجيل الخروج</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Create Account Modal */}
      <Modal visible={showCreateModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowCreateModal(false)}>
              <Ionicons name="close" size={24} color={COLORS.text} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {createRole === 'driver' ? 'إنشاء حساب سائق' : 'إنشاء حساب مُجمّع الطلبيات'}
            </Text>
            <View style={{ width: 24 }} />
          </View>

          <View style={styles.modalContent}>
            <View style={styles.roleIcon}>
              <Ionicons 
                name={createRole === 'driver' ? 'car' : 'cube'} 
                size={48} 
                color={createRole === 'driver' ? COLORS.secondary : COLORS.info} 
              />
            </View>

            <Input
              label="الاسم الكامل *"
              value={name}
              onChangeText={setName}
              placeholder="أدخل اسم الموظف"
              icon="person-outline"
            />

            <Input
              label="رقم الهاتف *"
              value={phone}
              onChangeText={setPhone}
              placeholder="أدخل رقم الهاتف"
              keyboardType="phone-pad"
              icon="call-outline"
            />

            <View style={styles.infoBox}>
              <Ionicons name="information-circle" size={20} color={COLORS.info} />
              <Text style={styles.infoText}>
                سيتمكن {createRole === 'driver' ? 'السائق' : 'مُجمّع الطلبيات'} من تسجيل الدخول 
                باستخدام رقم الهاتف هذا.
              </Text>
            </View>

            <Button
              title="إنشاء الحساب"
              onPress={createAccount}
              loading={isCreating}
              style={{ marginTop: SIZES.lg }}
            />
          </View>
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
  section: {
    padding: SIZES.md,
  },
  sectionTitle: {
    fontSize: SIZES.fontLg,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SIZES.md,
  },
  accountsRow: {
    flexDirection: 'row',
    gap: SIZES.md,
  },
  accountItem: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.lg,
    alignItems: 'center',
    ...SHADOWS.small,
  },
  accountIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SIZES.sm,
  },
  accountLabel: {
    fontSize: SIZES.fontMd,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  menuItem: {
    width: '50%',
    padding: SIZES.sm,
    alignItems: 'center',
  },
  menuIcon: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SIZES.sm,
    ...SHADOWS.small,
  },
  menuLabel: {
    fontSize: SIZES.fontMd,
    color: COLORS.text,
    textAlign: 'center',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SIZES.sm,
    margin: SIZES.lg,
    padding: SIZES.md,
    backgroundColor: COLORS.error + '10',
    borderRadius: SIZES.radiusMd,
  },
  logoutText: {
    fontSize: SIZES.fontMd,
    fontWeight: '600',
    color: COLORS.error,
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
    padding: SIZES.lg,
  },
  roleIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: SIZES.xl,
    ...SHADOWS.medium,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.info + '10',
    padding: SIZES.md,
    borderRadius: SIZES.radiusMd,
    marginTop: SIZES.md,
    gap: SIZES.sm,
  },
  infoText: {
    flex: 1,
    fontSize: SIZES.fontSm,
    color: COLORS.info,
    textAlign: 'right',
  },
});
