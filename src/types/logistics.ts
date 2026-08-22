export enum JobStatus {
  PENDING = 'PENDING',
  ASSIGNED = 'ASSIGNED',
  IN_TRANSIT = 'IN_TRANSIT',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  EXCEPTION = 'EXCEPTION'
}

export enum VehicleStatus {
  ACTIVE = 'ACTIVE',
  MAINTENANCE = 'MAINTENANCE',
  INACTIVE = 'INACTIVE',
  ON_ROUTE = 'ON_ROUTE'
}

export enum DriverStatus {
  ONLINE = 'ONLINE',
  OFFLINE = 'OFFLINE',
  ON_DUTY = 'ON_DUTY',
  BREAK = 'BREAK'
}

export interface TransportJob {
  id: string;
  jobNumber: string;
  origin: string;
  destination: string;
  driverId?: string;
  driverName?: string;
  vehicleId?: string;
  status: JobStatus;
  priority: 'NORMAL' | 'URGENT' | 'CRITICAL';
  parcelCount: number;
  parcelIds?: string[];
  estimatedTime: string;
  createdAt: string;
}

export interface Vehicle {
  id: string;
  make: string;
  model: string;
  plateNumber: string;
  type: 'BIKE' | 'VAN' | 'TRUCK';
  status: VehicleStatus;
  lastMaintenance: string;
}

export interface Driver {
  id: string;
  name: string;
  phone: string;
  status: DriverStatus;
  assignedVehicleId?: string;
  rating: number;
  completedJobs: number;
}

export interface RouteStop {
  id: string;
  pointName: string;
  address: string;
  type: 'PICKUP' | 'DROPOFF';
  status: 'PENDING' | 'COMPLETED' | 'SKIPPED';
  parcelIds: string[];
}

export interface AssignedRoute {
  id: string;
  name: string;
  stops: RouteStop[];
  estimatedDistance: string;
  estimatedTime: string;
}
