import React, { useState, useEffect, useCallback } from 'react';
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
  TextInput,
  ImageBackground,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useAuthStore } from '../../src/store/authStore';
import { COLORS, SIZES } from '../../src/constants/theme';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

interface LoginSettings {
  store_name: string;
  login_background_image: string;
  login_background_mode: string;
  login_name_placeholder: string;
  login_phone_placeholder: string;
  login_button_text: string;
  login_fields_bg_color: string;
  login_fields_text_color: string;
  login_button_color: string;
  login_button_text_color: string;
  login_fields_border_radius: number;
  login_button_border_radius: number;
  login_error_name_required: string;
  login_error_phone_required: string;
  login_error_phone_invalid: string;
  login_error_generic: string;
  primary_color: string;
}

const defaultSettings: LoginSettings = {
  store_name: 'دار البقال',
  login_background_image: '',
  login_background_mode: 'cover',
  login_name_placeholder: 'أدخل اسمك الكامل',
  login_phone_placeholder: 'أدخل رقم هاتفك',
  login_button_text: 'دخول',
  login_fields_bg_color: '#FFFFFF',
  login_fields_text_color: '#212121',
  login_button_color: '#2E7D32',
  login_button_text_color: '#FFFFFF',
  login_fields_border_radius: 12,
  login_button_border_radius: 12,
  login_error_name_required: 'الرجاء إدخال اسمك (على الأقل حرفين)',
  login_error_phone_required: 'الرجاء إدخال رقم الهاتف',
  login_error_phone_invalid: 'رقم الهاتف غير صحيح',
  login_error_generic: 'فشل تسجيل الدخول. الرجاء المحاولة مرة أخرى',
  primary_color: '#2E7D32',
};

