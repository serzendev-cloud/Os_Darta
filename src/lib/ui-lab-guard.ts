/**
 * UI Lab Environment Security Guard
 * 
 * Strict Rule:
 * /ui-lab is ONLY available when VERCEL_ENV !== 'production'.
 * If VERCEL_ENV is undefined, empty, or unreadable, it MUST strictly be treated as 'production' (fail-closed).
 */

export function isUiLabAllowed(pathname?: string): boolean {
  if (pathname && pathname !== '/ui-lab' && pathname !== '/ui-lab/') {
    return false;
  }
  const vercelEnv = process.env.VERCEL_ENV;
  // If undefined, empty, or equals 'production', fail closed
  if (!vercelEnv || vercelEnv.trim() === '' || vercelEnv === 'production') {
    return false;
  }
  return true;
}

