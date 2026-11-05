import { describe, it, expect } from 'vitest';
import { copyrightText, headerHtml, footerHtml } from './chrome';

describe('chrome', () => {
  describe('copyrightText', () => {
    it('formats copyright based on year', () => {
      expect(copyrightText(2026)).toBe('© 2026 Ujjwal Chowdhury');
      expect(copyrightText(2027)).toBe('© 2026 – 2027 Ujjwal Chowdhury');
      expect(copyrightText(2020)).toBe('© 2026 Ujjwal Chowdhury');
    });
  });

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

      expect(h).not.toContain('#000000');
      expect(h).not.toContain('Privacy-first photo & PDF');
    });
  });

  describe('footerHtml', () => {
    it('produces valid footer HTML with expected links', () => {
      const f = footerHtml(2026, 'https://github.com/U77w41/gati-chitra');
      expect(f).toContain('© 2026 Ujjwal Chowdhury');
      expect(f).toContain('Runs entirely in your browser');
      expect(f).toContain('aria-label="Footer"');
      expect(f).toContain('>Hire Me<');
      expect(f).toContain('>Diff Checker<');
      expect(f).toContain('>Anurup<');
      expect(f).toContain('>Source<');
      expect(f).toContain('href="https://github.com/U77w41/gati-chitra"');
      expect(f).toContain('data-testid="support-link-footer"');
      expect(f).toContain('Support my work');
    });
  });
});
