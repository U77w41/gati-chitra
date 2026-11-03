let messageElement: HTMLElement | null = null;

export function setMessageElement(el: HTMLElement | null): void {
  messageElement = el;
}

export function showMessage(
  text: string,
  action?: { label: string; run: () => void },
): void {
  const el =
    messageElement ??
    (typeof document !== 'undefined'
      ? document.querySelector<HTMLElement>('#message')
      : null);
  if (!el) return;

  el.textContent = text;

  if (action && text) {
    el.appendChild(document.createTextNode(' '));
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = action.label;
    button.addEventListener('click', () => {
      action.run();
    });
    el.appendChild(button);
  }
}
