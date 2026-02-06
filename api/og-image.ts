import { createClient } from '@supabase/supabase-js';

export const config = {
  runtime: 'edge',
};

export default async function handler(request: Request) {
  try {
    // Initialize Supabase client
    const supabaseUrl = process.env.SUPABASE_URL || 'https://sxtdsxaibifgvtyeatzl.supabase.co';
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4dGRzeGFpYmlmZ3Z0eWVhdHpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcwMzM1MjYsImV4cCI6MjA4MjYwOTUyNn0.31i1JKdXazyCRODjm5ZPiDP3ao5MiZhIwCcgDJ57wqE';

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Fetch the latest OG image URL from database
    const { data, error } = await supabase
      .from('seo_settings')
      .select('image_url')
      .eq('setting_key', 'og_image')
      .single();

    if (error) {
      console.error('Error fetching OG image from database:', error);
      // Fallback to static image
      return Response.redirect(new URL('/og-image.png', request.url).toString(), 302);
    }

    if (data?.image_url) {
      // Fetch the image from Supabase Storage
      const imageResponse = await fetch(data.image_url);

      if (!imageResponse.ok) {
        // Fallback to static image if fetch fails
        return Response.redirect(new URL('/og-image.png', request.url).toString(), 302);
      }

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

    // No image URL found in database, fallback to static image
    return Response.redirect(new URL('/og-image.png', request.url).toString(), 302);
  } catch (error) {
    console.error('Unexpected error in og-image edge function:', error);
    // Fallback to static image on any error
    return Response.redirect(new URL('/og-image.png', request.url).toString(), 302);
  }
}
