import React, { useEffect, useState } from 'react';
import { installLoadingBar, subscribeLoading } from '../utils/loadingBar';

installLoadingBar();

/** Thin animated bar at the top of the admin panel while any request is loading. */
export const TopLoader = () => {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    let timer = null;
    const unsubscribe = subscribeLoading((count) => {
      if (timer) clearTimeout(timer);
      // Short requests do not flash the bar; it hides a moment after the last one ends.
      timer = setTimeout(() => setVisible(count > 0), count > 0 ? 150 : 250);
    });
    return () => {
      if (timer) clearTimeout(timer);
      unsubscribe();
    };
  }, []);
  return (
    <div className={`adm-toploader ${visible ? 'on' : ''}`} role="progressbar" aria-hidden={!visible} aria-label="Loading">
      <style>{`
        .adm-toploader { position: fixed; top: 0; left: 0; right: 0; height: 3px; z-index: 5000; pointer-events: none; opacity: 0; transition: opacity .25s ease; overflow: hidden; }
        .adm-toploader.on { opacity: 1; }
        .adm-toploader::before { content: ''; position: absolute; top: 0; bottom: 0; left: -40%; width: 40%; background: linear-gradient(90deg, transparent, #22c55e, #2b45c4, transparent); animation: adm-load 1.1s ease-in-out infinite; }
        @keyframes adm-load { 0% { left: -40%; } 100% { left: 100%; } }
      `}</style>
    </div>
  );
};

/** Full-screen loader while the admin panel itself starts. */
export const PageLoader = ({ text = 'Loading admin panel…' }) => (
  <div style={{ position: 'fixed', inset: 0, zIndex: 4500, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(245,247,251,.92)' }}>
    <style>{`
      .adm-spin { width: 46px; height: 46px; border-radius: 50%; border: 4px solid #e0e7ff; border-top-color: #0a1f8f; animation: adm-spin .8s linear infinite; }
      @keyframes adm-spin { to { transform: rotate(360deg); } }
    `}</style>
    <div style={{ textAlign: 'center' }}>
      <div className="adm-spin" style={{ margin: '0 auto 14px' }} />
      <div style={{ fontWeight: 700, color: '#0a1f8f' }}>{text}</div>
    </div>
  </div>
);
