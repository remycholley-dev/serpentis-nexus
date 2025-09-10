/**
 * Gestionnaire de constellations - système d'objectifs morphing
 * Gère les patterns de collecte et les transformations dynamiques
 */

export class ConstellationManager {
    constructor() {
        // Patterns de constellations disponibles
        this.patterns = {
            triangle: {
                name: 'Triangle Céleste',
                stars: ['alpha', 'beta', 'gamma'],
                description: 'Formez un triangle parfait',
                bonus: 150,
                colors: ['#ff6b6b', '#4ecdc4', '#45b7d1']
            },
            cross: {
                name: 'Croix Stellaire',
                stars: ['north', 'south', 'east', 'west', 'center'],
                description: 'Alignez les étoiles cardinales',
                bonus: 200,
                colors: ['#96ceb4', '#feca57', '#ff9ff3', '#54a0ff', '#5f27cd']
            },
            spiral: {
                name: 'Spirale Cosmique',
                stars: ['core', 'arm1', 'arm2', 'arm3', 'arm4', 'arm5'],
                description: 'Suivez la spirale galactique',
                bonus: 300,
                colors: ['#ffffff', '#ffd700', '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4']
            },
            diamond: {
                name: 'Diamant Éternel',
                stars: ['top', 'left', 'right', 'bottom'],
                description: 'Créez un diamant brillant',
                bonus: 180,
                colors: ['#e056fd', '#686de0', '#4834d4', '#30336b']
            }
        };
        
        // État actuel
        this.currentPattern = null;
        this.collectedStars = new Set();
        this.targetPattern = 'triangle';
        this.morphingActive = false;
        this.morphTimer = 0;
        this.completedPatterns = [];
        
        // Historique pour éviter les répétitions
        this.recentPatterns = [];
        
        this.setPattern(this.targetPattern);
    }

    /**
     * Définit le pattern de constellation actuel
     */
    setPattern(patternName) {
        if (!this.patterns[patternName]) {
            console.warn(`Pattern inconnu: ${patternName}`);
            return;
        }
        
        this.currentPattern = this.patterns[patternName];
        this.targetPattern = patternName;
        this.collectedStars.clear();
        this.morphingActive = false;
        this.morphTimer = 0;
        
        console.log(`Nouvelle constellation: ${this.currentPattern.name}`);
    }

    /**
     * Collecte une étoile
     */
    collectStar(starType) {
        if (!this.currentPattern) return false;
        
        // Vérification si l'étoile fait partie du pattern actuel
        if (!this.currentPattern.stars.includes(starType)) {
            return false;
        }
        
        // Vérification si déjà collectée
        if (this.collectedStars.has(starType)) {
            return false;
        }
        
        this.collectedStars.add(starType);
        
        console.log(`Étoile collectée: ${starType} (${this.collectedStars.size}/${this.currentPattern.stars.length})`);
        
        // Vérification de la completion
        if (this.collectedStars.size === this.currentPattern.stars.length) {
            return this.completeConstellation();
        }
        
        return false;
    }

    /**
     * Finalise une constellation
     */
    completeConstellation() {
        console.log(`Constellation complétée: ${this.currentPattern.name}!`);
        
        this.completedPatterns.push({
            pattern: this.targetPattern,
            name: this.currentPattern.name,
            completedAt: Date.now(),
            bonus: this.currentPattern.bonus
        });
        
        // Déclenchement du morphing vers le prochain pattern
        this.startMorphing();
        
        return true;
    }

    /**
     * Démarre le processus de morphing
     */
    startMorphing() {
        this.morphingActive = true;
        this.morphTimer = 3000; // 3 secondes de morphing
        
        // Sélection du prochain pattern
        const nextPattern = this.selectNextPattern();
        
        setTimeout(() => {
            this.setPattern(nextPattern);
        }, this.morphTimer);
    }

    /**
     * Sélectionne le prochain pattern
     */
    selectNextPattern() {
        const availablePatterns = Object.keys(this.patterns).filter(pattern => {
            // Éviter les patterns récents
            return !this.recentPatterns.includes(pattern);
        });
        
        if (availablePatterns.length === 0) {
            // Réinitialisation si tous ont été utilisés
            this.recentPatterns = [];
            return this.selectRandomPattern();
        }
        
        const nextPattern = availablePatterns[Math.floor(Math.random() * availablePatterns.length)];
        
        // Mise à jour de l'historique
        this.recentPatterns.push(this.targetPattern);
        if (this.recentPatterns.length > 2) {
            this.recentPatterns.shift();
        }
        
        return nextPattern;
    }

    /**
     * Sélectionne un pattern aléatoire
     */
    selectRandomPattern() {
        const patterns = Object.keys(this.patterns);
        return patterns[Math.floor(Math.random() * patterns.length)];
    }

    /**
     * Met à jour le système de morphing
     */
    update(deltaTime) {
        if (this.morphingActive && this.morphTimer > 0) {
            this.morphTimer -= deltaTime * 1000;
            
            if (this.morphTimer <= 0) {
                this.morphingActive = false;
            }
        }
    }

    /**
     * Retourne les étoiles nécessaires actuellement
     */
    getNeededStars() {
        if (!this.currentPattern) return [];
        
        return this.currentPattern.stars.filter(star => !this.collectedStars.has(star));
    }

    /**
     * Retourne toutes les étoiles du pattern actuel
     */
    getAllStars() {
        return this.currentPattern ? [...this.currentPattern.stars] : [];
    }

