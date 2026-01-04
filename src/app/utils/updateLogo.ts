/**
 * Logo Update Utility
 * 
 * This script can be used to manually update the logo stored in the KV database.
 * Simply call updateLogoInDatabase() with a new SVG string to update it.
 */

import { projectId, publicAnonKey } from '../../../utils/supabase/info';

const LOGO_KEY = 'app_logo_base64';

// Convert SVG to base64 data URL
function svgToBase64(svg: string): string {
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

/**
 * Update the logo in the database
 * @param svgString - The SVG content as a string
 */
export async function updateLogoInDatabase(svgString: string): Promise<void> {
  try {
    const base64Logo = svgToBase64(svgString);
    
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

    console.log('✅ Logo updated successfully in database!');
    console.log('🔄 Please refresh the page to see the changes.');
  } catch (error) {
    console.error('❌ Error updating logo:', error);
  }
}

/**
 * Example usage:
 * 
 * import { updateLogoInDatabase } from './utils/updateLogo';
 * 
 * const newLogoSVG = `
 *   <svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
 *     <!-- Your SVG content here -->
 *   </svg>
 * `;
 * 
 * updateLogoInDatabase(newLogoSVG);
 */