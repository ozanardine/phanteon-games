// src/lib/utils/dateUtils.ts

/**
 * Formata uma data para formato brasileiro
 */
export const formatDateBR = (date: Date | string): string => {
    const d = new Date(date);
    return d.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };
  
  /**
   * Formata uma data e hora para formato brasileiro
   */
  export const formatDateTimeBR = (date: Date | string): string => {
    const d = new Date(date);
    return d.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  /**
   * Calcula tempo restante entre duas datas e retorna formatado
   */
  export const formatTimeRemaining = (endDate: Date | string): string => {
    const end = new Date(endDate).getTime();
    const now = new Date().getTime();
    
    const diff = end - now;
    
    // Se já passou
    if (diff <= 0) {
      return 'Expirado';
    }
    
    // Converter para segundos, minutos, horas, dias
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
      return `${days} dia${days > 1 ? 's' : ''}`;
    } else if (hours > 0) {
      return `${hours} hora${hours > 1 ? 's' : ''}`;
    } else if (minutes > 0) {
      return `${minutes} minuto${minutes > 1 ? 's' : ''}`;
    } else {
      return `${seconds} segundo${seconds > 1 ? 's' : ''}`;
    }
  };
  
  /**
   * Calcula a próxima data de wipe do servidor
   * Force wipes ocorrem toda primeira quinta-feira do mês
   */
  export const getNextWipeDate = (): Date => {
    const today = new Date();
    let month = today.getMonth();
    let year = today.getFullYear();
    
    // Avança para o próximo mês se já passamos da primeira quinta-feira
    const firstDay = new Date(year, month, 1);
    const firstThursday = new Date(firstDay);
    
    // Ajusta para a primeira quinta-feira (4 = quinta)
    firstThursday.setDate(firstDay.getDate() + ((4 + 7 - firstDay.getDay()) % 7));
    
    if (today > firstThursday) {
      month += 1;
      if (month > 11) {
        month = 0;
        year += 1;
      }
    }
    
    // Calcula a primeira quinta-feira do próximo mês
    const nextFirstDay = new Date(year, month, 1);
    const nextWipeDate = new Date(nextFirstDay);
    nextWipeDate.setDate(nextFirstDay.getDate() + ((4 + 7 - nextFirstDay.getDay()) % 7));
    
    return nextWipeDate;
  };