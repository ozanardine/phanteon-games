// Definições de tipos para resolver conflitos potenciais
declare module '@/components/ui/Alert' {
  type AlertVariant = 'info' | 'success' | 'warning' | 'error';

  export interface AlertProps {
    variant?: AlertVariant;
    title?: string;
    children: React.ReactNode;
    onClose?: () => void;
    className?: string;
  }

  export const Alert: React.FC<AlertProps>;
}

declare module '@/components/layout/ProtectedRoute' {
  interface ProtectedRouteProps {
    children: React.ReactNode;
    adminOnly?: boolean;
  }

  const ProtectedRoute: React.FC<ProtectedRouteProps>;
  export default ProtectedRoute;
}