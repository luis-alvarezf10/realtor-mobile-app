// Tipos para la aplicación Go Hunter Realtor

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'agent' | 'supervisor' | 'admin';
  company?: string;
}

export interface Property {
  id: string;
  title: string;
  description: string;
  price: number;
  status: 'available' | 'reserved' | 'sold';
  type: 'house' | 'apartment' | 'commercial' | 'land';
  address: string;
  latitude?: number;
  longitude?: number;
  agentId: string;
  images: string[];
  createdAt: string;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  agentId: string;
  propertiesInterested: string[];
  createdAt: string;
}

export interface Appointment {
  id: string;
  clientId: string;
  propertyId: string;
  agentId: string;
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
  locationVerified?: boolean;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'appointment' | 'system' | 'report';
  title: string;
  message: string;
  date: string;
  read: boolean;
}

export interface SalesReport {
  agentId: string;
  period: 'week' | 'month' | 'year';
  totalSales: number;
  totalAmount: number;
  conversionRate: number;
  appointmentsCompleted: number;
}
