import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { getStatusInfo } from '../constants/orderStatus';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface OrderCardProps {
  order: {
    id: string;
    customer_name: string;
    customer_phone: string;
    items: Array<{ product_name: string; quantity: number; price: number }>;
    total: number;
    status: string;
    created_at: string;
    delivery_address?: string;
  };
  onPress?: () => void;
  showCustomer?: boolean;
}

export const OrderCard: React.FC<OrderCardProps> = ({ order, onPress, showCustomer = false }) => {
  const statusInfo = getStatusInfo(order.status);
  const formattedDate = format(new Date(order.created_at), 'dd MMM yyyy - HH:mm', { locale: ar });

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.header}>
        <View style={[styles.statusBadge, { backgroundColor: statusInfo.color }]}>
          <Ionicons name={statusInfo.icon as any} size={14} color={COLORS.white} />
          <Text style={styles.statusText}>{statusInfo.label}</Text>
        </View>
        <Text style={styles.orderId}>#{order.id.slice(-6)}</Text>
      </View>

      {showCustomer && (
        <View style={styles.customerRow}>
          <Ionicons name="person-outline" size={16} color={COLORS.textSecondary} />
          <Text style={styles.customerName}>{order.customer_name || order.customer_phone}</Text>
        </View>
      )}

      <View style={styles.itemsContainer}>
        {order.items.slice(0, 3).map((item, index) => (
          <Text key={index} style={styles.itemText}>
            {item.quantity}x {item.product_name}
          </Text>
        ))}
        {order.items.length > 3 && (
          <Text style={styles.moreItems}>+{order.items.length - 3} منتجات أخرى</Text>
        )}
      </View>

      <View style={styles.footer}>
        <Text style={styles.date}>{formattedDate}</Text>
        <Text style={styles.total}>{order.total.toFixed(2)} €</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.md,
    marginBottom: SIZES.md,
    ...SHADOWS.small,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.sm,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SIZES.sm,
    paddingVertical: SIZES.xs,
    borderRadius: SIZES.radiusFull,
    gap: 4,
  },
  statusText: {
    color: COLORS.white,
    fontSize: SIZES.fontSm,
    fontWeight: '600',
  },
  orderId: {
    fontSize: SIZES.fontSm,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.xs,
    marginBottom: SIZES.sm,
  },
  customerName: {
    fontSize: SIZES.fontMd,
    color: COLORS.text,
    fontWeight: '500',
  },
  itemsContainer: {
    paddingVertical: SIZES.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  itemText: {
    fontSize: SIZES.fontMd,
    color: COLORS.text,
    marginBottom: SIZES.xs,
    textAlign: 'right',
  },
  moreItems: {
    fontSize: SIZES.fontSm,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    textAlign: 'right',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: SIZES.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  date: {
    fontSize: SIZES.fontSm,
    color: COLORS.textSecondary,
  },
  total: {
    fontSize: SIZES.fontLg,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
});
