export interface PublicRuntimeConfig {
  clerkPublishableKey: string | null;
}

const PRODUCTION_APP_ORIGIN = 'https://news-to-social.vercel.app';

let runtimeConfig: PublicRuntimeConfig = {
  clerkPublishableKey: import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || null,
};

function isProtectedPreviewHost(hostname: string): boolean {
  return (
    hostname.endsWith('.vercel.app') &&
    hostname.includes('news-to-social-') &&
    hostname !== 'news-to-social.vercel.app'
  );
}

export function getPreferredAppOrigin(): string {
  if (typeof window === 'undefined') {
    return PRODUCTION_APP_ORIGIN;
  }

  const { origin, hostname } = window.location;
  return isProtectedPreviewHost(hostname) ? PRODUCTION_APP_ORIGIN : origin;
}

export async function loadRuntimeConfig(): Promise<PublicRuntimeConfig> {
  if (typeof window === 'undefined') {
    return runtimeConfig;
  }

  try {
    let response = await fetch('/api/public-config', {
      credentials: 'same-origin',
    });

    if (!response.ok && getPreferredAppOrigin() !== window.location.origin) {
      response = await fetch(`${getPreferredAppOrigin()}/api/public-config`, {
        credentials: 'omit',
      });
    }

    if (!response.ok) {
      return runtimeConfig;
    }

    const data = await response.json();
    runtimeConfig = {
      ...runtimeConfig,
      clerkPublishableKey: data?.clerkPublishableKey || runtimeConfig.clerkPublishableKey,
    };
  } catch {
    // Keep build-time fallback if runtime config is unavailable.
  }

  return runtimeConfig;
}

export function getRuntimeConfig(): PublicRuntimeConfig {
  return runtimeConfig;
}

export function isClerkEnabled(): boolean {
  return Boolean(runtimeConfig.clerkPublishableKey);
}

export function getClerkPublishableKey(): string | null {
  return runtimeConfig.clerkPublishableKey;
}
