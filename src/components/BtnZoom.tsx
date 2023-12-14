import React, { useContext } from 'react';
import { MapContext } from '../context';

export const BtnZoom = () => {
    const { map, isMapReady } = useContext(MapContext);

    const handleZoomIn = () => {
        if (!isMapReady) throw new Error('Map is not ready');
        map?.zoomIn();
    };

    const handleZoomOut = () => {
        if (!isMapReady) throw new Error('Map is not ready');
        map?.zoomOut();
    };

    return (
        <div
            style={{
                position: 'fixed',
                bottom: '50px',
                right: '55px',
                zIndex: '999',
            }}
        >
            <button
                className="btn btn-primary"
                onClick={handleZoomIn}
                style={{ marginRight: '5px', borderRadius: '50%' }}
            >
                <i className="fas fa-search-plus" />
            </button>
            <button
                className="btn btn-primary"
                onClick={handleZoomOut}
                style={{ borderRadius: '50%' }}
            >
                <i className="fas fa-search-minus" />
            </button>
        </div>
    );
};
