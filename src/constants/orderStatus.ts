import { OrderStatus } from '../types';

export const ORDER_STATUS_MAP: Record<OrderStatus, { label: string; color: string; description: string }> = {
  pending: { label: 'Onay Bekliyor', color: 'yellow', description: 'Siparişiniz alındı, onay bekleniyor' },
  confirmed: { label: 'Onaylandı', color: 'blue', description: 'Siparişiniz onaylandı' },
  processing: { label: 'Hazırlanıyor', color: 'indigo', description: 'Siparişiniz hazırlanıyor' },
  shipped: { label: 'Kargoya Verildi', color: 'purple', description: 'Siparişiniz kargoya verildi' },
  delivered: { label: 'Teslim Edildi', color: 'green', description: 'Siparişiniz teslim edildi' },
  cancelled: { label: 'İptal Edildi', color: 'red', description: 'Sipariş iptal edildi' },
  refunded: { label: 'İade Edildi', color: 'gray', description: 'Sipariş iade edildi' },
};

export const CANCELLABLE_STATUSES: OrderStatus[] = ['pending', 'confirmed'];

export const ORDER_STATUS_FLOW: Record<OrderStatus, OrderStatus[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['processing', 'cancelled', 'pending'],
  processing: ['shipped', 'cancelled', 'confirmed'],
  shipped: ['delivered', 'processing'],
  delivered: ['refunded', 'shipped'],
  cancelled: ['pending'],
  refunded: [],
};
