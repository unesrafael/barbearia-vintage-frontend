export const STATUS = {
  AGENDADO: { label: 'Agendado', color: 'var(--agendado)' },
  CONCLUIDO: { label: 'Concluído', color: 'var(--concluido)' },
  CANCELADO: { label: 'Cancelado', color: 'var(--cancelado)' },
  NAO_COMPARECEU: { label: 'Não compareceu', color: 'var(--faltou)' },
};

export const STATUS_KEYS = Object.keys(STATUS);

export const brl = (cents) =>
  (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

/**
 * Fuso da barbearia — o mesmo que o backend usa para interpretar data + horário.
 * Ancorar aqui (em vez de usar o fuso do navegador) mantem a agenda coerente
 * mesmo se alguem abrir o sistema de outro pais ou com o relogio desconfigurado.
 */
export const SHOP_TZ = import.meta.env.VITE_TIMEZONE ?? 'America/Sao_Paulo';

/** Data de hoje na barbearia, no formato do <input type="date">. */
export function today() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: SHOP_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

const capitalize = (text) => text.charAt(0).toUpperCase() + text.slice(1);

export function addDays(dateStr, days) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

/** "Quinta-feira, 27 de agosto" — o titulo do dia na agenda. */
export function longDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return capitalize(
    new Intl.DateTimeFormat('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      timeZone: 'UTC',
    }).format(new Date(Date.UTC(y, m - 1, d)))
  );
}

export function shortDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(y, m - 1, d)));
}

export function relativeDayLabel(dateStr) {
  const now = today();
  if (dateStr === now) return 'Hoje';
  if (dateStr === addDays(now, -1)) return 'Ontem';
  if (dateStr === addDays(now, 1)) return 'Amanha';
  return null;
}
