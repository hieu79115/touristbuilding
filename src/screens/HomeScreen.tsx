import React from 'react';
import { BtnMyLocation, BtnZoom, MapView, SearchBar } from '../components';
import { RightSidebar } from '../context/';
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
