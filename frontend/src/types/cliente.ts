export interface Cliente {
  id: number;
  nombre: string;
  telefono: string | null;
  direccion: string | null;
  observaciones: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ClienteFormData {
  nombre: string;
  telefono: string;
  direccion: string;
  observaciones: string;
}