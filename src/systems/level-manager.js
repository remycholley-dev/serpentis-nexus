/**
 * Gestionnaire de niveaux avec génération procédurale
 * Définit les patterns de jeu, obstacles et objectifs
 */

export class LevelManager {
    constructor() {
        this.currentLevel = 1;
        this.levelData = null;
        this.levelTemplates = this.createLevelTemplates();
        this.proceduralSeed = Date.now();
    }

    /**
     * Crée les modèles de niveaux de base
     */
    createLevelTemplates() {
        return {
            // Niveaux tutoriel
            1: {
                name: "Premiers Pas",
                description: "Apprenez les bases du mouvement",
                gravityWells: [],
                enemies: [],
                constellationPattern: 'triangle',
                collectibleCount: 5,
                timeLimit: 0,
                difficulty: 'easy',
                theme: 'space'
            },
            
            2: {
                name: "Attraction Gravitationnelle",
                description: "Découvrez les puits gravitationnels",
                gravityWells: [
                    { x: 20, y: 15, strength: 0.8, radius: 80, type: 'attract' }
                ],
                enemies: [],
                constellationPattern: 'triangle',
                collectibleCount: 6,
                timeLimit: 0,
                difficulty: 'easy',
                theme: 'space'
            },
            
            3: {
                name: "Premier Ennemi",
                description: "Évitez les serpents ennemis",
                gravityWells: [],
                enemies: [
                    { x: 30, y: 10, behavior: 'collector' }
                ],
                constellationPattern: 'cross',
                collectibleCount: 7,
                timeLimit: 0,
                difficulty: 'easy',
                theme: 'space'
            },
            
            // Niveaux intermédiaires
            4: {
                name: "Forces Combinées",
                description: "Gravité et ennemis ensemble",
                gravityWells: [
                    { x: 15, y: 10, strength: 0.6, radius: 60, type: 'attract' },
                    { x: 35, y: 25, strength: 0.8, radius: 70, type: 'repel' }
                ],
                enemies: [
                    { x: 40, y: 15, behavior: 'territorial' }
                ],
                constellationPattern: 'cross',
                collectibleCount: 8,
                timeLimit: 120,
                difficulty: 'medium',
                theme: 'space'
            },
            
            5: {
                name: "Vortex Spatial",
                description: "Naviguez dans les courants tourbillonnants",
                gravityWells: [
                    { x: 25, y: 20, strength: 1.2, radius: 100, type: 'vortex' }
                ],
                enemies: [
                    { x: 10, y: 5, behavior: 'hunter' },
                    { x: 40, y: 35, behavior: 'mimic' }
                ],
                constellationPattern: 'diamond',
                collectibleCount: 10,
                timeLimit: 150,
                difficulty: 'medium',
                theme: 'nebula'
            },
            
            // Niveaux avancés
            6: {
                name: "Champ de Bataille",
                description: "Survivez à l'assaut ennemi",
                gravityWells: [
                    { x: 12, y: 12, strength: 0.5, radius: 50, type: 'pulse' },
                    { x: 38, y: 28, strength: 0.5, radius: 50, type: 'pulse' }
                ],
                enemies: [
                    { x: 8, y: 8, behavior: 'hunter' },
                    { x: 42, y: 32, behavior: 'hunter' },
                    { x: 25, y: 20, behavior: 'opportunist' }
                ],
                constellationPattern: 'spiral',
                collectibleCount: 12,
                timeLimit: 180,
                difficulty: 'hard',
                theme: 'asteroid'
            }
        };
    }

    /**
     * Charge un niveau spécifique
     */
    loadLevel(levelNumber) {
        this.currentLevel = levelNumber;
        
        if (this.levelTemplates[levelNumber]) {
            // Niveau prédéfini
            this.levelData = this.processLevelTemplate(this.levelTemplates[levelNumber]);
        } else {
            // Génération procédurale pour les niveaux avancés
            this.levelData = this.generateProceduralLevel(levelNumber);
        }
        
        console.log(`Niveau ${levelNumber} chargé:`, this.levelData.name);
        return this.levelData;
    }

