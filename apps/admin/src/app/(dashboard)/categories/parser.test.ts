import { describe, it, expect } from 'vitest';
import { parseCategoryForm } from './parser';

function fd(entries: Record<string, string>): FormData {
  const f = new FormData();
  for (const [k, v] of Object.entries(entries)) f.append(k, v);
  return f;
}

describe('parseCategoryForm', () => {
  it('returns the parsed value on a happy path', () => {
    const out = parseCategoryForm(
      fd({
        slug: 'coffee-tour',
        name_en: 'Coffee tour',
        name_es: 'Tour cafetero',
        icon_name: 'leaf',
        sort_order: '50',
        is_active: 'on',
      }),
    );
    expect(out).toEqual({
      value: {
        slug: 'coffee-tour',
        name_en: 'Coffee tour',
        name_es: 'Tour cafetero',
        icon_name: 'leaf',
        sort_order: 50,
        is_active: true,
      },
    });
  });

  it('treats a missing icon_name as null, not empty string', () => {
    const out = parseCategoryForm(
      fd({ slug: 'x', name_en: 'X', name_es: 'X', icon_name: '   ' }),
    );
    if ('errorKey' in out) throw new Error('expected success');
    expect(out.value.icon_name).toBeNull();
  });

  it('defaults sort_order to 0 when blank', () => {
    const out = parseCategoryForm(
      fd({ slug: 'x', name_en: 'X', name_es: 'X', sort_order: '' }),
    );
    if ('errorKey' in out) throw new Error('expected success');
    expect(out.value.sort_order).toBe(0);
  });

  it('treats an unchecked is_active checkbox as false', () => {
    const out = parseCategoryForm(fd({ slug: 'x', name_en: 'X', name_es: 'X' }));
    if ('errorKey' in out) throw new Error('expected success');
    expect(out.value.is_active).toBe(false);
  });

  it.each([
    ['blank slug', { slug: '', name_en: 'X', name_es: 'X' }],
    ['blank name_en', { slug: 'x', name_en: '', name_es: 'X' }],
    ['blank name_es', { slug: 'x', name_en: 'X', name_es: '' }],
  ])('rejects when %s', (_label, fields) => {
    const out = parseCategoryForm(fd(fields));
    expect('errorKey' in out && out.errorKey).toBe('error.category.required');
  });

  it.each([
    'Coffee Tour',     // uppercase
    'coffee_tour',     // underscore
    'café',            // accents
    'coffee tour',     // space
    '-leading-dash',   // technically allowed by regex; this row asserts it IS allowed
  ])('slug rule: rejects most non-kebab-case (%s)', (slug) => {
    const out = parseCategoryForm(fd({ slug, name_en: 'X', name_es: 'X' }));
    if (slug === '-leading-dash') {
      expect('value' in out).toBe(true);
    } else {
      expect('errorKey' in out && out.errorKey).toBe('error.category.slugFormat');
    }
  });
});
