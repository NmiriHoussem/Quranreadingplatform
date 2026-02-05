import { supabase } from '../../lib/supabase';

// Social media sharing image for Open Graph and Twitter Cards
// This image is uploaded via the SEO Admin panel (/admin/seo)
// It's stored in Supabase Storage and the URL is saved in the database

// Fetch the OG image URL from Supabase
export const fetchSocialShareImageUrl = async (): Promise<string | null> => {
  try {
    const { data, error } = await supabase
      .from('seo_settings')
      .select('image_url')
      .eq('setting_key', 'og_image')
      .single();

    if (error) throw error;
    return data?.image_url || null;
  } catch (error) {
    console.error('Error fetching social share image:', error);
    // Fallback to default image if database fetch fails
    return `${window.location.origin}/og-image.png`;
  }
};

// Image dimensions (optimal for social media)
export const socialShareImageWidth = 1200;
export const socialShareImageHeight = 630;