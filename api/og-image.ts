import { createClient } from '@supabase/supabase-js';

export const config = {
  runtime: 'edge',
};

export default async function handler(request: Request) {
  // Helper function to return fallback image
  const getFallback = () => {
    // Return a simple SVG as fallback
    const svg = `
      <svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#059669;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#047857;stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="1200" height="630" fill="url(#grad)" />
        <text x="600" y="280" text-anchor="middle" fill="white" font-size="72" font-family="Arial, sans-serif" font-weight="bold">حلقة القرآن</text>
        <text x="600" y="360" text-anchor="middle" fill="white" font-size="48" font-family="Arial, sans-serif">Quran Circle</text>
        <text x="600" y="420" text-anchor="middle" fill="#d1fae5" font-size="28" font-family="Arial, sans-serif">قراءة وحفظ القرآن الكريم معاً</text>
      </svg>
    `;
    
    return new Response(svg, {
      status: 200,
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=3600',
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