    /**
     * Traite un modèle de niveau
     */
    processLevelTemplate(template) {
        const processedLevel = { ...template };
        
        // Ajout des métadonnées
        processedLevel.levelNumber = this.currentLevel;
        processedLevel.generated = false;
        
        // Normalisation des positions selon la taille de grille
        // (Sera ajusté par le moteur de jeu)
        
        return processedLevel;
    }

    /**
     * Génère un niveau procédural
     */
    generateProceduralLevel(levelNumber) {
        this.proceduralSeed = this.hashCode(levelNumber.toString());
        const rng = this.createSeededRandom(this.proceduralSeed);
        
        const difficulty = this.calculateDifficulty(levelNumber);
        const theme = this.selectTheme(levelNumber, rng);
        
        const level = {
            name: `Secteur ${levelNumber}`,
            description: this.generateDescription(levelNumber, theme, rng),
            levelNumber,
            generated: true,
            difficulty,
            theme,
            gravityWells: this.generateGravityWells(levelNumber, difficulty, rng),
            enemies: this.generateEnemies(levelNumber, difficulty, rng),
            constellationPattern: this.selectConstellationPattern(levelNumber, rng),
            collectibleCount: this.calculateCollectibleCount(levelNumber, difficulty),
            timeLimit: this.calculateTimeLimit(levelNumber, difficulty),
            specialFeatures: this.generateSpecialFeatures(levelNumber, rng)
        };
        
        return level;
    }

    /**
     * Calcule la difficulté basée sur le niveau
     */
    calculateDifficulty(levelNumber) {
        if (levelNumber <= 3) return 'easy';
        if (levelNumber <= 8) return 'medium';
        if (levelNumber <= 15) return 'hard';
        return 'extreme';
    }

    /**
     * Sélectionne un thème pour le niveau
     */
    selectTheme(levelNumber, rng) {
        const themes = ['space', 'nebula', 'asteroid', 'blackhole', 'plasma', 'crystal'];
        return themes[Math.floor(rng() * themes.length)];
    }

    /**
     * Génère une description procédurale
     */
    generateDescription(levelNumber, theme, rng) {
        const themeDescriptions = {
            space: ["l'espace infini", "les étoiles lointaines", "le vide cosmique"],
            nebula: ["les nuages stellaires", "la poussière d'étoile", "les brumes cosmiques"],
            asteroid: ["le champ d'astéroïdes", "les rochers spatiaux", "la ceinture de débris"],
            blackhole: ["l'horizon des événements", "la singularité", "la distorsion spatiale"],
            plasma: ["les tempêtes solaires", "l'énergie pure", "les flux magnétiques"],
            crystal: ["les formations cristallines", "les résonances harmoniques", "les géodes spatiales"]
        };
        
        const descriptions = themeDescriptions[theme] || themeDescriptions.space;
        const selected = descriptions[Math.floor(rng() * descriptions.length)];
        
        return `Naviguez dans ${selected}`;
    }

    /**
     * Génère des puits gravitationnels
     */
    generateGravityWells(levelNumber, difficulty, rng) {
        const wells = [];
        const maxWells = this.getMaxWellsForDifficulty(difficulty);
        const wellCount = Math.floor(rng() * maxWells) + 1;
        
        const wellTypes = ['attract', 'repel', 'vortex', 'pulse'];
        const difficultyMultiplier = { easy: 0.5, medium: 0.8, hard: 1.0, extreme: 1.3 };
        
        for (let i = 0; i < wellCount; i++) {
            const type = wellTypes[Math.floor(rng() * wellTypes.length)];
            const strength = (0.3 + rng() * 0.8) * difficultyMultiplier[difficulty];
            const radius = 40 + rng() * 60;
            
            wells.push({
                x: 10 + rng() * 30, // Position relative (sera ajustée)
                y: 8 + rng() * 24,
                strength,
                radius,
                type
            });
        }
        
        return wells;
    }

