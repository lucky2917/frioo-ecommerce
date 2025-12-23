import { useState, useEffect, useRef } from 'react';

const fullLog = [
    "> root@frioo_core:~$ init_sequence --force",
    ":: 0x8F4A [ALLOC_MEM] ... OK",
    ":: MOUNT /dev/bio_engine [R/W]",
    ":: EXEC_PROTOCOL(v9.2): 100%"
];

/**
 * SystemFeed - Terminal-style boot sequence with syntax highlighting
 * Displays a series of system initialization messages with color-coded syntax
 */
function SystemFeed() {
    const [lines, setLines] = useState([]);

    useEffect(() => {
        const delays = [200, 600, 1100, 1500];
        const timers = [];

        delays.forEach((delay, idx) => {
            const t = setTimeout(() => {
                setLines(prev => [...prev.slice(0, idx), fullLog[idx]]);
            }, delay);
            timers.push(t);
        });

        return () => timers.forEach(clearTimeout);
    }, []);

    // Syntax highlighter for terminal output
    const colorize = (text) => {
        let html = text;

        // Color coding for different terminal elements
        html = html.replace(
            /^(> root@frioo_core:~\$)/,
            '<span style="color:#50fa7b">root</span><span style="color:#fff">@</span><span style="color:#50fa7b">frioo_core</span><span style="color:#fff">:</span><span style="color:#8be9fd">~</span><span style="color:#fff">$</span>'
        );
        html = html.replace(/(0x[0-9A-F]+)/g, '<span style="color:#bd93f9">$1</span>');
        html = html.replace(/(init_sequence)/g, '<span style="color:#f1fa8c">$1</span>');
        html = html.replace(/(--force)/g, '<span style="color:#ff5555">$1</span>');
        html = html.replace(/(\[ALLOC_MEM\])/g, '<span style="color:#8be9fd">$1</span>');
        html = html.replace(/(OK|100%)/g, '<span style="color:#50fa7b">$1</span>');
        html = html.replace(/(MOUNT)/g, '<span style="color:#ffb86c">$1</span>');
        html = html.replace(/(\/dev\/bio_engine)/g, '<span style="color:#f1fa8c">$1</span>');
        html = html.replace(/(\[R\/W\])/g, '<span style="color:#ff79c6">$1</span>');
        html = html.replace(/(EXEC_PROTOCOL)/g, '<span style="color:#8be9fd">$1</span>');
        html = html.replace(/(::)/g, '<span style="color:#6272a4">$1</span>');

        return <span dangerouslySetInnerHTML={{ __html: html }} />;
    };

    return (
        <div className="sys-feed">
            {lines.map((l, i) => (
                <div key={i} className="sys-line">
                    {colorize(l)}
                </div>
            ))}
            <div className="sys-cursor">_</div>
        </div>
    );
}

export default SystemFeed;
