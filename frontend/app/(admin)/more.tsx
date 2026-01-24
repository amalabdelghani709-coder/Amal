import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS, SIZES, SHADOWS } from '../../src/constants/theme';
import { useAuthStore } from '../../src/store/authStore';

export default function AdminMoreScreen() {
  const router = useRouter();
  const { logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    router.replace('/');
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>المزيد</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
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

        {/* Logout */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color={COLORS.error} />
          <Text style={styles.logoutText}>تسجيل الخروج</Text>
        </TouchableOpacity>
      </ScrollView>
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
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: SIZES.sm,
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
});