    /**
     * Génère des ennemis
     */
    generateEnemies(levelNumber, difficulty, rng) {
        const enemies = [];
        const maxEnemies = this.getMaxEnemiesForDifficulty(difficulty);
        const enemyCount = Math.floor(rng() * maxEnemies) + (difficulty === 'easy' ? 0 : 1);
        
        const behaviors = ['collector', 'hunter', 'territorial', 'mimic', 'opportunist'];
        const availableBehaviors = this.getAvailableBehaviors(difficulty);
        
        for (let i = 0; i < enemyCount; i++) {
            const behavior = availableBehaviors[Math.floor(rng() * availableBehaviors.length)];
            
            enemies.push({
                x: 5 + rng() * 40,
                y: 5 + rng() * 30,
                behavior,
                difficulty: difficulty
            });
        }
        
        return enemies;
    }

    /**
     * Sélectionne un pattern de constellation
     */
    selectConstellationPattern(levelNumber, rng) {
        const patterns = ['triangle', 'cross', 'diamond', 'spiral'];
        const availablePatterns = patterns.slice(0, Math.min(patterns.length, Math.floor(levelNumber / 2) + 1));
        
        return availablePatterns[Math.floor(rng() * availablePatterns.length)];
    }

    /**
     * Calcule le nombre de collectibles
     */
    calculateCollectibleCount(levelNumber, difficulty) {
        const baseCount = 5;
        const difficultyBonus = { easy: 0, medium: 2, hard: 4, extreme: 6 };
        const levelBonus = Math.floor(levelNumber / 3);
        
        return baseCount + difficultyBonus[difficulty] + levelBonus;
    }

    /**
     * Calcule la limite de temps
     */
    calculateTimeLimit(levelNumber, difficulty) {
        if (difficulty === 'easy') return 0; // Pas de limite
        
        const baseTime = 120; // 2 minutes
        const difficultyMultiplier = { medium: 1.2, hard: 1.0, extreme: 0.8 };
        const levelBonus = Math.floor(levelNumber / 5) * 15;
        
        return Math.floor(baseTime * difficultyMultiplier[difficulty]) + levelBonus;
    }

    /**
     * Génère des caractéristiques spéciales
     */
    generateSpecialFeatures(levelNumber, rng) {
        const features = [];
        
        // Portails (niveaux avancés)
        if (levelNumber >= 10 && rng() < 0.3) {
            features.push({
                type: 'portals',
                count: 2,
                color: '#ff00ff'
            });
        }
        
        // Segments spéciaux plus fréquents
        if (levelNumber >= 5 && rng() < 0.5) {
            features.push({
                type: 'enhanced_segments',
                probability: 0.3
            });
        }
        
        // Effets météo spatiaux
        if (levelNumber >= 8 && rng() < 0.4) {
            const weatherTypes = ['solar_wind', 'cosmic_storm', 'gravity_waves'];
            features.push({
                type: 'space_weather',
                weather: weatherTypes[Math.floor(rng() * weatherTypes.length)],
                intensity: 0.3 + rng() * 0.4
            });
        }
        
        return features;
    }

    /**
     * Utilitaires de configuration
     */
    
    getMaxWellsForDifficulty(difficulty) {
        const maxWells = { easy: 2, medium: 3, hard: 4, extreme: 6 };
        return maxWells[difficulty] || 2;
    }
    
    getMaxEnemiesForDifficulty(difficulty) {
        const maxEnemies = { easy: 1, medium: 2, hard: 4, extreme: 6 };
        return maxEnemies[difficulty] || 1;
    }
    
    getAvailableBehaviors(difficulty) {
        const allBehaviors = ['collector', 'hunter', 'territorial', 'mimic', 'opportunist'];
        
        switch (difficulty) {
            case 'easy': return ['collector'];
            case 'medium': return ['collector', 'territorial'];
            case 'hard': return ['collector', 'hunter', 'territorial', 'mimic'];
            case 'extreme': return allBehaviors;
            default: return ['collector'];
        }
    }

    /**
     * Gestion de la progression
     */
    
    getCurrentLevel() {
        return this.levelData;
    }
    
    getCurrentLevelNumber() {
        return this.currentLevel;
    }
    
    hasNextLevel() {
        return this.currentLevel < 50; // Limite arbitraire
    }
    
