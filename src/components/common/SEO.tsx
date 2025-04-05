import { useEffect } from 'react';

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article';
  twitterCard?: 'summary' | 'summary_large_image';
}

/**
 * Componente SEO - Gerencia dinamicamente as meta tags para SEO e compartilhamento social
 */
export function SEO({
  title = 'SeasonScore',
  description = 'Avalie e acompanhe suas séries favoritas por temporada com o SeasonScore.',
  image = '',
  url = typeof window !== 'undefined' ? window.location.href : '',
  type = 'website',
  twitterCard = 'summary_large_image'
}: SEOProps) {
  useEffect(() => {
    document.title = title;
    
    updateMetaTag('description', description);
    
    updateMetaTag('og:title', title);
    updateMetaTag('og:description', description);
    updateMetaTag('og:url', url);
    updateMetaTag('og:type', type);
    
    if (image) {
      updateMetaTag('og:image', image);
    }
    
    updateMetaTag('twitter:card', twitterCard);
    updateMetaTag('twitter:title', title);
    updateMetaTag('twitter:description', description);
    
    if (image) {
      updateMetaTag('twitter:image', image);
    }
    
    return () => {
      document.title = 'SeasonScore';
    };
  }, [title, description, image, url, type, twitterCard]);
  
  return null;
}

/**
 * Atualiza ou cria uma meta tag
 */
function updateMetaTag(name: string, content: string) {
  let meta: HTMLMetaElement | null = document.querySelector(`meta[name="${name}"], meta[property="${name}"]`);
  
  if (!meta) {
    meta = document.createElement('meta');
    
    if (name.startsWith('og:') || name.startsWith('twitter:')) {
      meta.setAttribute('property', name);
    } else {
      meta.setAttribute('name', name);
    }
    
    document.head.appendChild(meta);
  }
  
  meta.setAttribute('content', content);
} 