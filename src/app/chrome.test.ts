import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import * as chrome from './chrome';

const { headerHtml } = chrome;

describe('chrome', () => {
  describe('headerHtml', () => {
    it('produces valid header HTML with expected brand and nav items', () => {
      const h = headerHtml();
      expect(h).toContain('class="brand-name">Gati Chitra<');
      expect(h).toContain('aria-label="Gati-chitra home"');
      expect(h).toContain('id="theme-toggle"');
      expect(h).toContain('id="btn-install"');
      expect(h).toContain('id="btn-help"');
      expect(h).toContain('aria-label="Main"');
      expect(h).toContain('href="https://u77w41.github.io/resume/"');
      expect(h).toContain('Support my work');
      expect(h).toContain('href="https://u77w41.github.io/diff-checker/"');
      expect(h).toContain('href="https://u77w41.github.io/anurup/"');
      expect(h).toContain('ANURUP');
      expect(h).toContain('Privacy-first photo &amp; PDF tools for online forms');
      expect(h).toContain('stroke="currentColor"');
      expect(h).toContain('class="heart-icon"');
      expect(h).toContain('aria-expanded="false"');
      expect(h).toContain(' hidden>');

      // Icons only, with each name in a label that shows on hover.
      for (const name of ['Install', 'Help', 'My Other Tools', 'Hire Me', 'Support my work', 'Theme']) {
        expect(h).toContain(`<span class="action-label">${name}</span>`);
      }
      expect(h).not.toContain('nav-label');

      expect(h).not.toContain('#000000');
      expect(h).not.toContain('Privacy-first photo & PDF');
    });
  });

  describe('no footer', () => {
    // The owner removed the site footer so the studio runs to the bottom of the window.
    it('the page has no footer element and the chrome module builds none', () => {
      expect(readFileSync('index.html', 'utf8')).not.toMatch(/<footer\b/);
      expect(Object.keys(chrome)).not.toContain('footerHtml');
      expect(Object.keys(chrome)).not.toContain('copyrightText');
    });
  });
});
