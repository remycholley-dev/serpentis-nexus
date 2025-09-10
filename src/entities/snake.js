/**
 * Classe Snake avec système de segments modulaires
 * Implémente différents types de segments avec comportements uniques
 */

export class Snake {
    constructor(x, y, type = 'player') {
        this.type = type;
        this.segments = [{ x, y, type: 'head' }];
        this.direction = { x: 1, y: 0 };
        this.nextDirection = { x: 1, y: 0 };
        this.alive = true;
        
        // Système de segments modulaires
        this.segmentTypes = {
            normal: { color: '#00ff88', effect: null },
            armored: { color: '#ffaa00', effect: 'armor' },
            booster: { color: '#ff0088', effect: 'speed' },
            magnetic: { color: '#8800ff', effect: 'attract' }
        };
        
        // État du serpent
        this.speed = 1;
        this.baseSpeed = 1;
        this.boostActive = false;
        this.boostCooldown = 0;
        this.invulnerable = false;
        this.invulnerabilityTime = 0;
        
        // Effets gravitationnels
        this.velocity = { x: 0, y: 0 };
        this.gravitationalForce = { x: 0, y: 0 };
        
        // Power-ups actifs
        this.activePowerUps = new Map();
        
        // Couleurs selon le type
        this.colors = type === 'player' ? {
            head: '#00ff88',
            normal: '#008844',
            armored: '#ffaa00',
            booster: '#ff0088',
            magnetic: '#8800ff'
        } : {
            head: '#ff4444',
            normal: '#aa2222',
            armored: '#ff8800',
            booster: '#ff00aa',
            magnetic: '#aa00ff'
        };
    }

    /**
     * Réinitialise le serpent à une position donnée
     */
    reset(x, y) {
        this.segments = [{ x, y, type: 'head' }];
        this.direction = { x: 1, y: 0 };
        this.nextDirection = { x: 1, y: 0 };
        this.alive = true;
        this.speed = this.baseSpeed;
        this.boostActive = false;
        this.boostCooldown = 0;
        this.invulnerable = false;
        this.invulnerabilityTime = 0;
        this.velocity = { x: 0, y: 0 };
        this.gravitationalForce = { x: 0, y: 0 };
        this.activePowerUps.clear();
    }

    /**
     * Définit la direction du serpent
     */
    setDirection(direction) {
        if (!this.alive) return;
        
        // Empêche le serpent de faire demi-tour
        const opposite = {
            up: 'down', down: 'up',
            left: 'right', right: 'left'
        };
        
        if (opposite[direction] === this.getCurrentDirectionName()) {
            return;
        }
        
        const directions = {
            up: { x: 0, y: -1 },
            down: { x: 0, y: 1 },
            left: { x: -1, y: 0 },
            right: { x: 1, y: 0 }
        };
        
        this.nextDirection = directions[direction] || this.nextDirection;
    }

    /**
     * Retourne le nom de la direction actuelle
     */
    getCurrentDirectionName() {
        const { x, y } = this.direction;
        if (x === 0 && y === -1) return 'up';
        if (x === 0 && y === 1) return 'down';
        if (x === -1 && y === 0) return 'left';
        if (x === 1 && y === 0) return 'right';
        return 'right';
    }

    /**
     * Active le boost
     */
    activateBoost() {
        if (!this.alive || this.boostCooldown > 0) return;
        
        // Vérification si le serpent a des segments propulseurs
        const boosterSegments = this.segments.filter(seg => seg.type === 'booster').length;
        if (boosterSegments === 0) return;
        
        this.boostActive = true;
        this.speed = this.baseSpeed * (1 + boosterSegments * 0.5);
        this.boostCooldown = 3000; // 3 secondes de cooldown
        
        // Le boost dure proportionnellement au nombre de segments propulseurs
        setTimeout(() => {
            this.boostActive = false;
            this.speed = this.baseSpeed;
        }, 1000 + boosterSegments * 200);
    }

