/**
 * Système de particules pour effets visuels
 * Génère des effets procéduraux performants
 */

export class ParticleSystem {
    constructor() {
        this.particles = [];
        this.emitters = [];
        this.maxParticles = 500;
        
        // Pool d'objets pour éviter les allocations
        this.particlePool = [];
        this.poolSize = 200;
        
        this.initializePool();
    }

    /**
     * Initialise le pool de particules
     */
    initializePool() {
        for (let i = 0; i < this.poolSize; i++) {
            this.particlePool.push(this.createParticleObject());
        }
    }

    /**
     * Crée un objet particule
     */
    createParticleObject() {
        return {
            x: 0, y: 0,
            vx: 0, vy: 0,
            ax: 0, ay: 0,
            life: 0,
            maxLife: 1,
            size: 1,
            startSize: 1,
            endSize: 0,
            color: '#ffffff',
            startColor: '#ffffff',
            endColor: '#ffffff',
            alpha: 1,
            startAlpha: 1,
            endAlpha: 0,
            type: 'point',
            active: false,
            rotation: 0,
            angularVelocity: 0,
            gravity: 0,
            friction: 0.98,
            bounce: 0,
            trail: null
        };
    }

    /**
     * Récupère une particule du pool
     */
    getParticleFromPool() {
        for (let i = 0; i < this.particlePool.length; i++) {
            if (!this.particlePool[i].active) {
                return this.particlePool[i];
            }
        }
        
        // Si le pool est plein, créer une nouvelle particule
        return this.createParticleObject();
    }

    /**
     * Remet une particule dans le pool
     */
    returnParticleToPool(particle) {
        particle.active = false;
        // Réinitialisation des propriétés importantes
        particle.trail = null;
    }

    /**
     * Émet des particules à une position
     */
    emit(x, y, color = '#ffffff', options = {}) {
        const {
            count = 10,
            spread = Math.PI * 2,
            speed = 100,
            speedVariation = 0.5,
            life = 1,
            lifeVariation = 0.3,
            size = 2,
            sizeVariation = 0.5,
            gravity = 0,
            type = 'point',
            direction = null,
            burst = true
        } = options;
        
        const particles = [];
        
        for (let i = 0; i < count; i++) {
            if (this.particles.length >= this.maxParticles) break;
            
            const particle = this.getParticleFromPool();
            if (!particle) continue;
            
            // Position
            particle.x = x + (Math.random() - 0.5) * 10;
            particle.y = y + (Math.random() - 0.5) * 10;
            
            // Vélocité
            let angle;
            if (direction !== null) {
                angle = direction + (Math.random() - 0.5) * spread;
            } else {
                angle = (i / count) * Math.PI * 2 + Math.random() * spread;
            }
            
            const particleSpeed = speed * (1 + (Math.random() - 0.5) * speedVariation);
            particle.vx = Math.cos(angle) * particleSpeed;
            particle.vy = Math.sin(angle) * particleSpeed;
            
            // Propriétés visuelles
            particle.life = 0;
            particle.maxLife = life * (1 + (Math.random() - 0.5) * lifeVariation);
            
            const particleSize = size * (1 + (Math.random() - 0.5) * sizeVariation);
            particle.size = particleSize;
            particle.startSize = particleSize;
            particle.endSize = particleSize * 0.1;
            
            particle.color = color;
            particle.startColor = color;
            particle.endColor = this.fadeColor(color, 0.2);
            
            particle.alpha = 1;
            particle.startAlpha = 1;
            particle.endAlpha = 0;
            
            particle.type = type;
            particle.gravity = gravity;
            particle.rotation = Math.random() * Math.PI * 2;
            particle.angularVelocity = (Math.random() - 0.5) * 0.2;
            particle.active = true;
            
            this.particles.push(particle);
            particles.push(particle);
        }
        
        return particles;
    }

    /**
     * Crée un émetteur continu
     */
    createEmitter(x, y, emissionRate, particleOptions = {}) {
        const emitter = {
            x, y,
            emissionRate, // particules par seconde
            lastEmission: 0,
            particleOptions,
            active: true,
            life: -1, // -1 = infini
            maxLife: -1
        };
        
        this.emitters.push(emitter);
        return emitter;
    }

