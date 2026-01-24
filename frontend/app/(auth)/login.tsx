import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useAuthStore } from '../../src/store/authStore';
import { Input } from '../../src/components/Input';
import { Button } from '../../src/components/Button';
import { COLORS, SIZES } from '../../src/constants/theme';

export default function LoginScreen() {
  const router = useRouter();
  const { login, isLoading } = useAuthStore();
  
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [errors, setErrors] = useState<{ phone?: string; name?: string }>({});
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [showPendingScreen, setShowPendingScreen] = useState(false);

  const validatePhone = (value: string) => {
    // Simple phone validation
    return value.length >= 9;
  };

  const getLocation = async (): Promise<{ latitude: number; longitude: number } | null> => {
    try {
      setIsGettingLocation(true);
      
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'إذن الموقع',
          'نحتاج إذن الموقع لتحديد موقع التوصيل. يمكنك المتابعة بدون تحديد الموقع.',
          [{ text: 'حسناً' }]
        );
        return null;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
    } catch (error) {
      console.error('Error getting location:', error);
      return null;
    } finally {
      setIsGettingLocation(false);
    }
  };

  const handleLogin = async () => {
    const newErrors: { phone?: string; name?: string } = {};
    
    if (!name || name.trim().length < 2) {
      newErrors.name = 'الرجاء إدخال اسمك (على الأقل حرفين)';
    }
    
    if (!phone) {
      newErrors.phone = 'الرجاء إدخال رقم الهاتف';
    } else if (!validatePhone(phone)) {
      newErrors.phone = 'رقم الهاتف غير صحيح';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    try {
      // Get location first
      const location = await getLocation();
      
      // Login with location
      const result = await login(phone, name.trim(), location?.latitude, location?.longitude);
      
      // Check if needs approval
      if (result?.needs_approval && result?.is_new_registration) {
        setShowPendingScreen(true);
      } else if (result?.needs_approval) {
        setShowPendingScreen(true);
      } else {
        // Navigation will be handled by index.tsx based on role
        router.replace('/');
      }
    } catch (error) {
      Alert.alert('خطأ', 'فشل تسجيل الدخول. الرجاء المحاولة مرة أخرى.');
    }
  };

  // Show pending approval screen
  if (showPendingScreen) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.pendingContainer}>
          <View style={styles.pendingIcon}>
            <Ionicons name="time-outline" size={80} color={COLORS.warning} />
          </View>
          <Text style={styles.pendingTitle}>في انتظار الموافقة</Text>
          <Text style={styles.pendingSubtitle}>
            تم إرسال طلب تسجيلك بنجاح!{'\n'}
            سيتم تفعيل حسابك بعد موافقة المتحكم.{'\n'}
            يمكنك المحاولة مرة أخرى لاحقاً.
          </Text>
          <Button
            title="حاول مرة أخرى"
            onPress={() => setShowPendingScreen(false)}
            variant="outline"
            style={styles.retryButton}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoEmoji}>🛒</Text>
            </View>
            <Text style={styles.title}>دار البقال</Text>
            <Text style={styles.subtitle}>مرحباً بك في متجرك المفضل</Text>
          </View>

          <View style={styles.form}>
            <Input
              label="الاسم الكامل *"
              value={name}
              onChangeText={(text) => {
                setName(text);
                setErrors({ ...errors, name: undefined });
              }}
              placeholder="أدخل اسمك الكامل"
              icon="person-outline"
              error={errors.name}
            />

            <Input
              label="رقم الهاتف *"
              value={phone}
              onChangeText={(text) => {
                setPhone(text);
                setErrors({ ...errors, phone: undefined });
              }}
              placeholder="أدخل رقم هاتفك"
              keyboardType="phone-pad"
              icon="call-outline"
              error={errors.phone}
            />

            {isGettingLocation && (
              <View style={styles.locationLoading}>
                <ActivityIndicator color={COLORS.primary} />
                <Text style={styles.locationText}>جاري تحديد موقعك...</Text>
              </View>
            )}

            <Button
              title="دخول"
              onPress={handleLogin}
              loading={isLoading || isGettingLocation}
              size="large"
              style={styles.loginButton}
            />

            <Text style={styles.noteText}>
              * سيتم طلب إذن الموقع لتحديد عنوان التوصيل
            </Text>
          </View>

          <View style={styles.features}>
            <Text style={styles.featuresTitle}>مميزاتنا</Text>
            <View style={styles.featuresList}>
              <FeatureItem icon="pricetag-outline" text="أسعار تنافسية" />
              <FeatureItem icon="star-outline" text="جودة عالية" />
              <FeatureItem icon="car-outline" text="توصيل سريع" />
              <FeatureItem icon="cash-outline" text="الدفع عند الاستلام" />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const FeatureItem = ({ icon, text }: { icon: string; text: string }) => (
  <View style={styles.featureItem}>
    <View style={styles.featureIcon}>
      <Ionicons name={icon as any} size={20} color={COLORS.primary} />
    </View>
    <Text style={styles.featureText}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: SIZES.lg,
  },
  header: {
    alignItems: 'center',
    marginTop: SIZES.xl,
    marginBottom: SIZES.xl,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SIZES.md,
  },
  logoEmoji: {
    fontSize: 50,
  },
  title: {
    fontSize: SIZES.fontTitle,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: SIZES.xs,
  },
  subtitle: {
    fontSize: SIZES.fontLg,
    color: COLORS.textSecondary,
  },
  form: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.lg,
    marginBottom: SIZES.lg,
  },
  loginButton: {
    marginTop: SIZES.md,
  },
  noteText: {
    fontSize: SIZES.fontSm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SIZES.md,
  },
  locationLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SIZES.sm,
    backgroundColor: COLORS.primary + '10',
    borderRadius: SIZES.radiusMd,
    marginTop: SIZES.sm,
  },
  locationText: {
    fontSize: SIZES.fontSm,
    color: COLORS.primary,
    marginLeft: SIZES.sm,
  },
  features: {
    marginTop: SIZES.md,
  },
  featuresTitle: {
    fontSize: SIZES.fontLg,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SIZES.md,
  },
  featuresList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  featureItem: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: SIZES.md,
    borderRadius: SIZES.radiusMd,
    marginBottom: SIZES.sm,
  },
  featureIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primaryLight + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.sm,
  },
  featureText: {
    flex: 1,
    fontSize: SIZES.fontSm,
    color: COLORS.text,
  },
  // Pending approval styles
  pendingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.xl,
  },
  pendingIcon: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: COLORS.warning + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SIZES.xl,
  },
  pendingTitle: {
    fontSize: SIZES.fontXxl,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SIZES.md,
    textAlign: 'center',
  },
  pendingSubtitle: {
    fontSize: SIZES.fontMd,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: SIZES.xl,
  },
  retryButton: {
    minWidth: 200,
  },
});
