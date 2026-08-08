export type ServiceStatus = "up" | "down" | "degraded";

export interface Service {
  name: string;
  status: ServiceStatus;
  message: string;
  updated: string;
}

export interface StatusData {
  title: string;
  url: string;
  services: Service[];
}
