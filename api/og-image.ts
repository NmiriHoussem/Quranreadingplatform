import { createClient } from '@supabase/supabase-js';

export const config = {
  runtime: 'edge',
};

export default async function handler(request: Request) {
  // Helper function to return fallback image
  const getFallback = () => {
    // Return OG image with app logo (1200x630)
    const svg = `<svg width="1200" height="630" viewBox="0 0 1200 630" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- Background gradient -->
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#059669;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#047857;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#grad)" />
  
  <!-- App Icon/Logo (centered, scaled) -->
  <g transform="translate(425, 65)">
    <!-- Book/Quran Shape -->
    <path d="M64 16C64 7.16344 71.1634 0 80 0H270C278.837 0 286 7.16344 286 16V334C286 342.837 278.837 350 270 350H80C71.1634 350 64 342.837 64 334V16Z" fill="white"/>
    
    <!-- Book Spine -->
    <rect x="72" y="0" width="6" height="350" fill="#047857" opacity="0.3"/>
    
    <!-- Decorative Islamic Pattern -->
    <circle cx="175" cy="95" r="35" stroke="#059669" stroke-width="3" fill="none"/>
    <circle cx="175" cy="95" r="24" stroke="#059669" stroke-width="2" fill="none"/>
    
    <!-- Arabic Text Style Decoration -->
    <path d="M120 175 Q175 160 230 175" stroke="#059669" stroke-width="3" fill="none" stroke-linecap="round"/>
    <path d="M120 200 Q175 185 230 200" stroke="#059669" stroke-width="3" fill="none" stroke-linecap="round"/>
    <path d="M120 225 Q175 210 230 225" stroke="#059669" stroke-width="3" fill="none" stroke-linecap="round"/>
    
    <!-- Star/Islamic ornament -->
    <path d="M175 270 L180 283 L194 283 L183 291 L188 304 L175 296 L162 304 L167 291 L156 283 L170 283 Z" fill="#059669"/>
  </g>
  
  <!-- App Name -->
  <text x="600" y="480" text-anchor="middle" fill="white" font-size="64" font-family="Arial, sans-serif" font-weight="bold">حلقة القرآن</text>
  <text x="600" y="540" text-anchor="middle" fill="white" font-size="42" font-family="Arial, sans-serif">Quran Circle</text>
  <text x="600" y="590" text-anchor="middle" fill="#d1fae5" font-size="24" font-family="Arial, sans-serif">رحلتك الشخصية مع القرآن الكريم</text>
</svg>`;
    
    return new Response(svg, {
      status: 200,
      headers: {
        'Content-Type': 'image/svg+xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  };

  try {
    // Initialize Supabase client
    const supabaseUrl = process.env.SUPABASE_URL || 'https://sxtdsxaibifgvtyeatzl.supabase.co';
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4dGRzeGFpYmlmZ3Z0eWVhdHpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcwMzM1MjYsImV4cCI6MjA4MjYwOTUyNn0.31i1JKdXazyCRODjm5ZPiDP3ao5MiZhIwCcgDJ57wqE';

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    console.log('[OG-IMAGE] Fetching from database...');

    // Fetch the latest OG image URL from database
    const { data, error } = await supabase
      .from('seo_settings')
      .select('image_url')
      .eq('setting_key', 'og_image')
      .single();

    if (error) {
      console.error('[OG-IMAGE] Database error:', error);
      // Return SVG fallback
      return getFallback();
    }

    console.log('[OG-IMAGE] Database data:', data);

    if (data?.image_url) {
      console.log('[OG-IMAGE] Fetching image from:', data.image_url);
      
      // Fetch the image from Supabase Storage
      const imageResponse = await fetch(data.image_url);

      if (!imageResponse.ok) {
        console.error('[OG-IMAGE] Image fetch failed:', imageResponse.status, imageResponse.statusText);
        // Return SVG fallback
        return getFallback();
      }

      console.log('[OG-IMAGE] Image fetched successfully, serving...');

      // Get content type
      const contentType = imageResponse.headers.get('Content-Type') || 'image/png';

      // Proxy the image with proper caching headers
      return new Response(imageResponse.body, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
          'CDN-Cache-Control': 'public, max-age=3600',
          'Vercel-CDN-Cache-Control': 'public, max-age=3600',
        },
      });
    }

    console.log('[OG-IMAGE] No image URL in database, using fallback');
    // No image URL found in database, return SVG fallback
    return getFallback();
  } catch (error) {
    console.error('[OG-IMAGE] Unexpected error:', error);
    // Return SVG fallback on any error
    return getFallback();
  }
}