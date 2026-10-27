import { randomUUID } from 'crypto';

export function generateSlug(name: string): string {
  const base =
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'workspace';
  const suffix = randomUUID().replace(/-/g, '').slice(0, 12);
  return `${base}-${suffix}`;
}
