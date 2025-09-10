/**
 * Moteur de jeu principal pour Serpentis Nexus
 * Gère la logique du jeu, les collisions et le rendu
 */

import { Snake } from '../entities/snake.js';
import { EnemyAI } from '../entities/enemy-ai.js';
import { GravityWell } from '../entities/gravity-well.js';
import { ConstellationManager } from '../systems/constellation-manager.js';
import { SpatialHash } from '../systems/spatial-hash.js';
import { ParticleSystem } from '../systems/particle-system.js';
import { LevelManager } from '../systems/level-manager.js';

export class GameEngine {
    constructor(canvas, audioManager) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.audioManager = audioManager;
        
        // Dimensions du jeu
        this.width = canvas.width;
        this.height = canvas.height;
        this.gridSize = 20;
        this.gridWidth = Math.floor(this.width / this.gridSize);
        this.gridHeight = Math.floor(this.height / this.gridSize);
        
        // État du jeu
        this.gameState = 'stopped'; // 'stopped', 'running', 'paused'
        this.score = 0;
        this.level = 1;
        this.lives = 3;
        this.gameSpeed = 5;
        
        // Entités du jeu
        this.playerSnake = null;
        this.enemies = [];
        this.gravityWells = [];
        this.collectibles = [];
        
        // Systèmes
        this.spatialHash = new SpatialHash(this.gridSize);
        this.particleSystem = new ParticleSystem();
        this.constellationManager = new ConstellationManager();
        this.levelManager = new LevelManager();
        
        // Timing
        this.lastUpdate = 0;
        this.updateInterval = 1000 / this.gameSpeed;
        this.deltaTime = 0;
        