    /**
     * Retourne la couleur d'une étoile
     */
    getStarColor(starType) {
        if (!this.currentPattern) return '#ffffff';
        
        const index = this.currentPattern.stars.indexOf(starType);
        return index >= 0 ? this.currentPattern.colors[index] : '#ffffff';
    }

    /**
     * Vérifie si une étoile est collectée
     */
    isStarCollected(starType) {
        return this.collectedStars.has(starType);
    }

    /**
     * Retourne les informations de progression
     */
    getProgress() {
        if (!this.currentPattern) {
            return {
                patternName: 'Aucun',
                description: '',
                collected: 0,
                total: 0,
                percentage: 0,
                stars: [],
                morphing: false,
                morphProgress: 0
            };
        }
        
        const total = this.currentPattern.stars.length;
        const collected = this.collectedStars.size;
        const percentage = (collected / total) * 100;
        
        const stars = this.currentPattern.stars.map(starType => ({
            type: starType,
            collected: this.collectedStars.has(starType),
            color: this.getStarColor(starType)
        }));
        
        return {
            patternName: this.currentPattern.name,
            description: this.currentPattern.description,
            collected,
            total,
            percentage,
            stars,
            morphing: this.morphingActive,
            morphProgress: this.morphingActive ? (3000 - this.morphTimer) / 3000 : 0,
            bonus: this.currentPattern.bonus
        };
    }

    /**
     * Retourne les statistiques globales
     */
    getStats() {
        const totalCompleted = this.completedPatterns.length;
        const totalBonus = this.completedPatterns.reduce((sum, pattern) => sum + pattern.bonus, 0);
        
        // Calcul des patterns uniques complétés
        const uniquePatterns = new Set(this.completedPatterns.map(p => p.pattern));
        
        return {
            totalCompleted,
            uniqueCompleted: uniquePatterns.size,
            totalBonus,
            averageBonus: totalCompleted > 0 ? Math.round(totalBonus / totalCompleted) : 0,
            completedPatterns: [...this.completedPatterns]
        };
    }

    /**
     * Génère un effet visuel de morphing
     */
    getMorphingEffect() {
        if (!this.morphingActive) return null;
        
        const progress = (3000 - this.morphTimer) / 3000;
        const intensity = Math.sin(progress * Math.PI);
        
        return {
            active: true,
            progress,
            intensity,
            color: `rgba(255, 255, 255, ${intensity * 0.3})`,
            scale: 1 + intensity * 0.5,
            rotation: progress * Math.PI * 4
        };
    }

    /**
     * Génère des particules pour l'effet de completion
     */
    generateCompletionParticles() {
        const particles = [];
        const colors = this.currentPattern.colors;
        
        for (let i = 0; i < 20; i++) {
            const angle = (i / 20) * Math.PI * 2;
            const speed = 100 + Math.random() * 50;
            
            particles.push({
                x: 0, // Position relative au centre
                y: 0,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color: colors[Math.floor(Math.random() * colors.length)],
                life: 0,
                maxLife: 2 + Math.random(),
                size: 2 + Math.random() * 3,
                type: 'star'
            });
        }
        
        return particles;
    }

    /**
     * Génère un pattern procédural
     */
    generateProceduralPattern() {
        const starCount = 3 + Math.floor(Math.random() * 4); // 3-6 étoiles
        const stars = [];
        const colors = [];
        
        // Génération des identifiants d'étoiles
        const starNames = ['alpha', 'beta', 'gamma', 'delta', 'epsilon', 'zeta', 'eta', 'theta'];
        for (let i = 0; i < starCount; i++) {
            stars.push(starNames[i]);
        }
        
        // Génération de couleurs harmonieuses
        const baseHue = Math.random() * 360;
        for (let i = 0; i < starCount; i++) {
            const hue = (baseHue + (i * 360 / starCount)) % 360;
            const saturation = 60 + Math.random() * 30;
            const lightness = 50 + Math.random() * 20;
            colors.push(`hsl(${hue}, ${saturation}%, ${lightness}%)`);
        }
        
        return {
            name: `Formation ${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
            stars,
            colors,
            description: 'Pattern généré procéduralement',
            bonus: 100 + starCount * 25
        };
    }

    /**
     * Active le mode procédural
     */
    enableProceduralMode() {
        const proceduralPattern = this.generateProceduralPattern();
        const patternId = 'procedural_' + Date.now();
        
        this.patterns[patternId] = proceduralPattern;
        this.setPattern(patternId);
    }

    /**
     * Réinitialise le gestionnaire
     */
    reset() {
        this.collectedStars.clear();
        this.completedPatterns = [];
        this.recentPatterns = [];
        this.morphingActive = false;
        this.morphTimer = 0;
        this.setPattern('triangle');
    }

    /**
     * Sauvegarde l'état
     */
    saveState() {
        return {
            targetPattern: this.targetPattern,
            collectedStars: Array.from(this.collectedStars),
            completedPatterns: [...this.completedPatterns],
            recentPatterns: [...this.recentPatterns]
        };
    }

    /**
     * Restaure l'état
     */
    loadState(state) {
        this.targetPattern = state.targetPattern || 'triangle';
        this.collectedStars = new Set(state.collectedStars || []);
        this.completedPatterns = state.completedPatterns || [];
        this.recentPatterns = state.recentPatterns || [];
        
        this.setPattern(this.targetPattern);
        
        // Restauration des étoiles collectées
        state.collectedStars?.forEach(star => {
            this.collectedStars.add(star);
        });
    }
}