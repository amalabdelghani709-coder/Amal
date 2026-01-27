import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Image,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, SIZES, SHADOWS } from '../../src/constants/theme';
import { LoadingScreen } from '../../src/components/LoadingScreen';
import { Button } from '../../src/components/Button';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

const COLOR_PRESETS = [
  'transparent', '#FFFFFF', '#F5F5F5', '#E0E0E0', '#212121', '#000000',
  '#2E7D32', '#1976D2', '#7B1FA2', '#C62828', '#F57C00', '#00796B',
  '#5D4037', '#455A64', '#E91E63', '#3F51B5', '#009688', '#FF5722', '#FFC107',
];

const BORDER_RADIUS_OPTIONS = [
  { value: 0, label: 'مربع' },
  { value: 8, label: 'خفيف' },
  { value: 12, label: 'متوسط' },
  { value: 20, label: 'دائري' },
  { value: 30, label: 'حبة' },
];

const BACKGROUND_MODES = [
  { value: 'cover', label: 'ملء' },
  { value: 'contain', label: 'احتواء' },
  { value: 'stretch', label: 'تمديد' },
];

const LOGO_SIZE_OPTIONS = [
  { value: 60, label: 'صغير' },
  { value: 80, label: 'متوسط' },
  { value: 100, label: 'كبير' },
  { value: 120, label: 'كبير جداً' },
];

const EMOJI_OPTIONS = ['🛒', '🏪', '🛍️', '🏬', '🛒', '🧺', '📦', '🎁', '⭐', '💎'];

interface LoginSettings {
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
  // Logo settings
  login_logo_image: string;
  login_logo_mode: string;
  login_logo_emoji: string;
  login_logo_size: number;
}

