import {
  Package,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  Truck,
  ArrowUpRight,
  ArrowDownLeft
} from 'lucide-react';

export type ShipmentStatus = 'pending' | 'in_transit' | 'at_hub' | 'delivered' | 'cancelled';

export interface Shipment {
  id: string;
  trackingNumber: string;
  sender: string;
  recipient: string;
  originHub: string;
  destinationHub: string;
  status: ShipmentStatus;
  date: string;
  category: string;
  weight: string;
  estimatedDelivery?: string;
}

export interface HubPoint {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  rating: number;
  openingHours: string;
  services: string[];
  type: 'pharmacy' | 'supermarket' | 'logistics_center' | 'other';
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'shipment' | 'system' | 'promotion';
  isRead: boolean;
}

export interface SavedAddress {
  id: string;
  userId: string;
  label: string; // Home, Office, etc.
  name: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  isDefault: boolean;
  type?: 'home' | 'work' | 'other';
}

export interface Transaction {
  id: string;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  date: string;
  status: 'completed' | 'pending' | 'failed';
}
