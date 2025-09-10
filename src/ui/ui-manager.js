/**
 * Gestionnaire d'interface utilisateur
 * Gère les menus, HUD et interactions UI
 */

export class UIManager {
    constructor(game) {
        this.game = game;
        this.elements = this.cacheElements();
        this.currentScreen = 'menu';
        
        this.initializeUI();
    }

    /**
     * Met en cache les éléments DOM
     */
    cacheElements() {
        return {
            // Écrans principaux
            gameMenu: document.getElementById('gameMenu'),
            gameStats: document.querySelector('.game-stats'),
            
            // Statistiques de jeu
            scoreElement: document.getElementById('score'),
            levelElement: document.getElementById('level'),
            livesElement: document.getElementById('lives'),
            
            // HUD de jeu
            powerUpIndicator: document.getElementById('powerUpIndicator'),
            constellationProgress: document.getElementById('constellationProgress'),
            constellationStars: document.getElementById('constellationStars'),
            
            // Boutons du menu
            startBtn: document.getElementById('startBtn'),
            editorBtn: document.getElementById('editorBtn'),
            settingsBtn: document.getElementById('settingsBtn'),
            helpBtn: document.getElementById('helpBtn'),
            
            // Panneau de configuration
            settingsPanel: document.getElementById('settingsPanel'),
            closeSettingsBtn: document.getElementById('closeSettingsBtn'),
            soundEnabled: document.getElementById('soundEnabled'),
            highContrast: document.getElementById('highContrast'),
            gameSpeed: document.getElementById('gameSpeed'),
            speedValue: document.getElementById('speedValue'),
            
            // Contrôles mobiles
            mobileControls: document.getElementById('mobileControls'),
            pauseBtn: document.getElementById('pauseBtn'),
            boostBtn: document.getElementById('boostBtn')
        };
    }

    /**
     * Initialise l'interface utilisateur
     */
    initializeUI() {
        this.setupEventListeners();
        this.updateConstellationDisplay();
        
        // Configuration initiale
        this.showMenu();
        
        console.log('Interface utilisateur initialisée');
    }

