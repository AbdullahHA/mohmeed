const USERNAME_PATTERN = /^[a-z0-9_]+$/;

/** Strips anything that isn't an English letter, digit, or underscore, and lowercases. */
export function sanitizeUsernameInput(raw: string): string {
  return raw.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
}

export function isValidUsername(username: string): boolean {
  return USERNAME_PATTERN.test(username);
}

export const USERNAME_RULE_MESSAGE = 'اسم المستخدم لازم يكون بالإنجليزي فقط (حروف وأرقام و _ )، بدون مسافات أو حروف عربية.';