    /**
     * Définit l'invulnérabilité temporaire
     */
    setInvulnerable(duration) {
        this.invulnerable = true;
        this.invulnerabilityTime = duration;
    }

    /**
     * Fait grandir le serpent avec un type de segment spécifique
     */
    grow(segmentType = 'normal') {
        if (!this.alive) return;
        
        const tail = this.segments[this.segments.length - 1];
        this.segments.push({
            x: tail.x,
            y: tail.y,
            type: segmentType
        });
        
        this.updateSegmentEffects();
    }

    /**
     * Met à jour les effets des segments
     */
    updateSegmentEffects() {
        // Recalcul des effets basés sur les segments
        const segmentCounts = {};
        this.segments.forEach(segment => {
            segmentCounts[segment.type] = (segmentCounts[segment.type] || 0) + 1;
        });
        
        // Effet des segments blindés : résistance
        if (segmentCounts.armored > 0) {
            this.activePowerUps.set('armor', {
                name: 'Blindage',
                level: segmentCounts.armored,
                duration: -1 // Permanent tant que les segments existent
            });
        } else {
            this.activePowerUps.delete('armor');
        }
        
        // Effet des segments magnétiques : attraction
        if (segmentCounts.magnetic > 0) {
            this.activePowerUps.set('magnetism', {
                name: 'Magnétisme',
                level: segmentCounts.magnetic,
                duration: -1,
                range: segmentCounts.magnetic * 30
            });
        } else {
            this.activePowerUps.delete('magnetism');
        }
    }

    /**
     * Applique une force gravitationnelle
     */
    applyGravitationalForce(fx, fy) {
        this.gravitationalForce.x += fx;
        this.gravitationalForce.y += fy;
    }

    /**
     * Met à jour le serpent
     */
    update(deltaTime) {
        if (!this.alive) return;
        
        // Mise à jour des cooldowns
        if (this.boostCooldown > 0) {
            this.boostCooldown -= deltaTime * 1000;
        }
        
        if (this.invulnerabilityTime > 0) {
            this.invulnerabilityTime -= deltaTime * 1000;
            if (this.invulnerabilityTime <= 0) {
                this.invulnerable = false;
            }
        }
        
        // Application de la direction suivante
        this.direction = { ...this.nextDirection };
        
        // Calcul du mouvement avec effets gravitationnels
        let moveX = this.direction.x * this.speed;
        let moveY = this.direction.y * this.speed;
        
        // Application des forces gravitationnelles (atténuées)
        moveX += this.gravitationalForce.x * 0.3;
        moveY += this.gravitationalForce.y * 0.3;
        
        // Déplacement des segments
        this.moveSegments(Math.round(moveX), Math.round(moveY));
        
        // Réinitialisation des forces
        this.gravitationalForce = { x: 0, y: 0 };
    }

    /**
     * Déplace les segments du serpent
     */
    moveSegments(dx, dy) {
        if (this.segments.length === 0) return;
        
        // Sauvegarde des positions
        const previousPositions = this.segments.map(segment => ({ x: segment.x, y: segment.y }));
        
        // Déplacement de la tête
        this.segments[0].x += dx;
        this.segments[0].y += dy;
        
        // Déplacement du corps
        for (let i = 1; i < this.segments.length; i++) {
            this.segments[i].x = previousPositions[i - 1].x;
            this.segments[i].y = previousPositions[i - 1].y;
        }
    }

    /**
     * Retourne la tête du serpent
     */
    getHead() {
        return this.segments[0];
    }

    /**
     * Retourne la queue du serpent
     */
    getTail() {
        return this.segments[this.segments.length - 1];
    }

    /**
     * Retourne les power-ups actifs
     */
    getActivePowerUps() {
        return Array.from(this.activePowerUps.values());
    }

    /**
     * Vérifie si le serpent a un effet spécifique
     */
    hasEffect(effectName) {
        return this.activePowerUps.has(effectName);
    }

