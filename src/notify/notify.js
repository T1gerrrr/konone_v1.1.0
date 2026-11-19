// Hệ thống thông báo thay cho alert()/confirm() của trình duyệt ("localhost says").
// Dùng được ở bất kỳ đâu (kể cả ngoài component):
//   notify('Đã lưu!', 'success')        // 'success' | 'error' | 'info'
//   const ok = await confirmDialog({ title, message, confirmText, cancelText })

const listeners = new Set();
let seq = 0;

function emit(event) {
  listeners.forEach((fn) => fn(event));
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function notify(message, type = 'info', duration = 4200) {
  emit({ kind: 'toast', id: ++seq, message: String(message ?? ''), type, duration });
}

export const notifySuccess = (m) => notify(m, 'success');
export const notifyError = (m) => notify(m, 'error', 6000);

export function confirmDialog(opts = {}) {
  return new Promise((resolve) => {
    emit({ kind: 'confirm', id: ++seq, ...opts, resolve });
  });
}
