import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { useCartStore } from '../store/cartStore';

interface Product {
  id: string;
  name: string;
  price: number;
  original_price?: number;
  image?: string;
  category: string;
  is_new?: boolean;
  is_discount?: boolean;
  unit?: string;
  quantity_per_unit?: string;
}

interface ProductCardProps {
  product: Product;
  onPress?: () => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onPress }) => {
  const { addItem } = useCartStore();

  const handleAddToCart = () => {
    addItem({
      product_id: product.id,
      product_name: product.name,
      price: product.price,
      image: product.image,
    });
  };

  const hasDiscount = product.original_price && product.original_price > product.price;
  const discountPercent = hasDiscount
    ? Math.round(((product.original_price! - product.price) / product.original_price!) * 100)
    : 0;

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.imageContainer}>
        {product.image ? (
          <Image
            source={{ uri: product.image.startsWith('data:') ? product.image : `data:image/jpeg;base64,${product.image}` }}
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.placeholderImage}>
            <Ionicons name="cube-outline" size={40} color={COLORS.textLight} />
          </View>
        )}
        
        {product.is_new && (
          <View style={styles.newBadge}>
            <Text style={styles.badgeText}>جديد</Text>
          </View>
        )}
        
        {hasDiscount && (
          <View style={styles.discountBadge}>
            <Text style={styles.badgeText}>-{discountPercent}%</Text>
          </View>
        )}
      </View>

      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={2}>{product.name}</Text>
        
        {product.quantity_per_unit && (
          <Text style={styles.unit}>{product.quantity_per_unit}</Text>
        )}
        
        <View style={styles.priceRow}>
          <View style={styles.prices}>
            <Text style={styles.price}>{product.price.toFixed(2)} درهم</Text>
            {hasDiscount && (
              <Text style={styles.originalPrice}>{product.original_price?.toFixed(2)} درهم</Text>
            )}
          </View>
          
          <TouchableOpacity style={styles.addButton} onPress={handleAddToCart}>
            <Ionicons name="add" size={20} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radiusLg,
    overflow: 'hidden',
    marginBottom: SIZES.md,
    ...SHADOWS.small,
  },
  imageContainer: {
    position: 'relative',
    height: 120,
    backgroundColor: COLORS.background,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  newBadge: {
    position: 'absolute',
    top: SIZES.sm,
    left: SIZES.sm,
    backgroundColor: COLORS.primary,
    paddingHorizontal: SIZES.sm,
    paddingVertical: SIZES.xs,
    borderRadius: SIZES.radiusSm,
  },
  discountBadge: {
    position: 'absolute',
    top: SIZES.sm,
    right: SIZES.sm,
    backgroundColor: COLORS.error,
    paddingHorizontal: SIZES.sm,
    paddingVertical: SIZES.xs,
    borderRadius: SIZES.radiusSm,
  },
  badgeText: {
    color: COLORS.white,
    fontSize: SIZES.fontXs,
    fontWeight: 'bold',
  },
  content: {
    padding: SIZES.sm,
  },
  name: {
    fontSize: SIZES.fontMd,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SIZES.xs,
    textAlign: 'right',
  },
  unit: {
    fontSize: SIZES.fontSm,
    color: COLORS.textSecondary,
    marginBottom: SIZES.xs,
    textAlign: 'right',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  prices: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.sm,
  },
  price: {
    fontSize: SIZES.fontLg,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  originalPrice: {
    fontSize: SIZES.fontSm,
    color: COLORS.textLight,
    textDecorationLine: 'line-through',
  },
  addButton: {
    backgroundColor: COLORS.primary,
    width: 32,
    height: 32,
    borderRadius: SIZES.radiusFull,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
