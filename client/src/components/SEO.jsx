import { useEffect } from 'react';

const SEO = ({
    title,
    description,
    canonical,
    ogImage,
    ogType = 'website',
    structuredData,
    keywords
}) => {
    const SITE_NAME = 'Frioo';
    const DEFAULT_TITLE = 'Frioo — Fresh Fruits, Juices & Salads Delivered in Vizag | Best Fruits in Visakhapatnam';
    const DEFAULT_DESC = 'Order the freshest fruits, pure juices, fruit milkshakes & healthy salads in Visakhapatnam (Vizag). 100% natural, no preservatives. Free delivery within 6km. Shop now!';
    const DEFAULT_IMAGE = 'https://frioo.in/og-image.jpg';
    const BASE_URL = 'https://frioo.in';
    const DEFAULT_KEYWORDS = 'fresh fruits vizag, best fruits in vizag, fruit delivery vizag, fresh juice vizag, buy fruits online vizag, frioo vizag, visakhapatnam fruits';

    useEffect(() => {
        document.title = title
            ? `${title} | ${SITE_NAME} — Fresh Fruits & Juices Vizag`
            : DEFAULT_TITLE;

        const setMeta = (attr, attrValue, content) => {
            let el = document.querySelector(`meta[${attr}="${attrValue}"]`);
            if (el) {
                el.setAttribute('content', content);
            } else {
                el = document.createElement('meta');
                el.setAttribute(attr, attrValue);
                el.setAttribute('content', content);
                document.head.appendChild(el);
            }
        };

        const desc = description || DEFAULT_DESC;
        setMeta('name', 'description', desc);

        setMeta('name', 'keywords', keywords ? `${keywords}, ${DEFAULT_KEYWORDS}` : DEFAULT_KEYWORDS);

        const canonicalUrl = canonical ? `${BASE_URL}${canonical}` : BASE_URL;
        let canonicalEl = document.querySelector('link[rel="canonical"]');
        if (canonicalEl) {
            canonicalEl.setAttribute('href', canonicalUrl);
        } else {
            canonicalEl = document.createElement('link');
            canonicalEl.setAttribute('rel', 'canonical');
            canonicalEl.setAttribute('href', canonicalUrl);
            document.head.appendChild(canonicalEl);
        }

        const ogTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} — Best Fresh Fruits & Juices in Vizag`;
        setMeta('property', 'og:title', ogTitle);
        setMeta('property', 'og:description', desc);
        setMeta('property', 'og:url', canonicalUrl);
        setMeta('property', 'og:image', ogImage || DEFAULT_IMAGE);
        setMeta('property', 'og:type', ogType);
        setMeta('property', 'og:site_name', SITE_NAME);
        setMeta('property', 'og:locale', 'en_IN');

        setMeta('name', 'twitter:title', ogTitle);
        setMeta('name', 'twitter:description', desc);
        setMeta('name', 'twitter:image', ogImage || DEFAULT_IMAGE);
        setMeta('name', 'twitter:card', 'summary_large_image');

        const existingScript = document.querySelector('script[data-seo-page]');
        if (existingScript) existingScript.remove();

        if (structuredData) {
            const script = document.createElement('script');
            script.type = 'application/ld+json';
            script.setAttribute('data-seo-page', 'true');
            script.textContent = JSON.stringify(structuredData);
            document.head.appendChild(script);
        }

        return () => {
            const pageScript = document.querySelector('script[data-seo-page]');
            if (pageScript) pageScript.remove();
        };
    }, [title, description, canonical, ogImage, ogType, structuredData, keywords]);

    return null;
};

export default SEO;
