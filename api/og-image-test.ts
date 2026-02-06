import { createClient } from '@supabase/supabase-js';

export const config = {
  runtime: 'edge',
};

// Test endpoint to debug OG image issues
export default async function handler(request: Request) {
  try {
    // Initialize Supabase client
    const supabaseUrl = process.env.SUPABASE_URL || 'https://sxtdsxaibifgvtyeatzl.supabase.co';
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4dGRzeGFpYmlmZ3Z0eWVhdHpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcwMzM1MjYsImV4cCI6MjA4MjYwOTUyNn0.31i1JKdXazyCRODjm5ZPiDP3ao5MiZhIwCcgDJ57wqE';

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Fetch the latest OG image URL from database
    const { data, error } = await supabase
      .from('seo_settings')
      .select('*')
      .eq('setting_key', 'og_image')
      .single();

    const debugInfo = {
      timestamp: new Date().toISOString(),
      supabaseUrl,
      hasAnonKey: !!supabaseAnonKey,
      databaseQuery: {
        hasError: !!error,
        error: error ? {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        } : null,
        hasData: !!data,
        data: data || null
      },
      imageUrl: data?.image_url || null,
      willFetchImage: !!data?.image_url
    };

    // Test fetching the image if URL exists
    if (data?.image_url) {
      try {
        const imageResponse = await fetch(data.image_url);
        debugInfo['imageFetch'] = {
          url: data.image_url,
          status: imageResponse.status,
          statusText: imageResponse.statusText,
          ok: imageResponse.ok,
          headers: Object.fromEntries(imageResponse.headers.entries())
        };
      } catch (fetchError: any) {
        debugInfo['imageFetch'] = {
          url: data.image_url,
          error: fetchError.message
        };
      }
    }

    return new Response(JSON.stringify(debugInfo, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({
      error: 'Unexpected error',
      message: error.message,
      stack: error.stack
    }, null, 2), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}