        this.initializeGame();
    }

    /**
     * Initialise le jeu
     */
    initializeGame() {
        // Création du serpent joueur
        const startX = Math.floor(this.gridWidth / 2);
        const startY = Math.floor(this.gridHeight / 2);
        this.playerSnake = new Snake(startX, startY, 'player');
        
        // Configuration du niveau initial
        this.levelManager.loadLevel(this.level);
        this.setupLevel();
    }

    /**
     * Configure le niveau actuel
     */
    setupLevel() {
        const levelData = this.levelManager.getCurrentLevel();
        
        // Réinitialisation des entités
        this.enemies = [];
        this.gravityWells = [];
        this.collectibles = [];
        this.spatialHash.clear();
        
        // Création des puits gravitationnels
        for (const well of levelData.gravityWells) {
            this.gravityWells.push(new GravityWell(
                well.x, well.y, well.strength, well.radius, well.type
            ));
        }
        
        // Création des ennemis
        for (const enemy of levelData.enemies) {
            const enemySnake = new Snake(enemy.x, enemy.y, 'enemy');
            enemySnake.ai = new EnemyAI(enemySnake, this);
            this.enemies.push(enemySnake);
        }
        
        // Configuration de la constellation
        this.constellationManager.setPattern(levelData.constellationPattern);
        this.spawnCollectibles();
    }

    /**
     * Démarre une nouvelle partie
     */
    startNewGame() {
        this.gameState = 'running';
        this.score = 0;
        this.level = 1;
        this.lives = 3;
        
        // Réinitialisation du serpent
        const startX = Math.floor(this.gridWidth / 2);
        const startY = Math.floor(this.gridHeight / 2);
        this.playerSnake.reset(startX, startY);
        
        this.setupLevel();
        this.lastUpdate = performance.now();
    }

    /**
     * Arrête le jeu
     */
    stop() {
        this.gameState = 'stopped';
    }

    /**
     * Met en pause le jeu
     */
    pause() {
        if (this.gameState === 'running') {
            this.gameState = 'paused';
        }
    }

    /**
     * Reprend le jeu
     */
    resume() {
        if (this.gameState === 'paused') {
            this.gameState = 'running';
            this.lastUpdate = performance.now();
        }
    }

    /**
     * Vérifie si le jeu est en pause
     */
    isPaused() {
        return this.gameState === 'paused';
    }

    /**
     * Définit la direction du serpent joueur
     */
    setDirection(direction) {
        if (this.playerSnake && this.gameState === 'running') {
            this.playerSnake.setDirection(direction);
        }
    }

    /**
     * Active le boost du serpent joueur
     */
    activateBoost() {
        if (this.playerSnake && this.gameState === 'running') {
            this.playerSnake.activateBoost();
        }
    }

    /**
     * Met à jour le jeu
     */
    update() {
        if (this.gameState !== 'running') {
            return this.getGameState();
        }

        const now = performance.now();
        this.deltaTime = now - this.lastUpdate;
        
        if (this.deltaTime >= this.updateInterval) {
            this.updateGame();
            this.lastUpdate = now;
        }
        
        // Mise à jour continue des systèmes
        this.particleSystem.update(this.deltaTime / 1000);
        
        return this.getGameState();
    }

    /**
     * Met à jour la logique du jeu
     */
    updateGame() {
        // Mise à jour du hash spatial
        this.spatialHash.clear();
        
        // Ajout des entités au hash spatial
        this.addToSpatialHash(this.playerSnake);
        this.enemies.forEach(enemy => this.addToSpatialHash(enemy));
        this.collectibles.forEach(collectible => this.spatialHash.add(collectible, collectible.x, collectible.y));
        
        // Application de la gravité
        this.applyGravityEffects();
        
        // Mise à jour du serpent joueur
        this.playerSnake.update(this.deltaTime / 1000);
        
        // Mise à jour des ennemis
        this.enemies.forEach(enemy => {
            enemy.ai.update();
            enemy.update(this.deltaTime / 1000);
        });
        
        // Vérification des collisions
        this.checkCollisions();
        
        // Vérification des objectifs de niveau
        this.checkLevelObjectives();
        
        // Nettoyage des entités mortes
        this.cleanupEntities();
    }

    /**
     * Ajoute un serpent au hash spatial
     */
    addToSpatialHash(snake) {
        snake.segments.forEach(segment => {
            this.spatialHash.add(segment, segment.x, segment.y);
        });
    }

    /**
     * Applique les effets gravitationnels
     */
    applyGravityEffects() {
        this.gravityWells.forEach(well => {
            // Effet sur le serpent joueur
            well.applyGravity(this.playerSnake);
            
            // Effet sur les ennemis
            this.enemies.forEach(enemy => well.applyGravity(enemy));
        });
    }

    /**
     * Vérifie toutes les collisions
     */
    checkCollisions() {
        // Collisions du serpent joueur
        this.checkSnakeCollisions(this.playerSnake);
        
        // Collisions des ennemis
        this.enemies.forEach(enemy => this.checkSnakeCollisions(enemy));
        
        // Collisions entre serpents
        this.checkSnakeVsSnakeCollisions();
    }

    /**
     * Vérifie les collisions d'un serpent
     */
    checkSnakeCollisions(snake) {
        const head = snake.getHead();
        
        // Collision avec les murs
        if (head.x < 0 || head.x >= this.gridWidth || 
            head.y < 0 || head.y >= this.gridHeight) {
            this.handleSnakeCollision(snake, 'wall');
            return;
        }
        
        // Collision avec soi-même
        for (let i = 1; i < snake.segments.length; i++) {
            if (head.x === snake.segments[i].x && head.y === snake.segments[i].y) {
                this.handleSnakeCollision(snake, 'self');
                return;
            }
        }
        
        // Collision avec les collectibles
        this.collectibles.forEach((collectible, index) => {
            if (head.x === collectible.x && head.y === collectible.y) {
                this.collectItem(snake, collectible, index);
            }
        });
    }

    /**
     * Vérifie les collisions entre serpents
     */
    checkSnakeVsSnakeCollisions() {
        const allSnakes = [this.playerSnake, ...this.enemies];
        
        for (let i = 0; i < allSnakes.length; i++) {
            for (let j = i + 1; j < allSnakes.length; j++) {
                const snake1 = allSnakes[i];
                const snake2 = allSnakes[j];
                
                if (this.checkSnakeCollision(snake1, snake2)) {
                    this.handleSnakeVsSnakeCollision(snake1, snake2);
                }
            }
        }
    }

    /**
     * Vérifie la collision entre deux serpents
     */
    checkSnakeCollision(snake1, snake2) {
        const head1 = snake1.getHead();
        
        // Vérification avec tous les segments du serpent 2
        return snake2.segments.some(segment => 
            head1.x === segment.x && head1.y === segment.y
        );
    }

    /**
     * Gère la collision d'un serpent
     */
    handleSnakeCollision(snake, type) {
        if (snake.type === 'player') {
            this.lives--;
            this.audioManager.playSound('playerHit');
            
            if (this.lives <= 0) {
                this.gameState = 'stopped';
                this.audioManager.playSound('gameOver');
            } else {
                this.respawnPlayer();
            }
        } else {
            // Ennemi détruit
            const index = this.enemies.indexOf(snake);
            if (index > -1) {
                this.enemies.splice(index, 1);
                this.score += 50;
                this.audioManager.playSound('enemyDestroyed');
            }
        }
    }

    /**
     * Gère la collision entre deux serpents
     */
    handleSnakeVsSnakeCollision(snake1, snake2) {
        // Le serpent le plus long survit
        if (snake1.segments.length > snake2.segments.length) {
            this.handleSnakeCollision(snake2, 'collision');
            snake1.grow();
        } else if (snake2.segments.length > snake1.segments.length) {
            this.handleSnakeCollision(snake1, 'collision');
            snake2.grow();
        } else {
            // Égalité : les deux meurent
            this.handleSnakeCollision(snake1, 'collision');
            this.handleSnakeCollision(snake2, 'collision');
        }
    }

    /**
     * Collecte un objet
     */
    collectItem(snake, collectible, index) {
        // Suppression de l'objet
        this.collectibles.splice(index, 1);
        
        // Ajout de particules
        this.particleSystem.emit(
            collectible.x * this.gridSize + this.gridSize / 2,
            collectible.y * this.gridSize + this.gridSize / 2,
            collectible.color
        );
        
        if (snake.type === 'player') {
            // Croissance du serpent
            snake.grow(collectible.segmentType);
            
            // Mise à jour du score
            this.score += collectible.value;
            
            // Progression de la constellation
            const completed = this.constellationManager.collectStar(collectible.starType);
            if (completed) {
                this.score += 200;
                this.audioManager.playSound('constellationComplete');
                this.nextLevel();
            } else {
                this.audioManager.playSound('collect');
            }
        }
        
        // Respawn des collectibles
        if (this.collectibles.length < 3) {
            this.spawnCollectibles();
        }
    }

    /**
     * Fait réapparaître le joueur
     */
    respawnPlayer() {
        const startX = Math.floor(this.gridWidth / 2);
        const startY = Math.floor(this.gridHeight / 2);
        this.playerSnake.reset(startX, startY);
        
        // Invincibilité temporaire
        this.playerSnake.setInvulnerable(2000);
    }

    /**
     * Passe au niveau suivant
     */
    nextLevel() {
        this.level++;
        this.gameSpeed = Math.min(this.gameSpeed + 0.5, 15);
        this.updateInterval = 1000 / this.gameSpeed;
        
        this.levelManager.loadLevel(this.level);
        this.setupLevel();
    }

    /**
     * Génère des collectibles
     */
    spawnCollectibles() {
        const neededStars = this.constellationManager.getNeededStars();
        
        for (const starType of neededStars) {
            if (this.collectibles.length >= 5) break;
            
            const pos = this.findEmptyPosition();
            if (pos) {
                this.collectibles.push({
                    x: pos.x,
                    y: pos.y,
                    type: 'star',
                    starType: starType,
                    segmentType: this.getRandomSegmentType(),
                    value: 10,
                    color: this.constellationManager.getStarColor(starType)
                });
            }
        }
    }

    /**
     * Trouve une position vide
     */
    findEmptyPosition() {
        for (let attempts = 0; attempts < 100; attempts++) {
            const x = Math.floor(Math.random() * this.gridWidth);
            const y = Math.floor(Math.random() * this.gridHeight);
            
            if (this.isPositionEmpty(x, y)) {
                return { x, y };
            }
        }
        return null;
    }

    /**
     * Vérifie si une position est vide
     */
    isPositionEmpty(x, y) {
        // Vérification avec tous les serpents
        const allSnakes = [this.playerSnake, ...this.enemies];
        for (const snake of allSnakes) {
            if (snake.segments.some(segment => segment.x === x && segment.y === y)) {
                return false;
            }
        }
        
        // Vérification avec les puits gravitationnels
        for (const well of this.gravityWells) {
            const distance = Math.sqrt((x - well.x) ** 2 + (y - well.y) ** 2);
            if (distance < well.radius / this.gridSize) {
                return false;
            }
        }
        
        return true;
    }

    /**
     * Retourne un type de segment aléatoire
     */
    getRandomSegmentType() {
        const types = ['normal', 'armored', 'booster', 'magnetic'];
        return types[Math.floor(Math.random() * types.length)];
    }

    /**
     * Vérifie les objectifs du niveau
     */
    checkLevelObjectives() {
        // Vérification si tous les ennemis sont détruits
        if (this.enemies.length === 0) {
            const levelData = this.levelManager.getCurrentLevel();
            if (levelData.enemies.length > 0) {
                // Bonus pour niveau nettoyé
                this.score += 100;
                this.audioManager.playSound('levelClear');
            }
        }
    }

    /**
     * Nettoie les entités mortes
     */
    cleanupEntities() {
        // Suppression des ennemis morts
        this.enemies = this.enemies.filter(enemy => enemy.alive);
    }

    /**
     * Gère le redimensionnement
     */
    handleResize(width, height) {
        this.width = width;
        this.height = height;
        this.gridWidth = Math.floor(width / this.gridSize);
        this.gridHeight = Math.floor(height / this.gridSize);
        
        this.spatialHash = new SpatialHash(this.gridSize);
    }

    /**
     * Effectue le rendu du jeu
     */
    render() {
        // Effacement du canvas
        this.ctx.fillStyle = '#0a0a0a';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // Rendu de la grille (optionnel)
        if (window.DEBUG_MODE) {
            this.renderGrid();
        }
        
        // Rendu des puits gravitationnels
        this.gravityWells.forEach(well => well.render(this.ctx, this.gridSize));
        
        // Rendu des collectibles
        this.renderCollectibles();
        
        // Rendu des serpents ennemis
        this.enemies.forEach(enemy => enemy.render(this.ctx, this.gridSize));
        
        // Rendu du serpent joueur
        this.playerSnake.render(this.ctx, this.gridSize);
        
        // Rendu des particules
        this.particleSystem.render(this.ctx);
        
        // Rendu des effets de debug
        if (window.DEBUG_MODE) {
            this.renderDebugInfo();
        }
    }

    /**
     * Rendu de la grille de debug
     */
    renderGrid() {
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 0.5;
        
        for (let x = 0; x <= this.width; x += this.gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.height);
            this.ctx.stroke();
        }
        
        for (let y = 0; y <= this.height; y += this.gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.width, y);
            this.ctx.stroke();
        }
    }

    /**
     * Rendu des collectibles
     */
    renderCollectibles() {
        this.collectibles.forEach(collectible => {
            const x = collectible.x * this.gridSize + this.gridSize / 2;
            const y = collectible.y * this.gridSize + this.gridSize / 2;
            const radius = this.gridSize * 0.3;
            
            // Effet de pulsation
            const pulse = Math.sin(Date.now() * 0.005) * 0.2 + 0.8;
            const currentRadius = radius * pulse;
            
            // Étoile principale
            this.ctx.fillStyle = collectible.color;
            this.ctx.beginPath();
            this.ctx.arc(x, y, currentRadius, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Halo
            const gradient = this.ctx.createRadialGradient(x, y, 0, x, y, currentRadius * 2);
            gradient.addColorStop(0, collectible.color + '40');
            gradient.addColorStop(1, collectible.color + '00');
            
            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(x, y, currentRadius * 2, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }

    /**
     * Rendu des informations de debug
     */
    renderDebugInfo() {
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '12px monospace';
        this.ctx.fillText(`FPS: ${Math.round(1000 / this.deltaTime)}`, 10, 20);
        this.ctx.fillText(`Enemies: ${this.enemies.length}`, 10, 35);
        this.ctx.fillText(`Collectibles: ${this.collectibles.length}`, 10, 50);
        this.ctx.fillText(`Speed: ${this.gameSpeed}`, 10, 65);
    }

    /**
     * Retourne l'état actuel du jeu
     */
    getGameState() {
        return {
            gameOver: this.gameState === 'stopped',
            paused: this.gameState === 'paused',
            score: this.score,
            level: this.level,
            lives: this.lives,
            constellationProgress: this.constellationManager.getProgress(),
            playerPowerUps: this.playerSnake ? this.playerSnake.getActivePowerUps() : []
        };
    }
}