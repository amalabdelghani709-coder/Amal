import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/store/authStore';
import { Input } from '../../src/components/Input';
import { Button } from '../../src/components/Button';
import { COLORS, SIZES } from '../../src/constants/theme';

export default function LoginScreen() {
  const router = useRouter();
  const { login, isLoading } = useAuthStore();
  
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [showNameField, setShowNameField] = useState(false);
  const [errors, setErrors] = useState<{ phone?: string; name?: string }>({});

  const validatePhone = (value: string) => {
    // Simple phone validation
    return value.length >= 9;
  };

  const handleLogin = async () => {
    const newErrors: { phone?: string; name?: string } = {};
    
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
      await login(phone, name);
      // Navigation will be handled by index.tsx based on role
      router.replace('/');
    } catch (error) {
      Alert.alert('خطأ', 'فشل تسجيل الدخول. الرجاء المحاولة مرة أخرى.');
    }
  };

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
              label="رقم الهاتف"
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

            <TouchableOpacity
              style={styles.nameToggle}
              onPress={() => setShowNameField(!showNameField)}
            >
              <Text style={styles.nameToggleText}>
                {showNameField ? 'إخفاء حقل الاسم' : 'إضافة اسمك (اختياري)'}
              </Text>
              <Ionicons
                name={showNameField ? 'chevron-up' : 'chevron-down'}
                size={16}
                color={COLORS.primary}
              />
            </TouchableOpacity>

            {showNameField && (
              <Input
                label="الاسم"
                value={name}
                onChangeText={setName}
                placeholder="أدخل اسمك"
                icon="person-outline"
                error={errors.name}
              />
            )}

            <Button
              title="دخول"
              onPress={handleLogin}
              loading={isLoading}
              size="large"
              style={styles.loginButton}
            />
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
  nameToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: SIZES.md,
  },
  nameToggleText: {
    fontSize: SIZES.fontSm,
    color: COLORS.primary,
    marginRight: SIZES.xs,
  },
  loginButton: {
    marginTop: SIZES.md,
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
});
