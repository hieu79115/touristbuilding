import React, { useState } from 'react';
import './RightSidebar.css';

export const RightSidebar = () => {
    const [isOpen, setIsOpen] = useState(false);

    const toggleSidebar = () => {
        setIsOpen(!isOpen);
    };

    return (
        <>
            <button
                onClick={toggleSidebar}
                className={`toggle-button ${isOpen ? 'open' : ''}`}
            >
                {isOpen ? 'Close Sidebar' : 'Open Sidebar'}
            </button>
            <div className={`right-sidebar ${isOpen ? 'open' : 'closed'}`}>
                <h3>Danh sách các địa điểm</h3>
                <ul>
                    <li>Item 1</li>
                    <li>Item 2</li>
                    <li>Item 3</li>
                </ul>
            </div>
        </>
    );
};

export default RightSidebar;
