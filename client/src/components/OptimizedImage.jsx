import React, { useState, useEffect } from 'react';

const OptimizedImage = ({
    src,
    alt,
    style,
    className,
    placeholderColor = '#f0f0f0'
}) => {
    const [imageSrc, setImageSrc] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);
    const imgRef = React.useRef();

    useEffect(() => {
        const loadImage = () => {
            const img = new Image();
            img.src = src;

            img.onload = () => {
                setImageSrc(src);
                setIsLoading(false);
            };

            img.onerror = () => {
                setHasError(true);
                setIsLoading(false);
            };
        };

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        loadImage();
                        observer.disconnect();
                    }
                });
            },
            { rootMargin: '50px' }
        );

        if (imgRef.current) {
            observer.observe(imgRef.current);
        }

        return () => {
            if (observer) observer.disconnect();
        };
    }, [src]);

    if (hasError) {
        return (
            <div
                ref={imgRef}
                style={{
                    ...style,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#f5f5f5',
                    color: '#999',
                    fontFamily: 'var(--fr-font-sans)',
                    fontSize: 'var(--fr-fs-caption)',
                    lineHeight: 'var(--fr-lh-normal)'
                }}
                className={className}
            >
                Image failed to load
            </div>
        );
    }

    return (
        <img
            ref={imgRef}
            src={imageSrc || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg"%3E%3C/svg%3E'}
            alt={alt}
            style={{
                ...style,
                background: placeholderColor,
                transition: 'opacity 0.3s ease',
                opacity: isLoading ? 0.5 : 1
            }}
            className={className}
            loading="lazy"
        />
    );
};

export default OptimizedImage;
