import { MESSAGES } from '../core/constants';
import { loadTemplate, loadTemplateIndex } from '../share/templates';
import type { CommitSource } from './state';

export interface GalleryEnv {
  dialogEl: HTMLDialogElement;
  btnTemplates: HTMLButtonElement;
  baseUrl: string;
  commit: (text: string, source: CommitSource) => void;
  triggerFit: () => void;
  messageEl: HTMLElement;
}

export function setupGallery(env: GalleryEnv): void {
  const { dialogEl, btnTemplates, baseUrl, commit, triggerFit, messageEl } = env;
  btnTemplates.disabled = false;

  const closeBtn = dialogEl.querySelector<HTMLButtonElement>('#gallery-close');
  const listEl = dialogEl.querySelector<HTMLElement>('#gallery-list') ?? dialogEl;

  function close(): void {
    if (dialogEl.close) dialogEl.close();
    else dialogEl.removeAttribute('open');
    btnTemplates.focus();
  }

  dialogEl.addEventListener('close', () => {
    btnTemplates.focus();
  });

  closeBtn?.addEventListener('click', close);

  let templatesLoaded = false;
  async function loadAndPopulate(): Promise<void> {
    if (templatesLoaded) return;
    const items = await loadTemplateIndex(baseUrl);
    listEl.innerHTML = '';
    for (const item of items) {
      const btn = document.createElement('button');
      btn.className = 'template';
      btn.textContent = item.title;
      btn.addEventListener('click', async () => {
        const text = await loadTemplate(baseUrl, item);
        if (!text) {
          messageEl.textContent = MESSAGES.shareInvalid;
          return;
        }
        commit(text, 'template');
        triggerFit();
        close();
      });
      listEl.appendChild(btn);
    }
    templatesLoaded = true;
  }

  loadAndPopulate();

  btnTemplates.addEventListener('click', async () => {
    await loadAndPopulate();
    if (dialogEl.showModal) dialogEl.showModal();
    else dialogEl.setAttribute('open', '');
    closeBtn?.focus();
  });
}
