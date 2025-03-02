export function formatDate(date: string | Date | undefined | null): string {
  if (!date) return '';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(dateObj);
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
}

export function formatDateTime(date: string | Date | undefined | null): string {
  if (!date) return '';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(dateObj);
  } catch (error) {
    console.error('Error formatting date time:', error);
    return '';
  }
}

export function isExpired(date: string | Date | undefined | null): boolean {
  if (!date) return true;
  
  try {
    const expirationDate = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    
    return expirationDate < now;
  } catch (error) {
    console.error('Error checking if date is expired:', error);
    return true;
  }
}

export function daysRemaining(date: string | Date | undefined | null): number {
  if (!date) return 0;
  
  try {
    const expirationDate = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    
    // Se já expirou, retorna 0
    if (expirationDate < now) return 0;
    
    const diffTime = expirationDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  } catch (error) {
    console.error('Error calculating days remaining:', error);
    return 0;
  }
}