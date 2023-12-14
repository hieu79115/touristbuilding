import React from 'react';
import {
    BtnMyLocation,
    BtnZoom,
    MapView,
    SearchBar,
    RightSidebar,
} from '../components';
import '../assets/styles.css';

export const HomeScreen = () => {
    return (
        <div>
            <MapView />
            <RightSidebar />
            <BtnMyLocation />
            <BtnZoom />
            <SearchBar />
        </div>
    );
};