    getNextLevelPreview() {
        if (!this.hasNextLevel()) return null;
        
        const nextLevelNumber = this.currentLevel + 1;
        const difficulty = this.calculateDifficulty(nextLevelNumber);
        
        return {
            levelNumber: nextLevelNumber,
            difficulty,
            name: this.levelTemplates[nextLevelNumber]?.name || `Secteur ${nextLevelNumber}`,
            description: this.levelTemplates[nextLevelNumber]?.description || "Niveau généré procéduralement"
        };
    }

    /**
     * Validation et équilibrage
     */
    
    validateLevel(levelData) {
        const issues = [];
        
        // Vérification de l'équilibrage
        if (levelData.enemies.length > levelData.collectibleCount) {
            issues.push("Trop d'ennemis par rapport aux collectibles");
        }
        
        // Vérification des puits gravitationnels
        const strongWells = levelData.gravityWells.filter(w => w.strength > 1.0);
        if (strongWells.length > 2) {
            issues.push("Trop de puits gravitationnels puissants");
        }
        
        // Vérification du temps limite
        if (levelData.timeLimit > 0 && levelData.timeLimit < 60) {
            issues.push("Limite de temps trop courte");
        }
        
        return {
            valid: issues.length === 0,
            issues
        };
    }
    
    balanceLevel(levelData) {
        // Ajustements automatiques pour équilibrer le niveau
        const validation = this.validateLevel(levelData);
        
        if (!validation.valid) {
            console.log("Équilibrage du niveau en cours...", validation.issues);
            
            // Réduction de la force des puits gravitationnels si nécessaire
            levelData.gravityWells.forEach(well => {
                if (well.strength > 1.0) {
                    well.strength = Math.min(well.strength * 0.8, 1.0);
                }
            });
            
            // Augmentation de la limite de temps si nécessaire
            if (levelData.timeLimit > 0 && levelData.timeLimit < 60) {
                levelData.timeLimit = Math.max(levelData.timeLimit * 1.5, 90);
            }
        }
        
        return levelData;
    }

    /**
     * Système de graines (seeds) pour génération reproductible
     */
    
    hashCode(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash);
    }
    
    createSeededRandom(seed) {
        let currentSeed = seed;
        return function() {
            currentSeed = (currentSeed * 9301 + 49297) % 233280;
            return currentSeed / 233280;
        };
    }

    /**
     * Sauvegarde et chargement de progression
     */
    
    saveProgress() {
        const progressData = {
            currentLevel: this.currentLevel,
            proceduralSeed: this.proceduralSeed,
            unlockedLevels: this.currentLevel,
            completedLevels: Math.max(0, this.currentLevel - 1)
        };
        
        localStorage.setItem('serpentis_progress', JSON.stringify(progressData));
        return progressData;
    }
    
    loadProgress() {
        const saved = localStorage.getItem('serpentis_progress');
        if (saved) {
            try {
                const progressData = JSON.parse(saved);
                this.currentLevel = progressData.currentLevel || 1;
                this.proceduralSeed = progressData.proceduralSeed || Date.now();
                return progressData;
            } catch (error) {
                console.warn("Erreur chargement progression:", error);
            }
        }
        return null;
    }
    
    resetProgress() {
        localStorage.removeItem('serpentis_progress');
        this.currentLevel = 1;
        this.proceduralSeed = Date.now();
    }

    /**
     * Informations et statistiques
     */
    
    getLevelStats() {
        const level = this.getCurrentLevel();
        if (!level) return null;
        
        return {
            levelNumber: this.currentLevel,
            difficulty: level.difficulty,
            enemyCount: level.enemies.length,
            wellCount: level.gravityWells.length,
            collectibleCount: level.collectibleCount,
            timeLimit: level.timeLimit,
            hasSpecialFeatures: level.specialFeatures?.length > 0,
            generated: level.generated || false
        };
    }
    
    getDifficultyProgression() {
        const levels = [];
        for (let i = 1; i <= 20; i++) {
            levels.push({
                level: i,
                difficulty: this.calculateDifficulty(i)
            });
        }
        return levels;
    }
}