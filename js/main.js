/* eslint-disable */
'use strict';

// ============================================================
// ROSEYOBI MEDIA — main.js
// ============================================================

document.addEventListener('DOMContentLoaded', () => {

    // ── 1. CANVAS ЧАСТИЦЫ ────────────────────────────────────
    const canvas = document.getElementById('particleCanvas');
    const ctx = canvas.getContext('2d');
    let particles = [];
    let W, H;

    function resizeCanvas() {
        W = canvas.width = window.innerWidth;
        H = canvas.height = window.innerHeight;
    }

    class Particle {
        constructor() { this.reset(true); }

        reset(initial = false) {
            this.x = Math.random() * W;
            this.y = initial ? Math.random() * H : H + 10;
            this.size = Math.random() * 1.2 + 0.3;
            this.speedY = -(Math.random() * 0.4 + 0.1);
            this.speedX = (Math.random() - 0.5) * 0.2;
            this.opacity = 0;
            this.maxOpacity = Math.random() * 0.5 + 0.1;
            this.life = 0;
            this.maxLife = Math.random() * 300 + 150;
        }

        update() {
            this.life++;
            this.x += this.speedX;
            this.y += this.speedY;

            // Fade in / fade out
            if (this.life < 60) {
                this.opacity = (this.life / 60) * this.maxOpacity;
            } else if (this.life > this.maxLife - 60) {
                this.opacity = ((this.maxLife - this.life) / 60) * this.maxOpacity;
            } else {
                this.opacity = this.maxOpacity;
            }

            if (this.life >= this.maxLife) this.reset();
        }

        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255,255,255,${this.opacity})`;
            ctx.fill();
        }
    }

    function initParticles() {
        particles = Array.from({ length: 80 }, () => new Particle());
    }

    function animateParticles() {
        ctx.clearRect(0, 0, W, H);
        particles.forEach(p => { p.update(); p.draw(); });
        requestAnimationFrame(animateParticles);
    }

    resizeCanvas();
    initParticles();
    animateParticles();
    window.addEventListener('resize', () => { resizeCanvas(); });


    // ── 2. NAVBAR при скролле ─────────────────────────────────
    const navbar = document.getElementById('navbar');
    let lastY = 0;
    window.addEventListener('scroll', () => {
        const y = window.scrollY;
        navbar.classList.toggle('scrolled', y > 60);
        lastY = y;
    }, { passive: true });


    // ── 3. SCROLL REVEAL (Intersection Observer) ───────────────
    const revealEls = document.querySelectorAll('.reveal-up, .reveal-left, .reveal-right, .reveal-chars');
    const io = new IntersectionObserver((entries) => {
        entries.forEach(e => {
            if (e.isIntersecting) {
                e.target.classList.add('visible');
                io.unobserve(e.target);
            }
        });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    revealEls.forEach(el => io.observe(el));


    // ── 4. СЧЁТЧИКИ ЦИФР ──────────────────────────────────────
    const statNums = document.querySelectorAll('.stat-num');
    const counterIO = new IntersectionObserver((entries) => {
        entries.forEach(e => {
            if (e.isIntersecting) {
                animateCounter(e.target);
                counterIO.unobserve(e.target);
            }
        });
    }, { threshold: 0.5 });

    statNums.forEach(el => counterIO.observe(el));

    function animateCounter(el) {
        const target = parseInt(el.dataset.target, 10);
        const duration = 1800;
        const start = performance.now();

        function tick(now) {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            // Easing out expo
            const eased = 1 - Math.pow(2, -10 * progress);
            el.textContent = Math.round(eased * target);
            if (progress < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
    }


    // ── 5. DRAG СЛАЙДЕР АРТИСТОВ ──────────────────────────────
    const track = document.getElementById('artistsTrack');
    const dotsContainer = document.getElementById('sliderDots');

    if (track) {
        let isDragging = false;
        let startX = 0;
        let scrollAt = 0;
        let velocity = 0;
        let lastMouseX = 0;
        let rafId = null;

        // Создаём точки-индикаторы
        const cards = track.querySelectorAll('.artist-card');
        cards.forEach((_, i) => {
            const dot = document.createElement('div');
            dot.className = 'dot' + (i === 0 ? ' active' : '');
            dot.addEventListener('click', () => scrollToCard(i));
            dotsContainer.appendChild(dot);
        });

        function updateDots() {
            const cardW = cards[0].offsetWidth + 24; // + gap
            const activeIdx = Math.round(track.parentElement.scrollLeft / cardW);
            document.querySelectorAll('.dot').forEach((d, i) => {
                d.classList.toggle('active', i === activeIdx);
            });
        }

        function scrollToCard(idx) {
            const cardW = cards[0].offsetWidth + 24;
            track.parentElement.scrollTo({ left: cardW * idx, behavior: 'smooth' });
        }

        // mouse drag
        track.addEventListener('mousedown', e => {
            isDragging = true;
            startX = e.clientX - track.parentElement.scrollLeft;
            scrollAt = track.parentElement.scrollLeft;
            lastMouseX = e.clientX;
            track.style.transition = 'none';
            cancelAnimationFrame(rafId);
        });

        document.addEventListener('mousemove', e => {
            if (!isDragging) return;
            velocity = e.clientX - lastMouseX;
            lastMouseX = e.clientX;
            track.parentElement.scrollLeft = startX - e.clientX;
        });

        document.addEventListener('mouseup', () => {
            if (!isDragging) return;
            isDragging = false;
            applyMomentum();
        });

        // touch
        track.addEventListener('touchstart', e => {
            startX = e.touches[0].clientX - track.parentElement.scrollLeft;
            scrollAt = track.parentElement.scrollLeft;
            lastMouseX = e.touches[0].clientX;
        }, { passive: true });

        track.addEventListener('touchmove', e => {
            velocity = e.touches[0].clientX - lastMouseX;
            lastMouseX = e.touches[0].clientX;
            track.parentElement.scrollLeft = startX - e.touches[0].clientX;
        }, { passive: true });

        track.addEventListener('touchend', applyMomentum);

        function applyMomentum() {
            let vel = velocity * 0.8;
            function step() {
                if (Math.abs(vel) < 0.5) { updateDots(); return; }
                track.parentElement.scrollLeft -= vel;
                vel *= 0.92;
                rafId = requestAnimationFrame(step);
            }
            step();
        }

        track.parentElement.addEventListener('scroll', updateDots, { passive: true });
    }


    // ── 6. ПЛАВНЫЙ СКРОЛЛ К ЯКОРЯМ ────────────────────────────
    document.querySelectorAll('a[href^="#"]').forEach(a => {
        a.addEventListener('click', e => {
            const id = a.getAttribute('href');
            if (id === '#') return;
            const target = document.querySelector(id);
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

});
