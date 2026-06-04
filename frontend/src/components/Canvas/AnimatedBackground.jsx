import { useEffect, useRef } from "react";

export default function AnimatedBackground() {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        let animationFrameId;

        // Configuration
        const particleCount = 45;
        const connectionDistance = 140;
        const colors = {
            violet: "rgba(168, 85, 247, ",
            indigo: "rgba(99, 102, 241, ",
            cyan: "rgba(6, 182, 212, "
        };

        let particles = [];
        let width = 0;
        let height = 0;

        const resizeCanvas = () => {
            if (!canvas) return;
            const dpr = window.devicePixelRatio || 1;
            width = canvas.parentElement ? canvas.parentElement.clientWidth : window.innerWidth;
            height = canvas.parentElement ? canvas.parentElement.clientHeight : window.innerHeight;
            
            canvas.width = width * dpr;
            canvas.height = height * dpr;
            canvas.style.width = `${width}px`;
            canvas.style.height = `${height}px`;
            
            ctx.scale(dpr, dpr);
        };

        class Particle {
            constructor() {
                this.x = Math.random() * width;
                this.y = Math.random() * height;
                this.vx = (Math.random() - 0.5) * 0.45;
                this.vy = (Math.random() - 0.5) * 0.45;
                this.radius = Math.random() * 2 + 1.5;
                
                // Color flavor selection
                const rand = Math.random();
                if (rand < 0.4) {
                    this.colorFamily = colors.violet;
                } else if (rand < 0.7) {
                    this.colorFamily = colors.indigo;
                } else {
                    this.colorFamily = colors.cyan;
                }
                
                this.baseAlpha = Math.random() * 0.35 + 0.25;
            }

            update() {
                this.x += this.vx;
                this.y += this.vy;

                // Bounce off edges gently or wrap
                if (this.x < 0 || this.x > width) this.vx *= -1;
                if (this.y < 0 || this.y > height) this.vy *= -1;
            }

            draw() {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                ctx.fillStyle = `${this.colorFamily}${this.baseAlpha})`;
                ctx.shadowBlur = 8;
                ctx.shadowColor = `${this.colorFamily}0.6)`;
                ctx.fill();
                ctx.shadowBlur = 0; // reset
            }
        }

        const init = () => {
            resizeCanvas();
            particles = [];
            for (let i = 0; i < particleCount; i++) {
                particles.push(new Particle());
            }
        };

        const drawLines = () => {
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const p1 = particles[i];
                    const p2 = particles[j];
                    const dx = p1.x - p2.x;
                    const dy = p1.y - p2.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < connectionDistance) {
                        const alpha = (1 - dist / connectionDistance) * 0.18;
                        ctx.beginPath();
                        ctx.moveTo(p1.x, p1.y);
                        ctx.lineTo(p2.x, p2.y);
                        ctx.strokeStyle = `rgba(99, 102, 241, ${alpha})`;
                        ctx.lineWidth = 1;
                        ctx.stroke();
                    }
                }
            }
        };

        const animate = () => {
            ctx.clearRect(0, 0, width, height);

            particles.forEach((p) => {
                p.update();
                p.draw();
            });

            drawLines();

            animationFrameId = requestAnimationFrame(animate);
        };

        init();
        animate();

        window.addEventListener("resize", resizeCanvas);

        return () => {
            cancelAnimationFrame(animationFrameId);
            window.removeEventListener("resize", resizeCanvas);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                zIndex: 0,
                pointerEvents: "none"
            }}
        />
    );
}
