export function formatDate(date: string | Date): string {
    if (!date) return '';
    
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(dateObj);
  }
  
  export function formatDateTime(date: string | Date): string {
    if (!date) return '';
    
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(dateObj);
  }
  
  export function isExpired(date: string | Date): boolean {
    if (!date) return true;
    
    const expirationDate = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    
    return expirationDate < now;
  }
  
  export function daysRemaining(date: string | Date): number {
    if (!date) return 0;
    
    const expirationDate = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    
    // Se já expirou, retorna 0
    if (expirationDate < now) return 0;
    
    const diffTime = expirationDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  }