import { DEFAULT_AWBS, isValidAwb, normalizeAwb } from './data.js';
import { createElement, initMobileMenus } from './common.js';

const form = document.querySelector('.tracking-search--multiple');

if (form) {
  const list = form.querySelector('#awb-token-list');
  const entry = form.querySelector('#tracking-number');
  const hidden = form.querySelector('input[name="awbs"]');
  const feedback = document.querySelector('#awb-feedback');
  const submit = form.querySelector('button[type="submit"]');
  const initialValues = [...list.querySelectorAll('[data-awb]')].map(token => token.dataset.awb);
  let awbs = initialValues.length ? initialValues : DEFAULT_AWBS.slice(0, 3);

  const announce = (message, isError = false) => {
    feedback.textContent = message;
    feedback.classList.toggle('form-message--error', isError);
  };

  const sync = () => {
    hidden.value = awbs.join(',');
    submit.disabled = awbs.length === 0;
  };

  const render = () => {
    list.querySelectorAll('.awb-token').forEach(token => token.remove());
    awbs.forEach(awb => {
      const token = createElement('span', 'awb-token', awb);
      token.dataset.awb = awb;
      token.setAttribute('role', 'listitem');
      const remove = createElement('button', '', '×');
      remove.type = 'button';
      remove.dataset.removeAwb = awb;
      remove.setAttribute('aria-label', `Hapus ${awb}`);
      token.append(remove);
      list.insertBefore(token, hidden);
    });
    sync();
  };

  const addValues = rawValues => {
    const candidates = rawValues.map(normalizeAwb).filter(Boolean);
    const invalid = candidates.filter(value => !isValidAwb(value));
    if (invalid.length) {
      announce(`Format tidak sesuai: ${invalid.join(', ')}. Gunakan format ANT-FRZ-0002.`, true);
      return false;
    }

    const uniqueNew = candidates.filter(value => !awbs.includes(value));
    if (awbs.length + uniqueNew.length > 10) {
      announce('Maksimal 10 nomor AWB dalam satu pencarian.', true);
      return false;
    }

    awbs = [...awbs, ...uniqueNew];
    entry.value = '';
    render();
    announce(uniqueNew.length ? `${uniqueNew.length} AWB ditambahkan.` : 'AWB tersebut sudah ada dalam daftar.');
    return true;
  };

  const commitEntry = () => {
    const raw = entry.value.trim();
    return raw ? addValues(raw.split(/[\s,;]+/)) : true;
  };

  entry.addEventListener('keydown', event => {
    if (event.key === ',' || event.key === 'Enter') {
      event.preventDefault();
      commitEntry();
    }
  });

  entry.addEventListener('paste', event => {
    const pasted = event.clipboardData.getData('text');
    if (/[\s,;]/.test(pasted)) {
      event.preventDefault();
      addValues(pasted.split(/[\s,;]+/));
    }
  });

  entry.addEventListener('blur', commitEntry);

  list.addEventListener('click', event => {
    const button = event.target.closest('[data-remove-awb]');
    if (!button) return;
    awbs = awbs.filter(awb => awb !== button.dataset.removeAwb);
    render();
    announce(`${button.dataset.removeAwb} dihapus.`);
    entry.focus();
  });

  form.addEventListener('submit', event => {
    if (!commitEntry() || awbs.length === 0) {
      event.preventDefault();
      if (awbs.length === 0) announce('Masukkan minimal satu nomor AWB.', true);
      entry.focus();
      return;
    }
    submit.disabled = true;
    submit.textContent = 'Menyiapkan hasil…';
  });

  render();
}

initMobileMenus();
