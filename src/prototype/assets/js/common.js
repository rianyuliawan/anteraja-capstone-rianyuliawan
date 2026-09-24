export const formatTemperature = value => `${value < 0 ? '−' : '+'}${Math.abs(value).toFixed(1).replace('.', ',')}°C`;

export const thermalState = (value, normalLow, normalHigh) => {
  if (value >= normalLow && value <= normalHigh) return { key: 'normal', label: 'Normal' };
  if (value > 0 || value < normalLow - 3) return { key: 'critical', label: 'Kritis' };
  return { key: 'warning', label: 'Perlu perhatian' };
};

export const createElement = (tag, className, text) => {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
};

let toastTimer;
export const notify = (message, type = 'success') => {
  let region = document.querySelector('#toast-region');
  if (!region) {
    region = createElement('div', 'toast-region');
    region.id = 'toast-region';
    region.setAttribute('aria-live', 'polite');
    region.setAttribute('aria-atomic', 'true');
    document.body.append(region);
  }

  clearTimeout(toastTimer);
  const toast = createElement('div', `toast toast--${type}`);
  toast.setAttribute('role', type === 'error' ? 'alert' : 'status');
  const icon = createElement('span', 'toast__icon', type === 'error' ? '!' : type === 'warning' ? 'i' : '✓');
  icon.setAttribute('aria-hidden', 'true');
  const copy = createElement('p', 'toast__message', message);
  const close = createElement('button', 'toast__close', '×');
  close.type = 'button';
  close.setAttribute('aria-label', 'Tutup notifikasi');
  close.addEventListener('click', () => toast.remove());
  toast.append(icon, copy, close);
  region.replaceChildren(toast);
  requestAnimationFrame(() => toast.classList.add('is-visible'));
  toastTimer = setTimeout(() => {
    toast.classList.remove('is-visible');
    setTimeout(() => toast.remove(), 180);
  }, type === 'error' ? 5200 : 3600);
};

export const initMobileMenus = () => {
  document.querySelectorAll('.mobile-menu').forEach(menu => {
    menu.querySelectorAll('a').forEach(link => link.addEventListener('click', () => menu.removeAttribute('open')));
  });
};

export const copyText = async value => {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const input = createElement('textarea');
  input.value = value;
  input.setAttribute('readonly', '');
  input.className = 'visually-hidden';
  document.body.append(input);
  input.select();
  document.execCommand('copy');
  input.remove();
};

export const getRequestedAwbs = () => {
  const params = new URLSearchParams(window.location.search);
  const combined = [params.get('awbs'), params.get('awb'), params.get('awb_entry')]
    .filter(Boolean)
    .join(',');

  return [...new Set(combined.split(/[\s,;]+/).map(value => value.trim().toUpperCase()).filter(Boolean))].slice(0, 10);
};
