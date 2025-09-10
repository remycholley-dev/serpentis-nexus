/**
 * Classe GravityWell - Puits gravitationnels qui affectent le mouvement des serpents
 * Implémente différents types de puits avec effets variés
 */

export class GravityWell {
    constructor(x, y, strength = 1, radius = 50, type = 'attract') {
        this.x = x;
        this.y = y;
        this.strength = strength;
        this.radius = radius;
        this.type = type; // 'attract', 'repel', 'vortex', 'pulse'
        
        // État du puits
        this.active = true;
        this.phase = 0;
        this.pulseTimer = 0;
        this.vortexRotation = 0;
        
        // Propriétés visuelles
        this.colors = {
            attract: { primary: '#0088ff', secondary: '#004488' },
            repel: { primary: '#ff4400', secondary: '#884400' },
            vortex: { primary: '#ff00ff', secondary: '#880088' },
            pulse: { primary: '#00ff00', secondary: '#008800' }
        };
        
        // Particules pour l'effet visuel
        this.particles = [];
        this.initializeParticles();
    }

    /**
     * Initialise les particules d'effet
     */
    initializeParticles() {
        const particleCount = Math.floor(this.radius / 5);
        
        for (let i = 0; i < particleCount; i++) {
            const angle = (i / particleCount) * Math.PI * 2;
            const distance = Math.random() * this.radius;
            
            this.particles.push({
                x: this.x + Math.cos(angle) * distance,
                y: this.y + Math.sin(angle) * distance,
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 2,
                life: Math.random(),
                maxLife: 1 + Math.random(),
                size: 1 + Math.random() * 2
            });
        }
    }

    /**
     * Met à jour le puits gravitationnel
     */
    update(deltaTime) {
        if (!this.active) return;
        
        this.phase += deltaTime;
        
        // Mise à jour selon le type
        switch (this.type) {
            case 'pulse':
                this.updatePulse(deltaTime);
                break;
            case 'vortex':
                this.updateVortex(deltaTime);
                break;
        }
        
        // Mise à jour des particules
        this.updateParticles(deltaTime);
    }

    /**
     * Mise à jour du type pulse
     */
    updatePulse(deltaTime) {
        this.pulseTimer += deltaTime;
        
        // Pulsation toutes les 2 secondes
        if (this.pulseTimer >= 2) {
            this.pulseTimer = 0;
            this.createPulseWave();
        }
    }

    /**
     * Mise à jour du type vortex
     */
    updateVortex(deltaTime) {
        this.vortexRotation += deltaTime * 2;
    }

    /**
     * Crée une onde de pulse
     */
    createPulseWave() {
        // Ajout de particules pour l'onde
        const waveParticles = 20;
        for (let i = 0; i < waveParticles; i++) {
            const angle = (i / waveParticles) * Math.PI * 2;
            this.particles.push({
                x: this.x,
                y: this.y,
                vx: Math.cos(angle) * 100,
                vy: Math.sin(angle) * 100,
                life: 0,
                maxLife: 0.5,
                size: 3,
                isPulse: true
            });
        }
    }

    /**
     * Met à jour les particules
     */
    updateParticles(deltaTime) {
        this.particles.forEach(particle => {
            // Mouvement selon le type de puits
            switch (this.type) {
                case 'attract':
                    this.updateParticleAttract(particle, deltaTime);
                    break;
                case 'repel':
                    this.updateParticleRepel(particle, deltaTime);
                    break;
                case 'vortex':
                    this.updateParticleVortex(particle, deltaTime);
                    break;
                case 'pulse':
                    if (!particle.isPulse) {
                        this.updateParticleAttract(particle, deltaTime);
                    }
                    break;
            }
            
            // Mouvement et vie
            if (!particle.isPulse) {
                particle.x += particle.vx * deltaTime;
                particle.y += particle.vy * deltaTime;
            } else {
                particle.x += particle.vx * deltaTime;
                particle.y += particle.vy * deltaTime;
                particle.vx *= 0.95; // Friction
                particle.vy *= 0.95;
            }
            
            particle.life += deltaTime;
            
            // Régénération des particules normales
            if (!particle.isPulse && particle.life >= particle.maxLife) {
                const angle = Math.random() * Math.PI * 2;
                const distance = Math.random() * this.radius;
                particle.x = this.x + Math.cos(angle) * distance;
                particle.y = this.y + Math.sin(angle) * distance;
                particle.life = 0;
                particle.maxLife = 1 + Math.random();
            }
        });
        
        // Suppression des particules de pulse expirées
        this.particles = this.particles.filter(particle => 
            !particle.isPulse || particle.life < particle.maxLife
        );
    }

    /**
     * Mise à jour particule avec attraction
     */
    updateParticleAttract(particle, deltaTime) {
        const dx = this.x - particle.x;
        const dy = this.y - particle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            const force = this.strength * 20 / (distance + 1);
            particle.vx += (dx / distance) * force * deltaTime;
            particle.vy += (dy / distance) * force * deltaTime;
        }
        