export default function LoginSettingsScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState<LoginSettings | null>(null);
  const [activeTab, setActiveTab] = useState<'logo' | 'background' | 'texts' | 'colors' | 'shapes' | 'errors'>('logo');

  const fetchSettings = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/settings`);
      if (response.ok) {
        const data = await response.json();
        setSettings({
          login_background_image: data.login_background_image || '',
          login_background_mode: data.login_background_mode || 'cover',
          login_name_placeholder: data.login_name_placeholder || 'أدخل اسمك الكامل',
          login_phone_placeholder: data.login_phone_placeholder || 'أدخل رقم هاتفك',
          login_button_text: data.login_button_text || 'دخول',
          login_fields_bg_color: data.login_fields_bg_color || '#FFFFFF',
          login_fields_text_color: data.login_fields_text_color || '#212121',
          login_button_color: data.login_button_color || '#2E7D32',
          login_button_text_color: data.login_button_text_color || '#FFFFFF',
          login_fields_border_radius: data.login_fields_border_radius ?? 12,
          login_button_border_radius: data.login_button_border_radius ?? 12,
          login_error_name_required: data.login_error_name_required || 'الرجاء إدخال اسمك (على الأقل حرفين)',
          login_error_phone_required: data.login_error_phone_required || 'الرجاء إدخال رقم الهاتف',
          login_error_phone_invalid: data.login_error_phone_invalid || 'رقم الهاتف غير صحيح',
          login_error_generic: data.login_error_generic || 'فشل تسجيل الدخول. الرجاء المحاولة مرة أخرى',
          // Logo settings
          login_logo_image: data.login_logo_image || '',
          login_logo_mode: data.login_logo_mode || 'emoji',
          login_logo_emoji: data.login_logo_emoji || '🛒',
          login_logo_size: data.login_logo_size || 100,
        });
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchSettings();
  };

  const updateSettings = async (updates: Partial<LoginSettings>) => {
    setIsSaving(true);
    try {
      const response = await fetch(`${API_URL}/api/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        setSettings(prev => prev ? { ...prev, ...updates } : null);
        Alert.alert('تم', 'تم حفظ التغييرات بنجاح');
      } else {
        Alert.alert('خطأ', 'فشل حفظ التغييرات');
      }
    } catch (error) {
      Alert.alert('خطأ', 'حدث خطأ أثناء الحفظ');
    } finally {
      setIsSaving(false);
    }
  };

  const pickBackgroundImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [9, 16],
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
      updateSettings({ login_background_image: base64Image });
    }
  };

  const pickLogoImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
      updateSettings({ login_logo_image: base64Image, login_logo_mode: 'image' });
    }
  };

  const removeLogoImage = () => {
    Alert.alert(
      'حذف الصورة',
      'هل تريد حذف صورة اللوغو والعودة للإيموجي؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'حذف',
          style: 'destructive',
          onPress: () => updateSettings({ login_logo_image: '', login_logo_mode: 'emoji' }),
        },
      ]
    );
  };

  const removeBackgroundImage = () => {
    Alert.alert(
      'حذف الصورة',
      'هل تريد حذف صورة الخلفية؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'حذف',
          style: 'destructive',
          onPress: () => updateSettings({ login_background_image: '' }),
        },
      ]
    );
  };

  if (isLoading || !settings) {
    return <LoadingScreen />;
  }

  const tabs = [
    { id: 'logo', label: 'اللوغو', icon: 'image-outline' },
    { id: 'background', label: 'الخلفية', icon: 'layers-outline' },
    { id: 'texts', label: 'النصوص', icon: 'text-outline' },
    { id: 'colors', label: 'الألوان', icon: 'color-palette-outline' },
    { id: 'shapes', label: 'الأشكال', icon: 'shapes-outline' },
    { id: 'errors', label: 'الأخطاء', icon: 'alert-circle-outline' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-forward" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.title}>واجهة تسجيل الدخول</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Preview */}
      <View style={styles.previewContainer}>
        <View style={[
          styles.preview,
          settings.login_background_image ? {} : { backgroundColor: COLORS.primary }
        ]}>
          {settings.login_background_image ? (
            <Image 
              source={{ uri: settings.login_background_image }} 
              style={[styles.previewBg, { resizeMode: settings.login_background_mode as any }]}
            />
          ) : null}
          <View style={styles.previewContent}>
            {/* Logo Preview */}
            <View style={[styles.previewLogo, { width: settings.login_logo_size / 3, height: settings.login_logo_size / 3 }]}>
              {settings.login_logo_mode === 'image' && settings.login_logo_image ? (
                <Image source={{ uri: settings.login_logo_image }} style={styles.previewLogoImage} />
              ) : (
                <Text style={{ fontSize: settings.login_logo_size / 6 }}>{settings.login_logo_emoji}</Text>
              )}
            </View>
            <View style={[
              styles.previewField,
              { 
                backgroundColor: settings.login_fields_bg_color,
                borderRadius: settings.login_fields_border_radius / 3,
              }
            ]}>
              <Text style={[styles.previewFieldText, { color: settings.login_fields_text_color + '80' }]}>
                {settings.login_name_placeholder.slice(0, 15)}...
              </Text>
            </View>
            <View style={[
              styles.previewField,
              { 
                backgroundColor: settings.login_fields_bg_color,
                borderRadius: settings.login_fields_border_radius / 3,
              }
            ]}>
              <Text style={[styles.previewFieldText, { color: settings.login_fields_text_color + '80' }]}>
                {settings.login_phone_placeholder.slice(0, 15)}...
              </Text>
            </View>
            <View style={[
              styles.previewButton,
              { 
                backgroundColor: settings.login_button_color,
                borderRadius: settings.login_button_border_radius / 3,
              }
            ]}>
              <Text style={[styles.previewButtonText, { color: settings.login_button_text_color }]}>
                {settings.login_button_text}
              </Text>
            </View>
          </View>
        </View>
        <Text style={styles.previewLabel}>معاينة</Text>
      </View>

      {/* Tabs */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.tabsContainer}
        contentContainerStyle={styles.tabsContent}
      >
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, activeTab === tab.id && styles.tabActive]}
            onPress={() => setActiveTab(tab.id as any)}
          >
            <Ionicons 
              name={tab.icon as any} 
              size={18} 
              color={activeTab === tab.id ? COLORS.white : COLORS.textSecondary} 
            />
            <Text style={[styles.tabText, activeTab === tab.id && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
        }
        contentContainerStyle={styles.content}
      >
        {/* Logo Tab */}
        {activeTab === 'logo' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>الصورة فوق اسم المتجر (اللوغو)</Text>
            <Text style={styles.sectionDesc}>الصورة أو الإيموجي الذي يظهر فوق اسم "دار البقال"</Text>
            
            {/* Logo Mode Selection */}
            <Text style={styles.subLabel}>نوع اللوغو</Text>
            <View style={styles.optionsRow}>
              <TouchableOpacity
                style={[styles.optionBtn, settings.login_logo_mode === 'emoji' && styles.optionBtnActive]}
                onPress={() => updateSettings({ login_logo_mode: 'emoji' })}
              >
                <Text style={[styles.optionText, settings.login_logo_mode === 'emoji' && styles.optionTextActive]}>
                  إيموجي
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.optionBtn, settings.login_logo_mode === 'image' && styles.optionBtnActive]}
                onPress={() => updateSettings({ login_logo_mode: 'image' })}
              >
                <Text style={[styles.optionText, settings.login_logo_mode === 'image' && styles.optionTextActive]}>
                  صورة
                </Text>
              </TouchableOpacity>
            </View>

            {/* Emoji Selection */}
            {settings.login_logo_mode === 'emoji' && (
              <>
                <Text style={styles.subLabel}>اختر الإيموجي</Text>
                <View style={styles.emojiGrid}>
                  {EMOJI_OPTIONS.map((emoji, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.emojiOption,
                        settings.login_logo_emoji === emoji && styles.emojiOptionActive,
                      ]}
                      onPress={() => updateSettings({ login_logo_emoji: emoji })}
                    >
                      <Text style={styles.emojiText}>{emoji}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            {/* Image Upload */}
            {settings.login_logo_mode === 'image' && (
              <>
                <Text style={styles.subLabel}>صورة اللوغو</Text>
                {settings.login_logo_image ? (
                  <View style={styles.logoImageContainer}>
                    <Image source={{ uri: settings.login_logo_image }} style={styles.logoImage} />
                    <TouchableOpacity style={styles.removeLogoBtn} onPress={removeLogoImage}>
                      <Ionicons name="trash" size={20} color={COLORS.white} />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity style={styles.uploadBox} onPress={pickLogoImage}>
                    <Ionicons name="cloud-upload-outline" size={48} color={COLORS.primary} />
                    <Text style={styles.uploadText}>اضغط لتحميل صورة</Text>
                  </TouchableOpacity>
                )}
                <Button
                  title="تغيير الصورة"
                  onPress={pickLogoImage}
                  variant="outline"
                  style={{ marginTop: SIZES.md }}
                />
              </>
            )}

            {/* Logo Size */}
            <Text style={styles.subLabel}>حجم اللوغو</Text>
            <View style={styles.sizeOptions}>
              {LOGO_SIZE_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={[
                    styles.sizeOption,
                    settings.login_logo_size === opt.value && styles.sizeOptionActive,
                  ]}
                  onPress={() => updateSettings({ login_logo_size: opt.value })}
                >
                  <Text style={[
                    styles.sizeText,
                    settings.login_logo_size === opt.value && styles.sizeTextActive,
                  ]}>{opt.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Background Tab */}
        {activeTab === 'background' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>صورة الخلفية</Text>
            
            {settings.login_background_image ? (
              <View style={styles.imageContainer}>
                <Image source={{ uri: settings.login_background_image }} style={styles.bgImage} />
                <TouchableOpacity style={styles.removeImageBtn} onPress={removeBackgroundImage}>
                  <Ionicons name="trash" size={20} color={COLORS.white} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.uploadBox} onPress={pickBackgroundImage}>
                <Ionicons name="cloud-upload-outline" size={48} color={COLORS.primary} />
                <Text style={styles.uploadText}>اضغط لتحميل صورة</Text>
              </TouchableOpacity>
            )}

            {settings.login_background_image && (
              <>
                <Text style={styles.subLabel}>وضعية الصورة</Text>
                <View style={styles.optionsRow}>
                  {BACKGROUND_MODES.map((mode) => (
                    <TouchableOpacity
                      key={mode.value}
                      style={[
                        styles.optionBtn,
                        settings.login_background_mode === mode.value && styles.optionBtnActive,
                      ]}
                      onPress={() => updateSettings({ login_background_mode: mode.value })}
                    >
                      <Text style={[
                        styles.optionText,
                        settings.login_background_mode === mode.value && styles.optionTextActive,
                      ]}>{mode.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            <Button
              title="تغيير الصورة"
              onPress={pickBackgroundImage}
              variant="outline"
              style={{ marginTop: SIZES.md }}
            />
          </View>
        )}

        {/* Texts Tab */}
        {activeTab === 'texts' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>تعديل النصوص</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>نص حقل الاسم</Text>
              <TextInput
                style={styles.input}
                value={settings.login_name_placeholder}
                onChangeText={(text) => setSettings({ ...settings, login_name_placeholder: text })}
                onBlur={() => updateSettings({ login_name_placeholder: settings.login_name_placeholder })}
                textAlign="right"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>نص حقل الهاتف</Text>
              <TextInput
                style={styles.input}
                value={settings.login_phone_placeholder}
                onChangeText={(text) => setSettings({ ...settings, login_phone_placeholder: text })}
                onBlur={() => updateSettings({ login_phone_placeholder: settings.login_phone_placeholder })}
                textAlign="right"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>نص زر الدخول</Text>
              <TextInput
                style={styles.input}
                value={settings.login_button_text}
                onChangeText={(text) => setSettings({ ...settings, login_button_text: text })}
                onBlur={() => updateSettings({ login_button_text: settings.login_button_text })}
                textAlign="right"
              />
            </View>
          </View>
        )}

        {/* Colors Tab */}
        {activeTab === 'colors' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>تعديل الألوان</Text>

            <View style={styles.colorGroup}>
              <Text style={styles.colorLabel}>خلفية الحقول</Text>
              <View style={[styles.colorPreview, { backgroundColor: settings.login_fields_bg_color }]}>
                {settings.login_fields_bg_color === 'transparent' && <Ionicons name="grid-outline" size={14} color="#999" />}
              </View>
              <View style={styles.colorPalette}>
                {COLOR_PRESETS.map((color) => (
                  <TouchableOpacity
                    key={`field-${color}`}
                    style={[
                      styles.colorOption,
                      { backgroundColor: color === 'transparent' ? '#FFFFFF' : color },
                      settings.login_fields_bg_color === color && styles.colorSelected,
                    ]}
                    onPress={() => updateSettings({ login_fields_bg_color: color })}
                  >
                    {color === 'transparent' && <Ionicons name="grid-outline" size={18} color="#999" />}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.colorGroup}>
              <Text style={styles.colorLabel}>نص الحقول</Text>
              <View style={[styles.colorPreview, { backgroundColor: settings.login_fields_text_color }]}>
                {settings.login_fields_text_color === 'transparent' && <Ionicons name="grid-outline" size={14} color="#999" />}
              </View>
              <View style={styles.colorPalette}>
                {COLOR_PRESETS.map((color) => (
                  <TouchableOpacity
                    key={`text-${color}`}
                    style={[
                      styles.colorOption,
                      { backgroundColor: color === 'transparent' ? '#FFFFFF' : color },
                      settings.login_fields_text_color === color && styles.colorSelected,
                    ]}
                    onPress={() => updateSettings({ login_fields_text_color: color })}
                  >
                    {color === 'transparent' && <Ionicons name="grid-outline" size={18} color="#999" />}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.colorGroup}>
              <Text style={styles.colorLabel}>لون زر الدخول</Text>
              <View style={[styles.colorPreview, { backgroundColor: settings.login_button_color }]}>
                {settings.login_button_color === 'transparent' && <Ionicons name="grid-outline" size={14} color="#999" />}
              </View>
              <View style={styles.colorPalette}>
                {COLOR_PRESETS.map((color) => (
                  <TouchableOpacity
                    key={`btn-${color}`}
                    style={[
                      styles.colorOption,
                      { backgroundColor: color === 'transparent' ? '#FFFFFF' : color },
                      settings.login_button_color === color && styles.colorSelected,
                    ]}
                    onPress={() => updateSettings({ login_button_color: color })}
                  >
                    {color === 'transparent' && <Ionicons name="grid-outline" size={18} color="#999" />}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.colorGroup}>
              <Text style={styles.colorLabel}>نص زر الدخول</Text>
              <View style={[styles.colorPreview, { backgroundColor: settings.login_button_text_color }]}>
                {settings.login_button_text_color === 'transparent' && <Ionicons name="grid-outline" size={14} color="#999" />}
              </View>
              <View style={styles.colorPalette}>
                {COLOR_PRESETS.map((color) => (
                  <TouchableOpacity
                    key={`btntext-${color}`}
                    style={[
                      styles.colorOption,
                      { backgroundColor: color === 'transparent' ? '#FFFFFF' : color },
                      settings.login_button_text_color === color && styles.colorSelected,
                    ]}
                    onPress={() => updateSettings({ login_button_text_color: color })}
                  >
                    {color === 'transparent' && <Ionicons name="grid-outline" size={18} color="#999" />}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* Shapes Tab */}
        {activeTab === 'shapes' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>شكل الحقول والزر</Text>

            <Text style={styles.subLabel}>انحناء حقول الإدخال</Text>
            <View style={styles.radiusOptions}>
              {BORDER_RADIUS_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={`field-r-${opt.value}`}
                  style={[
                    styles.radiusOption,
                    { borderRadius: opt.value },
                    settings.login_fields_border_radius === opt.value && styles.radiusOptionActive,
                  ]}
                  onPress={() => updateSettings({ login_fields_border_radius: opt.value })}
                >
                  <Text style={[
                    styles.radiusText,
                    settings.login_fields_border_radius === opt.value && styles.radiusTextActive,
                  ]}>{opt.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.subLabel}>انحناء زر الدخول</Text>
            <View style={styles.radiusOptions}>
              {BORDER_RADIUS_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={`btn-r-${opt.value}`}
                  style={[
                    styles.radiusOption,
                    { borderRadius: opt.value },
                    settings.login_button_border_radius === opt.value && styles.radiusOptionActive,
                  ]}
                  onPress={() => updateSettings({ login_button_border_radius: opt.value })}
                >
                  <Text style={[
                    styles.radiusText,
                    settings.login_button_border_radius === opt.value && styles.radiusTextActive,
                  ]}>{opt.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Errors Tab */}
        {activeTab === 'errors' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>رسائل الخطأ</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>خطأ: الاسم مطلوب</Text>
              <TextInput
                style={styles.input}
                value={settings.login_error_name_required}
                onChangeText={(text) => setSettings({ ...settings, login_error_name_required: text })}
                onBlur={() => updateSettings({ login_error_name_required: settings.login_error_name_required })}
                textAlign="right"
                multiline
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>خطأ: رقم الهاتف مطلوب</Text>
              <TextInput
                style={styles.input}
                value={settings.login_error_phone_required}
                onChangeText={(text) => setSettings({ ...settings, login_error_phone_required: text })}
                onBlur={() => updateSettings({ login_error_phone_required: settings.login_error_phone_required })}
                textAlign="right"
                multiline
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>خطأ: رقم الهاتف غير صحيح</Text>
              <TextInput
                style={styles.input}
                value={settings.login_error_phone_invalid}
                onChangeText={(text) => setSettings({ ...settings, login_error_phone_invalid: text })}
                onBlur={() => updateSettings({ login_error_phone_invalid: settings.login_error_phone_invalid })}
                textAlign="right"
                multiline
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>خطأ عام</Text>
              <TextInput
                style={styles.input}
                value={settings.login_error_generic}
                onChangeText={(text) => setSettings({ ...settings, login_error_generic: text })}
                onBlur={() => updateSettings({ login_error_generic: settings.login_error_generic })}
                textAlign="right"
                multiline
              />
            </View>
          </View>
        )}
      </ScrollView>

      {isSaving && (
        <View style={styles.savingOverlay}>
          <View style={styles.savingBox}>
            <Text style={styles.savingText}>جاري الحفظ...</Text>
          </View>
        </View>
      )}
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
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: SIZES.fontLg,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  // Preview
  previewContainer: {
    alignItems: 'center',
    paddingVertical: SIZES.sm,
  },
  preview: {
    width: 120,
    height: 200,
    borderRadius: SIZES.radiusMd,
    overflow: 'hidden',
    ...SHADOWS.medium,
  },
  previewBg: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  previewContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.sm,
    gap: 4,
  },
  previewLogo: {
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
    overflow: 'hidden',
  },
  previewLogoImage: {
    width: '100%',
    height: '100%',
  },
  previewField: {
    width: '90%',
    height: 20,
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  previewFieldText: {
    fontSize: 6,
  },
  previewButton: {
    width: '90%',
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  previewButtonText: {
    fontSize: 8,
    fontWeight: 'bold',
  },
  previewLabel: {
    fontSize: SIZES.fontXs,
    color: COLORS.textSecondary,
    marginTop: SIZES.xs,
  },
  // Tabs
  tabsContainer: {
    maxHeight: 46,
  },
  tabsContent: {
    paddingHorizontal: SIZES.md,
    gap: SIZES.xs,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SIZES.xs,
    paddingHorizontal: SIZES.sm,
    borderRadius: SIZES.radiusFull,
    backgroundColor: COLORS.surface,
    gap: 4,
  },
  tabActive: {
    backgroundColor: COLORS.primary,
  },
  tabText: {
    fontSize: SIZES.fontXs,
    color: COLORS.textSecondary,
  },
  tabTextActive: {
    color: COLORS.white,
    fontWeight: '600',
  },
  content: {
    padding: SIZES.md,
    paddingBottom: SIZES.xxl,
  },
  section: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.md,
    marginBottom: SIZES.md,
  },
  sectionTitle: {
    fontSize: SIZES.fontMd,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SIZES.xs,
    textAlign: 'right',
  },
  sectionDesc: {
    fontSize: SIZES.fontSm,
    color: COLORS.textSecondary,
    marginBottom: SIZES.md,
    textAlign: 'right',
  },
  // Logo
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SIZES.sm,
  },
  emojiOption: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  emojiOptionActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '20',
  },
  emojiText: {
    fontSize: 28,
  },
  logoImageContainer: {
    position: 'relative',
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: 'hidden',
    alignSelf: 'center',
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  removeLogoBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sizeOptions: {
    flexDirection: 'row',
    gap: SIZES.sm,
    flexWrap: 'wrap',
  },
  sizeOption: {
    paddingVertical: SIZES.sm,
    paddingHorizontal: SIZES.md,
    borderRadius: SIZES.radiusMd,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sizeOptionActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  sizeText: {
    fontSize: SIZES.fontSm,
    color: COLORS.textSecondary,
  },
  sizeTextActive: {
    color: COLORS.white,
    fontWeight: '600',
  },
  // Image
  imageContainer: {
    position: 'relative',
    borderRadius: SIZES.radiusMd,
    overflow: 'hidden',
  },
  bgImage: {
    width: '100%',
    height: 150,
    borderRadius: SIZES.radiusMd,
  },
  removeImageBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadBox: {
    height: 120,
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
    borderRadius: SIZES.radiusMd,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadText: {
    fontSize: SIZES.fontSm,
    color: COLORS.primary,
    marginTop: SIZES.xs,
  },
  subLabel: {
    fontSize: SIZES.fontSm,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: SIZES.md,
    marginBottom: SIZES.sm,
    textAlign: 'right',
  },
  optionsRow: {
    flexDirection: 'row',
    gap: SIZES.sm,
  },
  optionBtn: {
    flex: 1,
    paddingVertical: SIZES.sm,
    borderRadius: SIZES.radiusMd,
    backgroundColor: COLORS.background,
    alignItems: 'center',
  },
  optionBtnActive: {
    backgroundColor: COLORS.primary,
  },
  optionText: {
    fontSize: SIZES.fontSm,
    color: COLORS.textSecondary,
  },
  optionTextActive: {
    color: COLORS.white,
    fontWeight: '600',
  },
  // Input
  inputGroup: {
    marginBottom: SIZES.md,
  },
  inputLabel: {
    fontSize: SIZES.fontSm,
    color: COLORS.textSecondary,
    marginBottom: SIZES.xs,
    textAlign: 'right',
  },
  input: {
    backgroundColor: COLORS.background,
    borderRadius: SIZES.radiusMd,
    padding: SIZES.md,
    fontSize: SIZES.fontMd,
    color: COLORS.text,
    minHeight: 48,
  },
  // Colors
  colorGroup: {
    marginBottom: SIZES.lg,
  },
  colorLabel: {
    fontSize: SIZES.fontSm,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SIZES.sm,
    textAlign: 'right',
  },
  colorPreview: {
    width: 50,
    height: 24,
    borderRadius: SIZES.radiusSm,
    marginBottom: SIZES.sm,
    alignSelf: 'flex-end',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  colorPalette: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SIZES.xs,
  },
  colorOption: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  transparentPattern: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: '#FFFFFF',
  },
  colorSelected: {
    borderWidth: 3,
    borderColor: COLORS.text,
  },
  // Radius
  radiusOptions: {
    flexDirection: 'row',
    gap: SIZES.sm,
    flexWrap: 'wrap',
  },
  radiusOption: {
    paddingVertical: SIZES.sm,
    paddingHorizontal: SIZES.md,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    minWidth: 60,
    alignItems: 'center',
  },
  radiusOptionActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  radiusText: {
    fontSize: SIZES.fontSm,
    color: COLORS.textSecondary,
  },
  radiusTextActive: {
    color: COLORS.white,
    fontWeight: '600',
  },
  // Saving
  savingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  savingBox: {
    backgroundColor: COLORS.surface,
    padding: SIZES.lg,
    borderRadius: SIZES.radiusMd,
  },
  savingText: {
    fontSize: SIZES.fontMd,
    color: COLORS.text,
  },
});
