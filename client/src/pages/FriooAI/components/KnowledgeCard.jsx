import React from 'react';

/**
 * KnowledgeCard - Global nutrition database stats
 */
function KnowledgeCard() {
    return (
        <div className="v4-card knowledge">
            <div className="card-top">
                <span className="code">SYS_03 // KNOWLEDGE_BASE</span>
                <h3>Global Nutrition Map</h3>
            </div>
            <ul className="feature-list">
                <li>12.4M Verified Compounds</li>
                <li>Real-time Glycemic Scoring</li>
            </ul>
            <div className="map-viz">
                <div className="grid-lines"></div>
            </div>
        </div>
    );
}

export default KnowledgeCard;
