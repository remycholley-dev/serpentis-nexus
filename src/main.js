/**
 * Serpentis Nexus - Point d'entrée principal
 * Un jeu de serpent original avec mécaniques gravitationnelles
 */

import { GameEngine } from './engine/game-engine.js';
import { InputManager } from './engine/input-manager.js';
import { AudioManager } from './engine/audio-manager.js';
import { UIManager } from './ui/ui-manager.js';
import { LevelEditor } from './editor/level-editor.js';

class SerpentisNexus {
    constructor() {
        this.gameEngine = null;
        this.inputManager = null;
        this.audioManager = null;
        this.uiManager = null;
        this.levelEditor = null;
        this.currentMode = 'menu'; // 'menu', 'game', 'editor', 'settings'
        
        this.initializeGame();
    }

    /**
     * Initialise tous les systèmes du jeu
     */
    async initializeGame() {
        try {
            // Initialisation des gestionnaires
            this.audioManager = new AudioManager();
            this.inputManager = new InputManager();
            this.uiManager = new UIManager(this);
            
            // Initialisation du moteur de jeu
            const canvas = document.getElementById('gameCanvas');
            if (!canvas) {
                throw new Error('Canvas non trouvé');
            }
            
            this.gameEngine = new GameEngine(canvas, this.audioManager);
            this.levelEditor = new LevelEditor(canvas, this.audioManager);
            
            // Configuration des contrôles
            this.setupEventListeners();
            
            // Redimensionnement initial
            this.handleResize();
            window.addEventListener('resize', () => this.handleResize());
            
            console.log('Serpentis Nexus initialisé avec succès');
            
        } catch (error) {
            console.error('Erreur lors de l\'initialisation:', error);
            this.showError('Erreur de chargement du jeu');
        }
    }

    /**
     * Configure les écouteurs d'événements
     */
    setupEventListeners() {
        // Contrôles clavier
        this.inputManager.onDirectionChange((direction) => {
            if (this.currentMode === 'game') {
                this.gameEngine.setDirection(direction);
            }
        });

        this.inputManager.onAction('boost', () => {
            if (this.currentMode === 'game') {
                this.gameEngine.activateBoost();
            }
        });

        this.inputManager.onAction('pause', () => {
            if (this.currentMode === 'game') {
                this.togglePause();
            }
        });

        // Gestion de la perte de focus
        window.addEventListener('blur', () => {
            if (this.currentMode === 'game') {
                this.pauseGame();
            }
        });

        // Gestion des changements de visibilité
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && this.currentMode === 'game') {
                this.pauseGame();
            }
        });
    }

    /**
     * Démarre une nouvelle partie
     */
    startGame() {
        this.currentMode = 'game';
        this.uiManager.hideMenu();
        this.gameEngine.startNewGame();
        this.updateGameLoop();
    }

    /**
     * Ouvre l'éditeur de niveau
     */
    openEditor() {
        this.currentMode = 'editor';
        this.uiManager.hideMenu();
        this.levelEditor.start();
        this.updateEditorLoop();
    }

    /**
     * Retourne au menu principal
     */
    returnToMenu() {
        this.currentMode = 'menu';
        this.gameEngine.stop();
        this.levelEditor.stop();
        this.uiManager.showMenu();
    }

    /**
     * Bascule la pause du jeu
     */
    togglePause() {
        if (this.gameEngine.isPaused()) {
            this.resumeGame();
        } else {
            this.pauseGame();
        }
    }

    /**
     * Met en pause le jeu
     */
    pauseGame() {
        this.gameEngine.pause();
        this.uiManager.showPauseScreen();
    }

    /**
     * Reprend le jeu
     */
    resumeGame() {
        this.gameEngine.resume();
        this.uiManager.hidePauseScreen();
    }

    /**
     * Boucle de mise à jour du jeu
     */
    updateGameLoop() {
        if (this.currentMode !== 'game') return;

        const gameState = this.gameEngine.update();
        this.uiManager.updateGameUI(gameState);

        if (gameState.gameOver) {
            this.handleGameOver(gameState);
            return;
        }

        this.gameEngine.render();
        requestAnimationFrame(() => this.updateGameLoop());
    }

    /**
     * Boucle de mise à jour de l'éditeur
     */
    updateEditorLoop() {
        if (this.currentMode !== 'editor') return;

        this.levelEditor.update();
        this.levelEditor.render();
        requestAnimationFrame(() => this.updateEditorLoop());
    }

    /**
     * Gère la fin de partie
     */
    handleGameOver(gameState) {
        this.audioManager.playSound('gameOver');
        this.uiManager.showGameOverScreen(gameState.score, gameState.level);
        
        // Retour au menu après un délai
        setTimeout(() => {
            this.returnToMenu();
        }, 3000);
    }

    /**
     * Gère le redimensionnement de la fenêtre
     */
    handleResize() {
        const canvas = document.getElementById('gameCanvas');
        if (!canvas) return;

        const container = canvas.parentElement;
        const containerRect = container.getBoundingClientRect();
        
        // Calcul des dimensions optimales
        const maxWidth = Math.min(containerRect.width * 0.9, 1200);
        const maxHeight = Math.min(containerRect.height * 0.8, 800);
        
        // Maintien du ratio 16:10
        const ratio = 16 / 10;
        let width, height;
        
        if (maxWidth / maxHeight > ratio) {
            height = maxHeight;
            width = height * ratio;
        } else {
            width = maxWidth;
            height = width / ratio;
        }
        
        canvas.width = Math.floor(width);
        canvas.height = Math.floor(height);
        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';

        // Mise à jour des systèmes
        if (this.gameEngine) {
            this.gameEngine.handleResize(canvas.width, canvas.height);
        }
        if (this.levelEditor) {
            this.levelEditor.handleResize(canvas.width, canvas.height);
        }
    }

    /**
     * Affiche un message d'erreur
     */
    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        errorDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(255, 0, 0, 0.9);
            color: white;
            padding: 1rem 2rem;
            border-radius: 8px;
            z-index: 1000;
            font-family: inherit;
        `;
        
        document.body.appendChild(errorDiv);
        
        setTimeout(() => {
            if (errorDiv.parentElement) {
                errorDiv.parentElement.removeChild(errorDiv);
            }
        }, 5000);
    }
}

// Initialisation du jeu quand le DOM est prêt
document.addEventListener('DOMContentLoaded', () => {
    window.serpentisNexus = new SerpentisNexus();
});