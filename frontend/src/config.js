import { parseSettings } from './lib/settings';
import { UserError } from './lib/errors';

export const { config, errors: configErrors } = parseSettings(import.meta.env);

export function requireConfig() {
  if (configErrors.length) throw new UserError('Registry setup is incomplete. Follow the configuration notice on this page.');
  return config;
}
