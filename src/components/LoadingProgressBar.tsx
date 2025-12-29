"use client";
import React from 'react';
import { useLoading } from '../contexts/LoadingContext';

const LoadingProgressBar = () => {
    const { progress } = useLoading();

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '4px',
            backgroundColor: '#f0f0f0',
            zIndex: 9999
        }}>
            <div style={{
                width: `${progress}%`,
                height: '100%',
                backgroundColor: '#0070f3',
                transition: 'width 0.3s ease-in-out'
            }}></div>
        </div>
    );
};

export default LoadingProgressBar;

