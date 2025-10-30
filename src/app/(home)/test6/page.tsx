'use client';

import { useEffect, useRef } from 'react';

interface ConfettiParticle {
    x: number;
    y: number;
    size: number;
    speedX: number;
    speedY: number;
    rotation: number;
    rotationSpeed: number;
    image: HTMLImageElement;
}

const confettiImages = [
    'images/chip.jpg',
    'images/chip.jpg',
    'images/chip.jpg',
];

const ConfettiCanvas = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const particlesRef = useRef<ConfettiParticle[]>([]);
    const loadedImagesRef = useRef<HTMLImageElement[]>([]);
    const isAnimatingRef = useRef<boolean>(false); // Track animation state

    useEffect(() => {
        const canvas = canvasRef.current!;
        const ctx = canvas.getContext('2d')!;
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        // Load images
        let imagesLoaded = 0;
        confettiImages.forEach((src) => {
            const img = new Image();
            img.src = src;
            img.onload = () => {
                imagesLoaded++;
                if (imagesLoaded === confettiImages.length) {
                    loadedImagesRef.current = confettiImages.map(url => {
                        const image = new Image();
                        image.src = url;
                        return image;
                    });
                }
            };
        });

        const handleResize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        window.addEventListener('resize', handleResize);

        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const spawnConfetti = (count = 100) => {
        const canvas = canvasRef.current!;
        const particles = particlesRef.current;
        const images = loadedImagesRef.current;
        const x = canvas.width / 2; // Middle of the screen
        const y = canvas.height; // Bottom of the screen
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI; // Full 180-degree spread upward
            const speed = Math.random() * 8 + 6; // Increased speed for firework effect
            particles.push({
                x,
                y,
                size: Math.random() * 20 + 10,
                speedX: speed * Math.cos(angle), // Spread left and right
                speedY: -speed * Math.sin(angle), // Negative to move upward
                rotation: Math.random() * 360,
                rotationSpeed: Math.random() * 10 - 5,
                image: images[Math.floor(Math.random() * images.length)],
            });
        }
        if (!isAnimatingRef.current) {
            isAnimatingRef.current = true;
            animate();
        }
    };

    const animate = () => {
        const canvas = canvasRef.current!;
        const ctx = canvas.getContext('2d')!;
        const particles = particlesRef.current;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        for (const p of particles) {
            p.x += p.speedX;
            p.y += p.speedY;
            p.speedY += 0.15; // Slightly stronger gravity for a natural arc
            p.rotation += p.rotationSpeed;

            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate((p.rotation * Math.PI) / 180);
            ctx.drawImage(p.image, -p.size / 2, -p.size / 2, p.size, p.size);
            ctx.restore();
        }

        // Remove offscreen particles
        particlesRef.current = particles.filter(p => p.y > -50 && p.x > -50 && p.x < canvas.width + 50);

        if (particlesRef.current.length > 0) {
            requestAnimationFrame(animate);
        } else {
            isAnimatingRef.current = false; // Stop animation when no particles remain
        }
    };

    const handleButtonClick = () => {
        spawnConfetti(100);
    };

    return (
        <>
            <canvas ref={canvasRef} style={{ position: 'fixed', top: 0, left: 0, pointerEvents: 'none', zIndex: 9999 }} />
            <button
                onClick={handleButtonClick}
                style={{
                    padding: '10px 20px',
                    fontSize: '16px',
                    cursor: 'pointer',
                    backgroundColor: '#4CAF50',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    zIndex: 10000,
                }}
            >
                Launch Confetti 🎉
            </button>
        </>
    );
};

export default function Page() {
    return (
        <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', gap: '20px' }}>
            <h1 style={{ cursor: 'default' }}>Click the button for fireworks!</h1>
            <ConfettiCanvas />
        </div>
    );
}