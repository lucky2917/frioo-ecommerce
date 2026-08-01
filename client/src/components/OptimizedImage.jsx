import React, { useState, useEffect } from 'react';

const OptimizedImage = ({
    src,
    alt,
    style,
    className,
    placeholderColor = 'var(--fr-surface-2)'
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
                    background: 'var(--fr-surface-2)',
                    color: 'var(--fr-text-3)',
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
        <img decoding="async"
            ref={imgRef}
            src={imageSrc || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg"%3E%3C/svg%3E'}
            alt={alt}
            style={{
                ...style,
                background: placeholderColor,
                transition: 'opacity var(--fr-dur-base) var(--fr-ease-standard)',
                opacity: isLoading ? 0 : 1
            }}
            className={className}
            loading="lazy"
        />
    );
};

export default OptimizedImage;
