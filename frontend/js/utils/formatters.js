window.AprovaUtils = {
  showToast(message, color = '#22c55e') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const el = document.createElement('div');
    el.className = 'toast-msg';
    el.style.borderLeftColor = color;
    el.innerHTML = message;
    container.appendChild(el);
    setTimeout(() => {
      el.style.opacity = '0';
      setTimeout(() => el.remove(), 220);
    }, 3400);
  },

  getStatusBadgeClass(status) {
    if (status === 'aberto') return 'badge-aberto';
    if (status === 'previsto') return 'badge-previsto';
    return 'badge-encerrado';
  },

  getStatusDot(status) {
    if (status === 'aberto') return '🟢';
    if (status === 'previsto') return '🟡';
    return '🔵';
  }
};

