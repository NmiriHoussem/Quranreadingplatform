import { projectId, publicAnonKey } from '../../../utils/supabase/info';

const LOGO_KEY = 'app_logo_base64';
const LOGO_SVG = `<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="512" height="512" rx="128" fill="#059669"/>
  
  <!-- Book/Quran Shape -->
  <path d="M128 96C128 78.3269 142.327 64 160 64H352C369.673 64 384 78.3269 384 96V416C384 433.673 369.673 448 352 448H160C142.327 448 128 433.673 128 416V96Z" fill="white"/>
  
  <!-- Book Spine -->
  <rect x="144" y="64" width="8" height="384" fill="#047857" opacity="0.3"/>
  
  <!-- Decorative Islamic Pattern -->
  <circle cx="256" cy="180" r="40" stroke="#059669" stroke-width="3" fill="none"/>
  <circle cx="256" cy="180" r="28" stroke="#059669" stroke-width="2" fill="none"/>
  
  <!-- Arabic Text Style Decoration (stylized) -->
  <path d="M200 260 Q256 240 312 260" stroke="#059669" stroke-width="3" fill="none" stroke-linecap="round"/>
  <path d="M200 290 Q256 270 312 290" stroke="#059669" stroke-width="3" fill="none" stroke-linecap="round"/>
  <path d="M200 320 Q256 300 312 320" stroke="#059669" stroke-width="3" fill="none" stroke-linecap="round"/>
  
  <!-- Star/Islamic ornament -->
  <path d="M256 350 L262 366 L279 366 L265 376 L271 392 L256 382 L241 392 L247 376 L233 366 L250 366 Z" fill="#059669"/>
</svg>`;

// Convert SVG to base64 data URL
function svgToBase64(svg: string): string {
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

// Store logo in KV store
export async function storeLogo(): Promise<void> {
  try {
    const base64Logo = svgToBase64(LOGO_SVG);
    
    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-bf07b5b1/kv/set`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          key: LOGO_KEY,
          value: base64Logo,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to store logo: ${response.statusText}`);
    }

    console.log('Logo stored successfully in KV store');
  } catch (error) {
    console.error('Error storing logo:', error);
  }
}

// Get logo from KV store
export async function getLogo(): Promise<string> {
  try {
    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-bf07b5b1/kv/get?key=${LOGO_KEY}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
        },
      }
    );

    if (!response.ok) {
      // If logo doesn't exist, store it and return the base64
      console.log('Logo not found in KV store, storing it now...');
      await storeLogo();
      return svgToBase64(LOGO_SVG);
    }

    const data = await response.json();
    return data.value || svgToBase64(LOGO_SVG);
  } catch (error) {
    console.error('Error fetching logo:', error);
    // Fallback to local SVG
    return svgToBase64(LOGO_SVG);
  }
}

// Get logo synchronously from cache (after initial load)
let cachedLogo: string | null = null;

export async function initializeLogo(): Promise<string> {
  if (!cachedLogo) {
    cachedLogo = await getLogo();
  }
  return cachedLogo;
}

export function getCachedLogo(): string {
  return cachedLogo || svgToBase64(LOGO_SVG);
}

// Update logo with a new base64 string
export async function updateLogo(base64Logo: string): Promise<void> {
  try {
    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-bf07b5b1/kv/set`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          key: LOGO_KEY,
          value: base64Logo,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to update logo: ${response.statusText}`);
    }

    // Update the cache
    cachedLogo = base64Logo;
    
    // Dispatch event to notify components
    window.dispatchEvent(new CustomEvent('logoUpdated'));
    
    console.log('Logo updated successfully in KV store');
  } catch (error) {
    console.error('Error updating logo:', error);
    throw error;
  }
}