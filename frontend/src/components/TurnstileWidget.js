import React, { useEffect, useRef } from 'react';

const TurnstileWidget = ({ setToken }) => {
    const widgetId = useRef(null);

    useEffect(() => {
        const siteKey = process.env.REACT_APP_TURNSTILE_SITE_KEY;

        if (!siteKey) return;

        const renderWidget = () => {
            if (window.turnstile && widgetId.current === null) {
                const container = document.getElementById('turnstile-widget');
                if (!container) return;

                container.innerHTML = '';
                widgetId.current = window.turnstile.render('#turnstile-widget', {
                    sitekey: siteKey,
                    callback: (token) => setToken(token),
                });
            }
        };

        if (window.turnstile) {
            renderWidget();
        } else {
            const scriptId = 'cloudflare-turnstile-script';
            if (!document.getElementById(scriptId)) {
                const script = document.createElement('script');
                script.id = scriptId;
                script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
                script.async = true;
                script.defer = true;
                script.onload = renderWidget;
                document.head.appendChild(script);
            }
        }

        return () => {
            if (window.turnstile && widgetId.current !== null) {
                window.turnstile.remove(widgetId.current);
                widgetId.current = null;
            }
        };
    }, [setToken]);

    return (
        <div id="turnstile-widget" className="d-flex justify-content-center mb-3"></div>
    );
};

export default TurnstileWidget;