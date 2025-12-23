import React, { useEffect } from 'react';

const SEO = ({ title, description }) => {
    useEffect(() => {
        // 1. Update Title
        document.title = title ? `${title} | Frioo` : 'Frioo - Fresh Juice & Shakes';

        // 2. Update Description
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) {
            metaDesc.setAttribute('content', description || 'Experience the freshest juices, shakes, and salads made daily. Delivered to your doorstep.');
        } else {
            const newMeta = document.createElement('meta');
            newMeta.name = 'description';
            newMeta.content = description || 'Experience the freshest juices, shakes, and salads made daily. Delivered to your doorstep.';
            document.head.appendChild(newMeta);
        }

        // Cleanup: Reset title when unmounting component (optional, but good for SPAs)
        return () => {
            // document.title = 'Frioo - Fresh Juice & Shakes'; 
            // Commented out to prevent flickering between route transitions
        };
    }, [title, description]);

    return null; // This component renders nothing in the UI
};

export default SEO;