    /**
     * Met à jour toutes les particules
     */
    update(deltaTime) {
        // Mise à jour des émetteurs
        this.updateEmitters(deltaTime);
        
        // Mise à jour des particules
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            
            if (!this.updateParticle(particle, deltaTime)) {
                // Particule morte
                this.returnParticleToPool(particle);
                this.particles.splice(i, 1);
            }
        }
    }

    /**
     * Met à jour un émetteur
     */
    updateEmitters(deltaTime) {
        for (let i = this.emitters.length - 1; i >= 0; i--) {
            const emitter = this.emitters[i];
            
            if (!emitter.active) {
                this.emitters.splice(i, 1);
                continue;
            }
            
            // Vérification de la durée de vie
            if (emitter.maxLife > 0) {
                emitter.life += deltaTime;
                if (emitter.life >= emitter.maxLife) {
                    emitter.active = false;
                    continue;
                }
            }
            
            // Émission de particules
            const timeSinceLastEmission = Date.now() - emitter.lastEmission;
            const emissionInterval = 1000 / emitter.emissionRate;
            
            if (timeSinceLastEmission >= emissionInterval) {
                const emissionCount = Math.floor(timeSinceLastEmission / emissionInterval);
                
                for (let j = 0; j < emissionCount; j++) {
                    this.emit(emitter.x, emitter.y, emitter.particleOptions.color || '#ffffff', {
                        count: 1,
                        ...emitter.particleOptions
                    });
                }
                
                emitter.lastEmission = Date.now();
            }
        }
    }

    /**
     * Met à jour une particule individuelle
     */
    updateParticle(particle, deltaTime) {
        particle.life += deltaTime;
        
        if (particle.life >= particle.maxLife) {
            return false; // Particule morte
        }
        
        const progress = particle.life / particle.maxLife;
        
        // Mise à jour de la physique
        particle.x += particle.vx * deltaTime;
        particle.y += particle.vy * deltaTime;
        
        // Gravité
        if (particle.gravity !== 0) {
            particle.vy += particle.gravity * deltaTime * 60;
        }
        
        // Friction
        if (particle.friction !== 1) {
            particle.vx *= Math.pow(particle.friction, deltaTime * 60);
            particle.vy *= Math.pow(particle.friction, deltaTime * 60);
        }
        
        // Rotation
        particle.rotation += particle.angularVelocity * deltaTime;
        
        // Interpolation des propriétés visuelles
        particle.size = this.lerp(particle.startSize, particle.endSize, progress);
        particle.alpha = this.lerp(particle.startAlpha, particle.endAlpha, progress);
        
        // Interpolation de couleur (simplifiée)
        if (particle.startColor !== particle.endColor) {
            particle.color = this.lerpColor(particle.startColor, particle.endColor, progress);
        }
        
        return true;
    }

    /**
     * Effectue le rendu de toutes les particules
     */
    render(ctx) {
        if (this.particles.length === 0) return;
        
        ctx.save();
        
        // Tri des particules par type pour optimiser le rendu
        const particlesByType = {};
        this.particles.forEach(particle => {
            if (!particlesByType[particle.type]) {
                particlesByType[particle.type] = [];
            }
            particlesByType[particle.type].push(particle);
        });
        
        // Rendu par type
        Object.keys(particlesByType).forEach(type => {
            this.renderParticleType(ctx, type, particlesByType[type]);
        });
        
        ctx.restore();
    }

    /**
     * Rendu d'un type de particules
     */
    renderParticleType(ctx, type, particles) {
        switch (type) {
            case 'point':
                this.renderPointParticles(ctx, particles);
                break;
            case 'circle':
                this.renderCircleParticles(ctx, particles);
                break;
            case 'star':
                this.renderStarParticles(ctx, particles);
                break;
            case 'trail':
                this.renderTrailParticles(ctx, particles);
                break;
            case 'spark':
                this.renderSparkParticles(ctx, particles);
                break;
            default:
                this.renderPointParticles(ctx, particles);
        }
    }

    /**
     * Rendu des particules points
     */
    renderPointParticles(ctx, particles) {
        particles.forEach(particle => {
            ctx.globalAlpha = particle.alpha;
            ctx.fillStyle = particle.color;
            ctx.fillRect(
                Math.round(particle.x - particle.size / 2),
                Math.round(particle.y - particle.size / 2),
                Math.max(1, Math.round(particle.size)),
                Math.max(1, Math.round(particle.size))
            );
        });
    }

    /**
     * Rendu des particules circulaires
     */
    renderCircleParticles(ctx, particles) {
        particles.forEach(particle => {
            ctx.globalAlpha = particle.alpha;
            ctx.fillStyle = particle.color;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size / 2, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    /**
     * Rendu des particules étoiles
     */
    renderStarParticles(ctx, particles) {
        particles.forEach(particle => {
            ctx.save();
            ctx.translate(particle.x, particle.y);
            ctx.rotate(particle.rotation);
            ctx.globalAlpha = particle.alpha;
            ctx.fillStyle = particle.color;
            
            const size = particle.size;
            const points = 5;
            
            ctx.beginPath();
            for (let i = 0; i < points * 2; i++) {
                const angle = (i / (points * 2)) * Math.PI * 2;
                const radius = i % 2 === 0 ? size : size * 0.4;
                const x = Math.cos(angle) * radius;
                const y = Math.sin(angle) * radius;
                
                if (i === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
            ctx.closePath();
            ctx.fill();
            
            ctx.restore();
        });
    }

    /**
     * Rendu des particules traînées
     */
    renderTrailParticles(ctx, particles) {
        particles.forEach(particle => {
            if (!particle.trail) {
                particle.trail = [{ x: particle.x, y: particle.y }];
            }
            
            // Ajout de la position actuelle
            particle.trail.push({ x: particle.x, y: particle.y });
            
            // Limitation de la longueur de la traînée
            const maxTrailLength = 10;
            if (particle.trail.length > maxTrailLength) {
                particle.trail.shift();
            }
            
            // Rendu de la traînée
            ctx.strokeStyle = particle.color;
            ctx.lineWidth = particle.size;
            ctx.lineCap = 'round';
            ctx.globalAlpha = particle.alpha;
            
            ctx.beginPath();
            particle.trail.forEach((point, index) => {
                const trailAlpha = (index / particle.trail.length) * particle.alpha;
                ctx.globalAlpha = trailAlpha;
                
                if (index === 0) {
                    ctx.moveTo(point.x, point.y);
                } else {
                    ctx.lineTo(point.x, point.y);
                }
            });
            ctx.stroke();
        });
    }

    /**
     * Rendu des particules étincelles
     */
    renderSparkParticles(ctx, particles) {
        particles.forEach(particle => {
            ctx.save();
            ctx.translate(particle.x, particle.y);
            ctx.rotate(particle.rotation);
            ctx.globalAlpha = particle.alpha;
            ctx.strokeStyle = particle.color;
            ctx.lineWidth = Math.max(1, particle.size * 0.3);
            ctx.lineCap = 'round';
            
            const length = particle.size;
            ctx.beginPath();
            ctx.moveTo(-length / 2, 0);
            ctx.lineTo(length / 2, 0);
            ctx.moveTo(0, -length / 2);
            ctx.lineTo(0, length / 2);
            ctx.stroke();
            
            ctx.restore();
        });
    }

    /**
     * Effets prédéfinis
     */
    
    explosion(x, y, color = '#ff6600', intensity = 1) {
        const count = Math.floor(20 * intensity);
        return this.emit(x, y, color, {
            count,
            speed: 150 * intensity,
            speedVariation: 0.8,
            life: 1.5,
            lifeVariation: 0.5,
            size: 3 * intensity,
            sizeVariation: 0.7,
            type: 'spark',
            gravity: 50
        });
    }
    
    collectEffect(x, y, color = '#00ff88') {
        return this.emit(x, y, color, {
            count: 8,
            speed: 80,
            speedVariation: 0.3,
            life: 0.8,
            size: 2,
            type: 'star'
        });
    }
    
    magicSparkles(x, y, color = '#ffffff') {
        return this.emit(x, y, color, {
            count: 15,
            speed: 30,
            speedVariation: 0.6,
            life: 2,
            lifeVariation: 0.5,
            size: 1.5,
            type: 'circle',
            gravity: -20
        });
    }
    
    smokeTrail(x, y, color = '#666666') {
        return this.emit(x, y, color, {
            count: 5,
            speed: 20,
            speedVariation: 0.8,
            life: 3,
            lifeVariation: 1,
            size: 4,
            sizeVariation: 0.5,
            type: 'circle',
            friction: 0.95
        });
    }

    /**
     * Utilitaires
     */
    
    lerp(start, end, t) {
        return start + (end - start) * t;
    }
    
    lerpColor(startColor, endColor, t) {
        // Interpolation de couleur simplifiée (hex)
        if (startColor === endColor) return startColor;
        
        // Pour une implementation complète, parser les couleurs hex/rgb
        // Ici on fait une approximation simple
        const opacity = Math.floor((1 - t) * 255).toString(16).padStart(2, '0');
        return startColor + opacity;
    }
    
    fadeColor(color, opacity) {
        const alpha = Math.floor(opacity * 255).toString(16).padStart(2, '0');
        return color + alpha;
    }

    /**
     * Gestion avancée
     */
    
    stopEmitter(emitter) {
        emitter.active = false;
    }
    
    moveEmitter(emitter, x, y) {
        emitter.x = x;
        emitter.y = y;
    }
    
    clearAllParticles() {
        this.particles.forEach(particle => this.returnParticleToPool(particle));
        this.particles = [];
    }
    
    clearAllEmitters() {
        this.emitters = [];
    }
    
    getParticleCount() {
        return this.particles.length;
    }
    
    getActiveEmitterCount() {
        return this.emitters.filter(e => e.active).length;
    }

    /**
     * Configuration et optimisation
     */
    
    setMaxParticles(max) {
        this.maxParticles = max;
        
        // Suppression des particules excédentaires si nécessaire
        if (this.particles.length > max) {
            const excess = this.particles.splice(max);
            excess.forEach(particle => this.returnParticleToPool(particle));
        }
    }
    
    optimizePerformance() {
        // Suppression des particules les plus anciennes si trop nombreuses
        if (this.particles.length > this.maxParticles * 0.8) {
            this.particles.sort((a, b) => b.life - a.life);
            const toRemove = this.particles.splice(this.maxParticles * 0.6);
            toRemove.forEach(particle => this.returnParticleToPool(particle));
        }
        
        // Suppression des émetteurs inactifs
        this.emitters = this.emitters.filter(e => e.active);
    }
}