    /**
     * Configure les écouteurs d'événements
     */
    setupEventListeners() {
        // Boutons du menu principal
        if (this.elements.startBtn) {
            this.elements.startBtn.addEventListener('click', () => {
                this.game.startGame();
            });
        }
        
        if (this.elements.editorBtn) {
            this.elements.editorBtn.addEventListener('click', () => {
                this.game.openEditor();
            });
        }
        
        if (this.elements.settingsBtn) {
            this.elements.settingsBtn.addEventListener('click', () => {
                this.showSettings();
            });
        }
        
        if (this.elements.helpBtn) {
            this.elements.helpBtn.addEventListener('click', () => {
                this.showHelp();
            });
        }
        
        // Boutons de configuration
        if (this.elements.closeSettingsBtn) {
            this.elements.closeSettingsBtn.addEventListener('click', () => {
                this.hideSettings();
            });
        }
        
        if (this.elements.soundEnabled) {
            this.elements.soundEnabled.addEventListener('change', (e) => {
                this.game.audioManager.enableSound(e.target.checked);
            });
        }
        
        if (this.elements.highContrast) {
            this.elements.highContrast.addEventListener('change', (e) => {
                this.toggleHighContrast(e.target.checked);
            });
        }
        
        if (this.elements.gameSpeed) {
            this.elements.gameSpeed.addEventListener('input', (e) => {
                const speed = parseInt(e.target.value);
                this.updateSpeedDisplay(speed);
                // La vitesse sera appliquée au démarrage du jeu
            });
        }
        
        // Gestion de la fermeture des panneaux avec Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (this.elements.settingsPanel.style.display !== 'none') {
                    this.hideSettings();
                }
            }
        });
    }

    /**
     * Affiche le menu principal
     */
    showMenu() {
        this.currentScreen = 'menu';
        
        if (this.elements.gameMenu) {
            this.elements.gameMenu.style.display = 'flex';
        }
        
        this.hideGame();
        this.hideSettings();
    }

    /**
     * Masque le menu principal
     */
    hideMenu() {
        if (this.elements.gameMenu) {
            this.elements.gameMenu.style.display = 'none';
        }
    }

    /**
     * Affiche l'interface de jeu
     */
    showGame() {
        this.currentScreen = 'game';
        this.hideMenu();
        
        // Affichage des statistiques
        if (this.elements.gameStats) {
            this.elements.gameStats.style.display = 'flex';
        }
        
        // Détection mobile pour afficher les contrôles
        if (this.game.inputManager.isMobile && this.elements.mobileControls) {
            this.elements.mobileControls.style.display = 'flex';
        }
    }

    /**
     * Masque l'interface de jeu
     */
    hideGame() {
        if (this.elements.gameStats) {
            this.elements.gameStats.style.display = 'none';
        }
        
        if (this.elements.mobileControls) {
            this.elements.mobileControls.style.display = 'none';
        }
    }

    /**
     * Affiche le panneau de configuration
     */
    showSettings() {
        if (this.elements.settingsPanel) {
            this.elements.settingsPanel.style.display = 'block';
        }
        
        // Mise à jour des valeurs
        this.updateSettingsValues();
    }

    /**
     * Masque le panneau de configuration
     */
    hideSettings() {
        if (this.elements.settingsPanel) {
            this.elements.settingsPanel.style.display = 'none';
        }
    }

    /**
     * Met à jour les valeurs dans le panneau de configuration
     */
    updateSettingsValues() {
        if (this.elements.soundEnabled && this.game.audioManager) {
            this.elements.soundEnabled.checked = this.game.audioManager.enabled;
        }
        
        if (this.elements.highContrast) {
            this.elements.highContrast.checked = document.body.classList.contains('high-contrast');
        }
        
        if (this.elements.gameSpeed && this.elements.speedValue) {
            const currentSpeed = this.elements.gameSpeed.value;
            this.updateSpeedDisplay(currentSpeed);
        }
    }

    /**
     * Met à jour l'affichage de la vitesse
     */
    updateSpeedDisplay(speed) {
        if (this.elements.speedValue) {
            this.elements.speedValue.textContent = speed;
        }
    }

    /**
     * Bascule le mode contraste élevé
     */
    toggleHighContrast(enabled) {
        if (enabled) {
            document.body.classList.add('high-contrast');
        } else {
            document.body.classList.remove('high-contrast');
        }
    }

    /**
     * Affiche l'aide
     */
    showHelp() {
        const helpText = `SERPENTIS NEXUS - Guide de Jeu

🎮 CONTRÔLES:
- Flèches ou WASD: Déplacement
- Espace/Shift: Boost (si segments propulseurs)
- P ou Escape: Pause
- Sur mobile: Utilisez les contrôles tactiles

⭐ OBJECTIFS:
- Collectez les étoiles pour former des constellations
- Chaque constellation complétée fait passer au niveau suivant
- Évitez les collisions avec votre queue et les ennemis

🔮 MÉCANIQUES SPÉCIALES:

Segments Modulaires:
• Normal: Segment de base
• Blindé: Résiste aux collisions
• Propulseur: Permet le boost
• Magnétique: Attire les collectibles

Puits Gravitationnels:
• Bleu: Attraction - vous attire vers le centre
• Rouge: Répulsion - vous repousse
• Violet: Vortex - crée un tourbillon
• Vert: Pulse - attraction intermittente

Ennemis IA:
• Collecteur: Cherche les étoiles
• Chasseur: Vous poursuit activement
• Territorial: Défend une zone
• Mimique: Copie vos mouvements
• Opportuniste: Adaptable selon la situation

🏆 CONSTELLATIONS:
Triangle, Croix, Diamant, Spirale...
Chaque constellation a ses propres étoiles à collecter dans l'ordre.

💡 ASTUCES:
- Les segments blindés peuvent vous sauver la vie
- Utilisez la gravité à votre avantage
- Les ennemis plus petits peuvent être "mangés"
- Le boost consomme l'énergie des segments propulseurs

Bonne chance, explorateur spatial! 🚀`;
        
        alert(helpText);
    }

    /**
     * Met à jour l'interface de jeu
     */
    updateGameUI(gameState) {
        // Mise à jour des statistiques
        this.updateStats(gameState);
        
        // Mise à jour des power-ups
        this.updatePowerUps(gameState);
        
        // Mise à jour de la constellation
        this.updateConstellation(gameState);
    }

    /**
     * Met à jour les statistiques affichées
     */
    updateStats(gameState) {
        if (this.elements.scoreElement) {
            this.elements.scoreElement.textContent = gameState.score.toLocaleString();
        }
        
        if (this.elements.levelElement) {
            this.elements.levelElement.textContent = gameState.level;
        }
        
        if (this.elements.livesElement) {
            this.elements.livesElement.textContent = gameState.lives;
            
            // Animation si vies faibles
            if (gameState.lives <= 1) {
                this.elements.livesElement.classList.add('pulsing');
            } else {
                this.elements.livesElement.classList.remove('pulsing');
            }
        }
    }

    /**
     * Met à jour l'affichage des power-ups
     */
    updatePowerUps(gameState) {
        if (!this.elements.powerUpIndicator) return;
        
        const activePowerUps = gameState.playerPowerUps || [];
        
        if (activePowerUps.length > 0) {
            this.elements.powerUpIndicator.classList.add('active');
            
            // Affichage du premier power-up actif
            const powerUp = activePowerUps[0];
            const nameElement = this.elements.powerUpIndicator.querySelector('.power-up-name');
            const timerElement = this.elements.powerUpIndicator.querySelector('.power-up-timer');
            
            if (nameElement) {
                nameElement.textContent = powerUp.name + (powerUp.level > 1 ? ` x${powerUp.level}` : '');
            }
            
            if (timerElement && powerUp.duration > 0) {
                const progress = Math.max(0, 1 - (powerUp.elapsed || 0) / powerUp.duration);
                timerElement.style.setProperty('--progress', `${progress * 100}%`);
            }
        } else {
            this.elements.powerUpIndicator.classList.remove('active');
        }
    }

    /**
     * Met à jour l'affichage de la constellation
     */
    updateConstellation(gameState) {
        if (!this.elements.constellationStars) return;
        
        const constellation = gameState.constellationProgress;
        if (!constellation) return;
        
        // Mise à jour des étoiles
        this.elements.constellationStars.innerHTML = '';
        
        constellation.stars.forEach(star => {
            const starElement = document.createElement('div');
            starElement.className = `star ${star.collected ? 'collected' : ''}`;
            starElement.style.borderColor = star.color;
            starElement.style.backgroundColor = star.collected ? star.color : 'transparent';
            starElement.title = `${star.type} ${star.collected ? '✓' : ''}`;
            
            this.elements.constellationStars.appendChild(starElement);
        });
        
        // Mise à jour du label
        const labelElement = this.elements.constellationProgress.querySelector('.constellation-label');
        if (labelElement) {
            labelElement.textContent = `${constellation.patternName}: ${constellation.collected}/${constellation.total}`;
        }
        
        // Effet de morphing
        if (constellation.morphing) {
            this.elements.constellationProgress.classList.add('morphing');
            setTimeout(() => {
                this.elements.constellationProgress.classList.remove('morphing');
            }, 3000);
        }
    }

    /**
     * Met à jour l'affichage de la constellation (version complète)
     */
    updateConstellationDisplay() {
        // Cette méthode peut être appelée pour initialiser l'affichage
        if (this.elements.constellationStars) {
            this.elements.constellationStars.innerHTML = '<div class="star"></div>'.repeat(3);
        }
    }

    /**
     * Affiche l'écran de pause
     */
    showPauseScreen() {
        this.createOverlay('pause', {
            title: 'Pause',
            message: 'Jeu en pause',
            buttons: [
                { text: 'Reprendre', action: () => this.game.resumeGame() },
                { text: 'Menu Principal', action: () => this.game.returnToMenu() }
            ]
        });
    }

    /**
     * Masque l'écran de pause
     */
    hidePauseScreen() {
        this.removeOverlay('pause');
    }

    /**
     * Affiche l'écran de game over
     */
    showGameOverScreen(score, level) {
        const highScore = this.getHighScore();
        const isNewRecord = score > highScore;
        
        if (isNewRecord) {
            this.setHighScore(score);
        }
        
        this.createOverlay('gameOver', {
            title: isNewRecord ? '🏆 Nouveau Record!' : 'Game Over',
            message: `
                <div class="game-over-stats">
                    <p><strong>Score Final:</strong> ${score.toLocaleString()}</p>
                    <p><strong>Niveau Atteint:</strong> ${level}</p>
                    <p><strong>Meilleur Score:</strong> ${Math.max(score, highScore).toLocaleString()}</p>
                    ${isNewRecord ? '<p class="new-record">🎉 Nouveau record personnel!</p>' : ''}
                </div>
            `,
            autoClose: 5000,
            buttons: [
                { text: 'Rejouer', action: () => this.game.startGame() },
                { text: 'Menu Principal', action: () => this.game.returnToMenu() }
            ]
        });
    }

    /**
     * Crée un overlay générique
     */
    createOverlay(id, options) {
        // Suppression de l'overlay existant
        this.removeOverlay(id);
        
        const overlay = document.createElement('div');
        overlay.id = `overlay-${id}`;
        overlay.className = 'game-overlay';
        overlay.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
        `;
        
        const content = document.createElement('div');
        content.className = 'overlay-content';
        content.style.cssText = `
            background: rgba(26, 26, 46, 0.95);
            border: 2px solid #00ff88;
            border-radius: 12px;
            padding: 2rem;
            text-align: center;
            max-width: 400px;
            width: 80%;
        `;
        
        // Titre
        if (options.title) {
            const title = document.createElement('h2');
            title.textContent = options.title;
            title.style.cssText = `
                color: #00ff88;
                margin: 0 0 1rem 0;
                font-size: 1.8rem;
            `;
            content.appendChild(title);
        }
        
        // Message
        if (options.message) {
            const message = document.createElement('div');
            message.innerHTML = options.message;
            message.style.cssText = `
                color: #ffffff;
                margin-bottom: 1.5rem;
                line-height: 1.4;
            `;
            content.appendChild(message);
        }
        
        // Boutons
        if (options.buttons) {
            const buttonContainer = document.createElement('div');
            buttonContainer.style.cssText = `
                display: flex;
                gap: 1rem;
                justify-content: center;
                flex-wrap: wrap;
            `;
            
            options.buttons.forEach(btnConfig => {
                const button = document.createElement('button');
                button.textContent = btnConfig.text;
                button.style.cssText = `
                    padding: 0.75rem 1.5rem;
                    background: transparent;
                    color: #00ff88;
                    border: 2px solid #00ff88;
                    border-radius: 6px;
                    cursor: pointer;
                    font-family: inherit;
                    font-size: 1rem;
                    transition: all 0.2s;
                `;
                
                button.addEventListener('click', () => {
                    this.removeOverlay(id);
                    btnConfig.action();
                });
                
                button.addEventListener('mouseover', () => {
                    button.style.background = 'rgba(0, 255, 136, 0.1)';
                });
                
                button.addEventListener('mouseout', () => {
                    button.style.background = 'transparent';
                });
                
                buttonContainer.appendChild(button);
            });
            
            content.appendChild(buttonContainer);
        }
        
        overlay.appendChild(content);
        document.body.appendChild(overlay);
        
        // Fermeture automatique
        if (options.autoClose) {
            setTimeout(() => {
                this.removeOverlay(id);
            }, options.autoClose);
        }
        
        return overlay;
    }

    /**
     * Supprime un overlay
     */
    removeOverlay(id) {
        const overlay = document.getElementById(`overlay-${id}`);
        if (overlay) {
            overlay.remove();
        }
    }

    /**
     * Gestion des scores
     */
    getHighScore() {
        const saved = localStorage.getItem('serpentis_highscore');
        return saved ? parseInt(saved) : 0;
    }

    setHighScore(score) {
        localStorage.setItem('serpentis_highscore', score.toString());
    }

    /**
     * Notifications toast
     */
    showNotification(message, type = 'info', duration = 3000) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            background: ${this.getNotificationColor(type)};
            color: white;
            border-radius: 6px;
            z-index: 2000;
            transform: translateX(400px);
            transition: transform 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        // Animation d'entrée
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 10);
        
        // Suppression automatique
        setTimeout(() => {
            notification.style.transform = 'translateX(400px)';
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.remove();
                }
            }, 300);
        }, duration);
    }

    /**
     * Retourne la couleur pour un type de notification
     */
    getNotificationColor(type) {
        const colors = {
            info: '#0088ff',
            success: '#00ff88',
            warning: '#ffaa00',
            error: '#ff4444'
        };
        return colors[type] || colors.info;
    }

    /**
     * Utilitaires d'animation
     */
    animateElement(element, animationClass, duration = 1000) {
        element.classList.add(animationClass);
        setTimeout(() => {
            element.classList.remove(animationClass);
        }, duration);
    }

    /**
     * Mise à jour responsive
     */
    updateResponsiveLayout() {
        const isMobile = window.innerWidth <= 768;
        
        if (isMobile && this.currentScreen === 'game') {
            if (this.elements.mobileControls) {
                this.elements.mobileControls.style.display = 'flex';
            }
        }
    }

    /**
     * Nettoyage
     */
    cleanup() {
        // Suppression des overlays
        document.querySelectorAll('.game-overlay').forEach(overlay => {
            overlay.remove();
        });
        
        // Suppression des notifications
        document.querySelectorAll('.notification').forEach(notification => {
            notification.remove();
        });
    }
}