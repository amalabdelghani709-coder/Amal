import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS, SIZES, SHADOWS } from '../../src/constants/theme';
import { useAuthStore } from '../../src/store/authStore';
import { Input } from '../../src/components/Input';
import { Button } from '../../src/components/Button';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, updateUser, logout } = useAuthStore();
  
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [address, setAddress] = useState(user?.address || '');
  const [city, setCity] = useState(user?.city || '');
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch(`${API_URL}/api/settings`);
      if (response.ok) {
        setSettings(await response.json());
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/auth/user/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, city }),
      });

      if (response.ok) {
        const updatedUser = await response.json();
        updateUser(updatedUser);
        setIsEditing(false);
        Alert.alert('تم', 'تم حفظ التغييرات بنجاح');
      } else {
        Alert.alert('خطأ', 'فشل حفظ التغييرات');
      }
    } catch (error) {
      Alert.alert('خطأ', 'فشل الاتصال بالخادم');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'تسجيل الخروج',
      'هل تريد تسجيل الخروج؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'خروج',
          style: 'destructive',
          onPress: async () => {
            await logout();
            // Use dismissAll to clear the navigation stack, then navigate
            router.dismissAll();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  const openWhatsApp = () => {
    if (settings?.whatsapp_number) {
      Linking.openURL(`https://wa.me/${settings.whatsapp_number}`);
    }
  };

  const canShowGift = (user?.total_orders || 0) >= 3;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>حسابي</Text>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>
              {user?.name ? user.name.charAt(0).toUpperCase() : 'ز'}
            </Text>
          </View>
          <Text style={styles.userName}>{user?.name || 'زبون عزيز'}</Text>
          <Text style={styles.userPhone}>{user?.phone}</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{user?.total_orders || 0}</Text>
              <Text style={styles.statLabel}>طلبيات</Text>
            </View>
            {canShowGift && (
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: COLORS.accent }]}>{user?.points || 0}</Text>
                <Text style={styles.statLabel}>نقاط</Text>
              </View>
            )}
          </View>
        </View>

        {/* Gift Section - Only show after 3 orders */}
        {canShowGift && (
          <View style={styles.giftCard}>
            <View style={styles.giftHeader}>
              <Ionicons name="gift" size={24} color={COLORS.accent} />
              <Text style={styles.giftTitle}>هديتي اليوم</Text>
            </View>
            <Text style={styles.giftDescription}>
              لديك {user?.points || 0} نقطة يمكنك استخدامها لخصم رسوم التوصيل
            </Text>
            <Text style={styles.giftValue}>
              قيمة النقاط: {((user?.points || 0) / 100).toFixed(2)} درهم
            </Text>
          </View>
        )}

        {/* Address Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>العنوان</Text>
            <TouchableOpacity onPress={() => setIsEditing(!isEditing)}>
              <Text style={styles.editButton}>{isEditing ? 'إلغاء' : 'تعديل'}</Text>
            </TouchableOpacity>
          </View>

          {isEditing ? (
            <View>
              <Input
                label="العنوان"
                value={address}
                onChangeText={setAddress}
                placeholder="أدخل عنوانك"
                icon="location-outline"
                multiline
                numberOfLines={2}
              />
              <Input
                label="المدينة"
                value={city}
                onChangeText={setCity}
                placeholder="أدخل المدينة"
                icon="business-outline"
              />
              <Button
                title="حفظ التغييرات"
                onPress={handleSave}
                loading={isLoading}
              />
            </View>
          ) : (
            <View style={styles.addressCard}>
              <Ionicons name="location" size={24} color={COLORS.primary} />
              <View style={styles.addressInfo}>
                <Text style={styles.addressText}>{user?.address || 'لم يتم تحديد العنوان'}</Text>
                {user?.city && <Text style={styles.cityText}>{user.city}</Text>}
              </View>
            </View>
          )}
        </View>

        {/* Contact Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>تواصل معنا</Text>
          <TouchableOpacity style={styles.contactCard} onPress={openWhatsApp}>
            <Ionicons name="logo-whatsapp" size={24} color="#25D366" />
            <View style={styles.contactInfo}>
              <Text style={styles.contactTitle}>واتساب</Text>
              <Text style={styles.contactSubtitle}>تواصل معنا مباشرة</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
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
  profileCard: {
    backgroundColor: COLORS.surface,
    marginHorizontal: SIZES.md,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.lg,
    alignItems: 'center',
    ...SHADOWS.small,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SIZES.sm,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  userName: {
    fontSize: SIZES.fontXl,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SIZES.xs,
  },
  userPhone: {
    fontSize: SIZES.fontMd,
    color: COLORS.textSecondary,
    marginBottom: SIZES.md,
  },
  statsRow: {
    flexDirection: 'row',
    gap: SIZES.xl,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: SIZES.fontXxl,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: SIZES.fontSm,
    color: COLORS.textSecondary,
  },
  giftCard: {
    backgroundColor: COLORS.accent + '20',
    marginHorizontal: SIZES.md,
    marginTop: SIZES.md,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.md,
  },
  giftHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.sm,
    marginBottom: SIZES.sm,
  },
  giftTitle: {
    fontSize: SIZES.fontLg,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  giftDescription: {
    fontSize: SIZES.fontMd,
    color: COLORS.textSecondary,
    marginBottom: SIZES.xs,
    textAlign: 'right',
  },
  giftValue: {
    fontSize: SIZES.fontMd,
    fontWeight: '600',
    color: COLORS.accent,
    textAlign: 'right',
  },
  section: {
    marginTop: SIZES.lg,
    paddingHorizontal: SIZES.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.sm,
  },
  sectionTitle: {
    fontSize: SIZES.fontLg,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  editButton: {
    fontSize: SIZES.fontMd,
    color: COLORS.primary,
  },
  addressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radiusMd,
    padding: SIZES.md,
    gap: SIZES.sm,
  },
  addressInfo: {
    flex: 1,
  },
  addressText: {
    fontSize: SIZES.fontMd,
    color: COLORS.text,
    textAlign: 'right',
  },
  cityText: {
    fontSize: SIZES.fontSm,
    color: COLORS.textSecondary,
    textAlign: 'right',
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radiusMd,
    padding: SIZES.md,
    gap: SIZES.sm,
  },
  contactInfo: {
    flex: 1,
  },
  contactTitle: {
    fontSize: SIZES.fontMd,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'right',
  },
  contactSubtitle: {
    fontSize: SIZES.fontSm,
    color: COLORS.textSecondary,
    textAlign: 'right',
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