    /**
     * Retourne le niveau d'un effet
     */
    getEffectLevel(effectName) {
        const powerUp = this.activePowerUps.get(effectName);
        return powerUp ? powerUp.level : 0;
    }

    /**
     * Calcule la portée magnétique
     */
    getMagneticRange() {
        const magnetism = this.activePowerUps.get('magnetism');
        return magnetism ? magnetism.range : 0;
    }

    /**
     * Vérifie si le serpent peut survivre à une collision
     */
    canSurviveCollision() {
        return this.invulnerable || this.hasEffect('armor');
    }

    /**
     * Gère les dégâts subis
     */
    takeDamage() {
        if (this.invulnerable) return false;
        
        // Les segments blindés offrent une chance de survie
        const armorLevel = this.getEffectLevel('armor');
        if (armorLevel > 0) {
            const survivalChance = Math.min(armorLevel * 0.2, 0.8);
            if (Math.random() < survivalChance) {
                // Perte d'un segment blindé au lieu de mourir
                this.removeArmoredSegment();
                this.setInvulnerable(1000); // Invulnérabilité temporaire
                return false;
            }
        }
        
        this.alive = false;
        return true;
    }

    /**
     * Supprime un segment blindé
     */
    removeArmoredSegment() {
        for (let i = this.segments.length - 1; i > 0; i--) {
            if (this.segments[i].type === 'armored') {
                this.segments.splice(i, 1);
                this.updateSegmentEffects();
                break;
            }
        }
    }

    /**
     * Effectue le rendu du serpent
     */
    render(ctx, gridSize) {
        if (!this.alive) return;
        
        this.segments.forEach((segment, index) => {
            const x = segment.x * gridSize;
            const y = segment.y * gridSize;
            
            // Effet de clignotement si invulnérable
            if (this.invulnerable && Math.floor(Date.now() / 200) % 2) {
                return;
            }
            
            // Couleur selon le type de segment
            let color = this.colors[segment.type] || this.colors.normal;
            
            // Effet de boost
            if (this.boostActive && segment.type === 'booster') {
                const pulse = Math.sin(Date.now() * 0.01) * 0.3 + 0.7;
                color = this.interpolateColor(color, '#ffffff', 1 - pulse);
            }
            
            // Rendu du segment
            if (index === 0) {
                // Tête du serpent
                this.renderHead(ctx, x, y, gridSize, color);
            } else {
                // Corps du serpent
                this.renderSegment(ctx, x, y, gridSize, color, segment.type);
            }
        });
        
        // Rendu des effets spéciaux
        this.renderEffects(ctx, gridSize);
    }