export default function LoginScreen() {
  const router = useRouter();
  const { login, isLoading } = useAuthStore();
  
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [errors, setErrors] = useState<{ phone?: string; name?: string }>({});
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [showPendingScreen, setShowPendingScreen] = useState(false);
  const [settings, setSettings] = useState<LoginSettings>(defaultSettings);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);

  // Fetch settings from API
  const fetchSettings = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/settings`);
      if (response.ok) {
        const data = await response.json();
        setSettings({
          store_name: data.store_name || defaultSettings.store_name,
          login_background_image: data.login_background_image || '',
          login_background_mode: data.login_background_mode || 'cover',
          login_name_placeholder: data.login_name_placeholder || defaultSettings.login_name_placeholder,
          login_phone_placeholder: data.login_phone_placeholder || defaultSettings.login_phone_placeholder,
          login_button_text: data.login_button_text || defaultSettings.login_button_text,
          login_fields_bg_color: data.login_fields_bg_color || defaultSettings.login_fields_bg_color,
          login_fields_text_color: data.login_fields_text_color || defaultSettings.login_fields_text_color,
          login_button_color: data.login_button_color || defaultSettings.login_button_color,
          login_button_text_color: data.login_button_text_color || defaultSettings.login_button_text_color,
          login_fields_border_radius: data.login_fields_border_radius ?? defaultSettings.login_fields_border_radius,
          login_button_border_radius: data.login_button_border_radius ?? defaultSettings.login_button_border_radius,
          login_error_name_required: data.login_error_name_required || defaultSettings.login_error_name_required,
          login_error_phone_required: data.login_error_phone_required || defaultSettings.login_error_phone_required,
          login_error_phone_invalid: data.login_error_phone_invalid || defaultSettings.login_error_phone_invalid,
          login_error_generic: data.login_error_generic || defaultSettings.login_error_generic,
          primary_color: data.primary_color || defaultSettings.primary_color,
        });
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setIsLoadingSettings(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const validatePhone = (value: string) => {
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
      newErrors.name = settings.login_error_name_required;
    }
    
    if (!phone) {
      newErrors.phone = settings.login_error_phone_required;
    } else if (!validatePhone(phone)) {
      newErrors.phone = settings.login_error_phone_invalid;
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    try {
      const location = await getLocation();
      const result = await login(phone, name.trim(), location?.latitude, location?.longitude);
      
      if (result?.needs_approval && result?.is_new_registration) {
        setShowPendingScreen(true);
      } else if (result?.needs_approval) {
        setShowPendingScreen(true);
      } else {
        router.replace('/');
      }
    } catch (error) {
      Alert.alert('خطأ', settings.login_error_generic);
    }
  };

  // Show pending approval screen
  if (showPendingScreen) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: settings.primary_color }]}>
        <View style={styles.pendingContainer}>
          <View style={[styles.pendingIcon, { backgroundColor: '#FFC107' + '30' }]}>
            <Ionicons name="time-outline" size={80} color="#FFC107" />
          </View>
          <Text style={styles.pendingTitle}>في انتظار الموافقة</Text>
          <Text style={styles.pendingSubtitle}>
            تم إرسال طلب تسجيلك بنجاح!{'\n'}
            سيتم تفعيل حسابك بعد موافقة المتحكم.{'\n'}
            يمكنك المحاولة مرة أخرى لاحقاً.
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { borderColor: '#FFFFFF' }]}
            onPress={() => setShowPendingScreen(false)}
          >
            <Text style={styles.retryButtonText}>حاول مرة أخرى</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Show loading while fetching settings
  if (isLoadingSettings) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: settings.primary_color }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFFFFF" />
        </View>
      </SafeAreaView>
    );
  }

  const renderContent = () => (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.keyboardView}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={[styles.logoCircle, { backgroundColor: '#FFFFFF30' }]}>
            <Text style={styles.logoEmoji}>🛒</Text>
          </View>
          <Text style={[styles.title, { color: '#FFFFFF' }]}>{settings.store_name}</Text>
          <Text style={[styles.subtitle, { color: '#FFFFFF90' }]}>مرحباً بك في متجرك المفضل</Text>
        </View>

        <View style={[styles.form, { backgroundColor: '#FFFFFF' }]}>
          {/* Name Input */}
          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: settings.login_fields_text_color }]}>الاسم الكامل *</Text>
            <View style={[
              styles.inputWrapper,
              { 
                backgroundColor: settings.login_fields_bg_color,
                borderRadius: settings.login_fields_border_radius,
                borderColor: errors.name ? '#F44336' : '#E0E0E0',
              }
            ]}>
              <Ionicons name="person-outline" size={20} color={settings.login_fields_text_color + '80'} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: settings.login_fields_text_color }]}
                value={name}
                onChangeText={(text) => {
                  setName(text);
                  setErrors({ ...errors, name: undefined });
                }}
                placeholder={settings.login_name_placeholder}
                placeholderTextColor={settings.login_fields_text_color + '60'}
                textAlign="right"
              />
            </View>
            {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
          </View>

          {/* Phone Input */}
          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: settings.login_fields_text_color }]}>رقم الهاتف *</Text>
            <View style={[
              styles.inputWrapper,
              { 
                backgroundColor: settings.login_fields_bg_color,
                borderRadius: settings.login_fields_border_radius,
                borderColor: errors.phone ? '#F44336' : '#E0E0E0',
              }
            ]}>
              <Ionicons name="call-outline" size={20} color={settings.login_fields_text_color + '80'} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: settings.login_fields_text_color }]}
                value={phone}
                onChangeText={(text) => {
                  setPhone(text);
                  setErrors({ ...errors, phone: undefined });
                }}
                placeholder={settings.login_phone_placeholder}
                placeholderTextColor={settings.login_fields_text_color + '60'}
                keyboardType="phone-pad"
                textAlign="right"
              />
            </View>
            {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
          </View>

          {isGettingLocation && (
            <View style={[styles.locationLoading, { backgroundColor: settings.primary_color + '15' }]}>
              <ActivityIndicator color={settings.primary_color} />
              <Text style={[styles.locationText, { color: settings.primary_color }]}>جاري تحديد موقعك...</Text>
            </View>
          )}

          {/* Login Button */}
          <TouchableOpacity
            style={[
              styles.loginButton,
              { 
                backgroundColor: settings.login_button_color,
                borderRadius: settings.login_button_border_radius,
              }
            ]}
            onPress={handleLogin}
            disabled={isLoading || isGettingLocation}
          >
            {isLoading || isGettingLocation ? (
              <ActivityIndicator color={settings.login_button_text_color} />
            ) : (
              <Text style={[styles.loginButtonText, { color: settings.login_button_text_color }]}>
                {settings.login_button_text}
              </Text>
            )}
          </TouchableOpacity>

          <Text style={styles.noteText}>
            * سيتم طلب إذن الموقع لتحديد عنوان التوصيل
          </Text>
        </View>

        <View style={styles.features}>
          <Text style={[styles.featuresTitle, { color: '#FFFFFF' }]}>مميزاتنا</Text>
          <View style={styles.featuresList}>
            <FeatureItem icon="pricetag-outline" text="أسعار تنافسية" color={settings.primary_color} />
            <FeatureItem icon="star-outline" text="جودة عالية" color={settings.primary_color} />
            <FeatureItem icon="car-outline" text="توصيل سريع" color={settings.primary_color} />
            <FeatureItem icon="cash-outline" text="الدفع عند الاستلام" color={settings.primary_color} />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );

  // Render with or without background image
  if (settings.login_background_image) {
    return (
      <ImageBackground
        source={{ uri: settings.login_background_image }}
        style={styles.container}
        resizeMode={settings.login_background_mode as any}
      >
        <View style={styles.overlay} />
        <SafeAreaView style={styles.safeArea}>
          {renderContent()}
        </SafeAreaView>
      </ImageBackground>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: settings.primary_color }]}>
      {renderContent()}
    </SafeAreaView>
  );
}

const FeatureItem = ({ icon, text, color }: { icon: string; text: string; color: string }) => (
  <View style={[styles.featureItem, { backgroundColor: '#FFFFFF20' }]}>
    <View style={[styles.featureIcon, { backgroundColor: '#FFFFFF30' }]}>
      <Ionicons name={icon as any} size={20} color="#FFFFFF" />
    </View>
    <Text style={[styles.featureText, { color: '#FFFFFF' }]}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    marginBottom: SIZES.xs,
  },
  subtitle: {
    fontSize: SIZES.fontLg,
  },
  form: {
    borderRadius: SIZES.radiusLg,
    padding: SIZES.lg,
    marginBottom: SIZES.lg,
  },
  inputContainer: {
    marginBottom: SIZES.md,
  },
  inputLabel: {
    fontSize: SIZES.fontSm,
    fontWeight: '600',
    marginBottom: SIZES.xs,
    textAlign: 'right',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: SIZES.md,
    minHeight: 50,
  },
  inputIcon: {
    marginRight: SIZES.sm,
  },
  input: {
    flex: 1,
    fontSize: SIZES.fontMd,
    paddingVertical: SIZES.sm,
  },
  errorText: {
    fontSize: SIZES.fontXs,
    color: '#F44336',
    marginTop: 4,
    textAlign: 'right',
  },
  loginButton: {
    height: 54,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SIZES.md,
  },
  loginButtonText: {
    fontSize: SIZES.fontLg,
    fontWeight: 'bold',
  },
  noteText: {
    fontSize: SIZES.fontSm,
    color: '#9E9E9E',
    textAlign: 'center',
    marginTop: SIZES.md,
  },
  locationLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SIZES.sm,
    borderRadius: SIZES.radiusMd,
    marginTop: SIZES.sm,
  },
  locationText: {
    fontSize: SIZES.fontSm,
    marginLeft: SIZES.sm,
  },
  features: {
    marginTop: SIZES.md,
  },
  featuresTitle: {
    fontSize: SIZES.fontLg,
    fontWeight: '600',
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
    padding: SIZES.md,
    borderRadius: SIZES.radiusMd,
    marginBottom: SIZES.sm,
  },
  featureIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.sm,
  },
  featureText: {
    flex: 1,
    fontSize: SIZES.fontSm,
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
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SIZES.xl,
  },
  pendingTitle: {
    fontSize: SIZES.fontXxl,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: SIZES.md,
    textAlign: 'center',
  },
  pendingSubtitle: {
    fontSize: SIZES.fontMd,
    color: '#FFFFFF90',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: SIZES.xl,
  },
  retryButton: {
    paddingVertical: SIZES.md,
    paddingHorizontal: SIZES.xl,
    borderRadius: SIZES.radiusMd,
    borderWidth: 2,
  },
  retryButtonText: {
    fontSize: SIZES.fontMd,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