        // Limitation de la vitesse
        const maxSpeed = 50;
        const speed = Math.sqrt(particle.vx * particle.vx + particle.vy * particle.vy);
        if (speed > maxSpeed) {
            particle.vx = (particle.vx / speed) * maxSpeed;
            particle.vy = (particle.vy / speed) * maxSpeed;
        }
    }

    /**
     * Mise à jour particule avec répulsion
     */
    updateParticleRepel(particle, deltaTime) {
        const dx = this.x - particle.x;
        const dy = this.y - particle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0 && distance < this.radius) {
            const force = this.strength * 30 / (distance + 1);
            particle.vx -= (dx / distance) * force * deltaTime;
            particle.vy -= (dy / distance) * force * deltaTime;
        }
    }

    /**
     * Mise à jour particule avec vortex
     */
    updateParticleVortex(particle, deltaTime) {
        const dx = this.x - particle.x;
        const dy = this.y - particle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            // Force centripète
            const force = this.strength * 15 / (distance + 1);
            particle.vx += (dx / distance) * force * deltaTime;
            particle.vy += (dy / distance) * force * deltaTime;
            
            // Force tangentielle (rotation)
            const tangentX = -dy / distance;
            const tangentY = dx / distance;
            particle.vx += tangentX * this.strength * 30 * deltaTime;
            particle.vy += tangentY * this.strength * 30 * deltaTime;
        }
    }

    /**
     * Applique la gravité sur un serpent
     */
    applyGravity(snake) {
        if (!this.active || !snake.alive) return;
        
        const head = snake.getHead();
        const dx = this.x - (head.x + 0.5);
        const dy = this.y - (head.y + 0.5);
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Vérification de la portée
        if (distance > this.radius / 20) return; // Conversion en unités de grille
        
        let forceX = 0;
        let forceY = 0;
        
        switch (this.type) {
            case 'attract':
                forceX = this.calculateAttractiveForce(dx, dy, distance);
                forceY = this.calculateAttractiveForce(dx, dy, distance, true);
                break;
                
            case 'repel':
                forceX = -this.calculateAttractiveForce(dx, dy, distance);
                forceY = -this.calculateAttractiveForce(dx, dy, distance, true);
                break;
                
            case 'vortex':
                const attractForce = this.calculateAttractiveForce(dx, dy, distance);
                const tangentForce = this.calculateTangentialForce(dx, dy, distance);
                
                forceX = attractForce - dy / distance * tangentForce;
                forceY = this.calculateAttractiveForce(dx, dy, distance, true) + dx / distance * tangentForce;
                break;
                
            case 'pulse':
                const pulseIntensity = Math.sin(this.phase * 3) * 0.5 + 0.5;
                const baseForce = this.calculateAttractiveForce(dx, dy, distance) * pulseIntensity;
                forceX = baseForce;
                forceY = this.calculateAttractiveForce(dx, dy, distance, true) * pulseIntensity;
                break;
        }
        
        // Application de la force sur le serpent
        snake.applyGravitationalForce(forceX, forceY);
    }

    /**
     * Calcule la force attractive
     */
    calculateAttractiveForce(dx, dy, distance, isY = false) {
        if (distance === 0) return 0;
        
        const component = isY ? dy : dx;
        const force = this.strength * component / (distance * distance + 1);
        
        return Math.max(-0.5, Math.min(0.5, force)); // Limitation de la force
    }

    /**
     * Calcule la force tangentielle pour le vortex
     */
    calculateTangentialForce(dx, dy, distance) {
        return this.strength * 0.3 / (distance + 1);
    }

    /**
     * Vérifie si un point est dans la zone d'influence
     */
    isInRange(x, y) {
        const dx = this.x - x;
        const dy = this.y - y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance <= this.radius;
    }

    /**
     * Active ou désactive le puits
     */
    setActive(active) {
        this.active = active;
    }

    /**
     * Change le type du puits
     */
    setType(type) {
        this.type = type;
        this.particles = [];
        this.initializeParticles();
    }

    /**
     * Effectue le rendu du puits gravitationnel
     */
    render(ctx, gridSize) {
        if (!this.active) return;
        
        const screenX = this.x * gridSize;
        const screenY = this.y * gridSize;
        const screenRadius = this.radius;
        
        // Sauvegarde du contexte
        ctx.save();
        
        // Zone d'influence
        this.renderInfluenceZone(ctx, screenX, screenY, screenRadius);
        
        // Particules
        this.renderParticles(ctx, gridSize);
        
        // Centre du puits
        this.renderCore(ctx, screenX, screenY);
        
        // Effets spéciaux selon le type
        this.renderSpecialEffects(ctx, screenX, screenY);
        
        ctx.restore();
    }

    /**
     * Rendu de la zone d'influence
     */
    renderInfluenceZone(ctx, x, y, radius) {
        const colors = this.colors[this.type];
        
        // Gradient radial
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
        gradient.addColorStop(0, colors.primary + '30');
        gradient.addColorStop(0.7, colors.primary + '10');
        gradient.addColorStop(1, colors.primary + '00');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Bordure
        ctx.strokeStyle = colors.primary + '40';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
    }

    /**
     * Rendu des particules
     */
    renderParticles(ctx, gridSize) {
        const colors = this.colors[this.type];
        
        this.particles.forEach(particle => {
            const alpha = Math.max(0, 1 - (particle.life / particle.maxLife));
            const screenX = particle.x * gridSize;
            const screenY = particle.y * gridSize;
            
            if (particle.isPulse) {
                // Particules de pulse
                ctx.fillStyle = colors.primary + Math.floor(alpha * 255).toString(16).padStart(2, '0');
                ctx.beginPath();
                ctx.arc(screenX, screenY, particle.size, 0, Math.PI * 2);
                ctx.fill();
            } else {
                // Particules normales
                ctx.fillStyle = colors.secondary + Math.floor(alpha * 180).toString(16).padStart(2, '0');
                ctx.fillRect(screenX - particle.size/2, screenY - particle.size/2, particle.size, particle.size);
            }
        });
    }

    /**
     * Rendu du noyau central
     */
    renderCore(ctx, x, y) {
        const colors = this.colors[this.type];
        const pulse = Math.sin(this.phase * 4) * 0.2 + 0.8;
        const coreRadius = 8 * pulse;
        
        // Noyau principal
        const coreGradient = ctx.createRadialGradient(x, y, 0, x, y, coreRadius);
        coreGradient.addColorStop(0, '#ffffff');
        coreGradient.addColorStop(0.5, colors.primary);
        coreGradient.addColorStop(1, colors.secondary);
        
        ctx.fillStyle = coreGradient;
        ctx.beginPath();
        ctx.arc(x, y, coreRadius, 0, Math.PI * 2);
        ctx.fill();
        
        // Halo
        ctx.shadowColor = colors.primary;
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(x, y, coreRadius * 0.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    }

    /**
     * Rendu des effets spéciaux
     */
    renderSpecialEffects(ctx, x, y) {
        const colors = this.colors[this.type];
        
        switch (this.type) {
            case 'vortex':
                this.renderVortexEffect(ctx, x, y, colors);
                break;
            case 'pulse':
                this.renderPulseEffect(ctx, x, y, colors);
                break;
            case 'repel':
                this.renderRepelEffect(ctx, x, y, colors);
                break;
        }
    }

    /**
     * Effet spécial pour le vortex
     */
    renderVortexEffect(ctx, x, y, colors) {
        ctx.strokeStyle = colors.primary + '60';
        ctx.lineWidth = 2;
        
        for (let i = 0; i < 3; i++) {
            const radius = (i + 1) * 15;
            const rotation = this.vortexRotation + i * Math.PI / 3;
            
            ctx.beginPath();
            for (let angle = 0; angle < Math.PI * 2; angle += 0.1) {
                const spiralRadius = radius * (1 + Math.sin(angle * 2 + rotation) * 0.1);
                const px = x + Math.cos(angle + rotation) * spiralRadius;
                const py = y + Math.sin(angle + rotation) * spiralRadius;
                
                if (angle === 0) {
                    ctx.moveTo(px, py);
                } else {
                    ctx.lineTo(px, py);
                }
            }
            ctx.stroke();
        }
    }

    /**
     * Effet spécial pour le pulse
     */
    renderPulseEffect(ctx, x, y, colors) {
        const pulseRadius = Math.sin(this.phase * 3) * 20 + 25;
        const alpha = Math.max(0, 1 - Math.abs(Math.sin(this.phase * 3)));
        
        ctx.strokeStyle = colors.primary + Math.floor(alpha * 100).toString(16).padStart(2, '0');
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x, y, pulseRadius, 0, Math.PI * 2);
        ctx.stroke();
    }

    /**
     * Effet spécial pour la répulsion
     */
    renderRepelEffect(ctx, x, y, colors) {
        const time = Date.now() * 0.005;
        
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2 + time;
            const startRadius = 10;
            const endRadius = 30;
            
            const startX = x + Math.cos(angle) * startRadius;
            const startY = y + Math.sin(angle) * startRadius;
            const endX = x + Math.cos(angle) * endRadius;
            const endY = y + Math.sin(angle) * endRadius;
            
            const gradient = ctx.createLinearGradient(startX, startY, endX, endY);
            gradient.addColorStop(0, colors.primary + '80');
            gradient.addColorStop(1, colors.primary + '00');
            
            ctx.strokeStyle = gradient;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.lineTo(endX, endY);
            ctx.stroke();
            
            // Pointe de flèche
            ctx.fillStyle = colors.primary + '60';
            ctx.beginPath();
            ctx.arc(endX, endY, 2, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}