    /**
     * Rendu de la tête du serpent
     */
    renderHead(ctx, x, y, gridSize, color) {
        const centerX = x + gridSize / 2;
        const centerY = y + gridSize / 2;
        const radius = gridSize * 0.4;
        
        // Corps de la tête
        ctx.fillStyle = color;
        ctx.fillRect(x + 2, y + 2, gridSize - 4, gridSize - 4);
        
        // Halo
        const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius * 1.5);
        gradient.addColorStop(0, color + '40');
        gradient.addColorStop(1, color + '00');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius * 1.5, 0, Math.PI * 2);
        ctx.fill();
        
        // Yeux
        ctx.fillStyle = '#ffffff';
        const eyeSize = gridSize * 0.1;
        ctx.fillRect(x + gridSize * 0.3, y + gridSize * 0.2, eyeSize, eyeSize);
        ctx.fillRect(x + gridSize * 0.6, y + gridSize * 0.2, eyeSize, eyeSize);
    }

    /**
     * Rendu d'un segment du corps
     */
    renderSegment(ctx, x, y, gridSize, color, segmentType) {
        // Segment de base
        ctx.fillStyle = color;
        ctx.fillRect(x + 3, y + 3, gridSize - 6, gridSize - 6);
        
        // Effets selon le type
        switch (segmentType) {
            case 'armored':
                this.renderArmoredEffect(ctx, x, y, gridSize);
                break;
            case 'booster':
                this.renderBoosterEffect(ctx, x, y, gridSize);
                break;
            case 'magnetic':
                this.renderMagneticEffect(ctx, x, y, gridSize);
                break;
        }
        
        // Bordure
        ctx.strokeStyle = '#ffffff20';
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 3, y + 3, gridSize - 6, gridSize - 6);
    }

    /**
     * Effet visuel pour segments blindés
     */
    renderArmoredEffect(ctx, x, y, gridSize) {
        ctx.strokeStyle = '#ffaa00';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x + gridSize * 0.2, y + gridSize * 0.8);
        ctx.lineTo(x + gridSize * 0.5, y + gridSize * 0.2);
        ctx.lineTo(x + gridSize * 0.8, y + gridSize * 0.8);
        ctx.stroke();
    }

    /**
     * Effet visuel pour segments propulseurs
     */
    renderBoosterEffect(ctx, x, y, gridSize) {
        if (this.boostActive) {
            const intensity = Math.sin(Date.now() * 0.02) * 0.5 + 0.5;
            ctx.fillStyle = `rgba(255, 255, 255, ${intensity * 0.5})`;
            ctx.fillRect(x + gridSize * 0.1, y + gridSize * 0.1, gridSize * 0.8, gridSize * 0.8);
        }
        
        // Flammes de propulsion
        ctx.fillStyle = '#ff4444';
        ctx.beginPath();
        ctx.moveTo(x + gridSize * 0.4, y + gridSize * 0.7);
        ctx.lineTo(x + gridSize * 0.6, y + gridSize * 0.7);
        ctx.lineTo(x + gridSize * 0.5, y + gridSize * 0.9);
        ctx.fill();
    }

    /**
     * Effet visuel pour segments magnétiques
     */
    renderMagneticEffect(ctx, x, y, gridSize) {
        const centerX = x + gridSize / 2;
        const centerY = y + gridSize / 2;
        const time = Date.now() * 0.005;
        
        // Champ magnétique ondulant
        for (let i = 0; i < 3; i++) {
            const radius = gridSize * (0.3 + i * 0.1) * (1 + Math.sin(time + i) * 0.1);
            ctx.strokeStyle = `rgba(136, 0, 255, ${(3 - i) * 0.1})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            ctx.stroke();
        }
    }

    /**
     * Rendu des effets spéciaux globaux
     */
    renderEffects(ctx, gridSize) {
        if (this.hasEffect('magnetism')) {
            const head = this.getHead();
            const centerX = head.x * gridSize + gridSize / 2;
            const centerY = head.y * gridSize + gridSize / 2;
            const range = this.getMagneticRange();
            
            // Champ magnétique global
            const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, range);
            gradient.addColorStop(0, '#8800ff10');
            gradient.addColorStop(0.8, '#8800ff05');
            gradient.addColorStop(1, '#8800ff00');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(centerX, centerY, range, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    /**
     * Interpole entre deux couleurs
     */
    interpolateColor(color1, color2, factor) {
        // Conversion hexadecimal vers RGB
        const hex1 = color1.replace('#', '');
        const hex2 = color2.replace('#', '');
        
        const r1 = parseInt(hex1.substr(0, 2), 16);
        const g1 = parseInt(hex1.substr(2, 2), 16);
        const b1 = parseInt(hex1.substr(4, 2), 16);
        
        const r2 = parseInt(hex2.substr(0, 2), 16);
        const g2 = parseInt(hex2.substr(2, 2), 16);
        const b2 = parseInt(hex2.substr(4, 2), 16);
        
        const r = Math.round(r1 + (r2 - r1) * factor);
        const g = Math.round(g1 + (g2 - g1) * factor);
        const b = Math.round(b1 + (b2 - b1) * factor);
        
        return `rgb(${r}, ${g}, ${b})`;
    }
}