/**
 * Gestionnaire d'entrées pour contrôles desktop et mobile
 * Gère clavier, touch, et gamepad avec callbacks
 */

export class InputManager {
    constructor() {
        // État des contrôles
        this.keys = {};
        this.touchState = {
            active: false,
            startX: 0,
            startY: 0,
            currentX: 0,
            currentY: 0
        };
        
        // Callbacks
        this.directionCallback = null;
        this.actionCallbacks = new Map();
        
        // Configuration
        this.swipeThreshold = 30;
        this.gamepadIndex = -1;
        this.gamepadState = {};
        
        // Détection de l'appareil
        this.isMobile = this.detectMobileDevice();
        
        this.initializeControls();
    }

    /**
     * Détecte si l'appareil est mobile
     */
    detectMobileDevice() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
               (navigator.maxTouchPoints && navigator.maxTouchPoints > 2);
    }

    /**
     * Initialise tous les contrôles
     */
    initializeControls() {
        this.setupKeyboardControls();
        this.setupMouseControls();
        this.setupTouchControls();
        this.setupGamepadControls();
        this.setupUIControls();
        
        // Affichage des contrôles mobiles si nécessaire
        if (this.isMobile) {
            this.showMobileControls();
        }
        
        console.log(`Contrôles initialisés (${this.isMobile ? 'mobile' : 'desktop'})`);
    }

    /**
     * Configuration des contrôles clavier
     */
    setupKeyboardControls() {
        const keyMappings = {
            // Directions WASD
            'KeyW': 'up',
            'KeyA': 'left',
            'KeyS': 'down',
            'KeyD': 'right',
            
            // Directions flèches
            'ArrowUp': 'up',
            'ArrowLeft': 'left',
            'ArrowDown': 'down',
            'ArrowRight': 'right',
            
            // Actions
            'Space': 'boost',
            'ShiftLeft': 'boost',
            'ShiftRight': 'boost',
            'Escape': 'pause',
            'KeyP': 'pause',
            'Enter': 'confirm',
            'Backspace': 'back'
        };
        
        document.addEventListener('keydown', (event) => {
            const mapping = keyMappings[event.code];
            if (mapping) {
                event.preventDefault();
                this.handleInput(mapping, true);
            }
            
            this.keys[event.code] = true;
        });
        
        document.addEventListener('keyup', (event) => {
            const mapping = keyMappings[event.code];
            if (mapping) {
                event.preventDefault();
                this.handleInput(mapping, false);
            }
            
            this.keys[event.code] = false;
        });
    }

    /**
     * Configuration des contrôles souris
     */
    setupMouseControls() {
        let mouseDown = false;
        let startPos = { x: 0, y: 0 };
        
        document.addEventListener('mousedown', (event) => {
            mouseDown = true;
            startPos = { x: event.clientX, y: event.clientY };
        });
        
        document.addEventListener('mouseup', (event) => {
            if (mouseDown) {
                const deltaX = event.clientX - startPos.x;
                const deltaY = event.clientY - startPos.y;
                const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
                
                if (distance > this.swipeThreshold) {
                    const direction = this.calculateSwipeDirection(deltaX, deltaY);
                    this.handleInput(direction, true);
                }
            }
            mouseDown = false;
        });
        
        // Gestion de la molette pour actions spéciales
        document.addEventListener('wheel', (event) => {
            if (Math.abs(event.deltaY) > 10) {
                event.preventDefault();
                this.handleInput('boost', true);
            }
        });
    }

    /**
     * Configuration des contrôles tactiles
     */
    setupTouchControls() {
        let touchStartTime = 0;
        
        // Touch events sur le canvas
        const canvas = document.getElementById('gameCanvas');
        if (canvas) {
            canvas.addEventListener('touchstart', (event) => {
                event.preventDefault();
                const touch = event.touches[0];
                this.touchState.active = true;
                this.touchState.startX = touch.clientX;
                this.touchState.startY = touch.clientY;
                this.touchState.currentX = touch.clientX;
                this.touchState.currentY = touch.clientY;
                touchStartTime = Date.now();
            });
            
            canvas.addEventListener('touchmove', (event) => {
                event.preventDefault();
                if (this.touchState.active) {
                    const touch = event.touches[0];
                    this.touchState.currentX = touch.clientX;
                    this.touchState.currentY = touch.clientY;
                }
            });
            
            canvas.addEventListener('touchend', (event) => {
                event.preventDefault();
                if (this.touchState.active) {
                    const deltaX = this.touchState.currentX - this.touchState.startX;
                    const deltaY = this.touchState.currentY - this.touchState.startY;
                    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
                    const duration = Date.now() - touchStartTime;
                    
                    if (distance > this.swipeThreshold) {
                        // Swipe détecté
                        const direction = this.calculateSwipeDirection(deltaX, deltaY);
                        this.handleInput(direction, true);
                    } else if (duration < 200) {
                        // Tap rapide = boost
                        this.handleInput('boost', true);
                    }
                    
                    this.touchState.active = false;
                }
            });
        }
    }

    /**
     * Configuration des contrôles gamepad
     */
    setupGamepadControls() {
        window.addEventListener('gamepadconnected', (event) => {
            console.log('Gamepad connecté:', event.gamepad.id);
            this.gamepadIndex = event.gamepad.index;
        });
        
        window.addEventListener('gamepaddisconnected', (event) => {
            console.log('Gamepad déconnecté');
            this.gamepadIndex = -1;
        });
        
        // Polling gamepad (nécessaire pour certains navigateurs)
        if (this.supportsGamepad()) {
            this.startGamepadPolling();
        }
    }

    /**
     * Configuration des contrôles UI (boutons tactiles)
     */
    setupUIControls() {
        // Boutons directionnels
        const dpadButtons = document.querySelectorAll('.dpad-btn');
        dpadButtons.forEach(button => {
            const direction = button.getAttribute('data-direction');
            
            button.addEventListener('touchstart', (event) => {
                event.preventDefault();
                button.classList.add('active');
                this.handleInput(direction, true);
            });
            
            button.addEventListener('touchend', (event) => {
                event.preventDefault();
                button.classList.remove('active');
            });
            
            // Support clics souris pour test
            button.addEventListener('mousedown', (event) => {
                event.preventDefault();
                this.handleInput(direction, true);
            });
        });
        
        // Boutons d'action
        const pauseBtn = document.getElementById('pauseBtn');
        if (pauseBtn) {
            pauseBtn.addEventListener('click', () => {
                this.handleInput('pause', true);
            });
        }
        
        const boostBtn = document.getElementById('boostBtn');
        if (boostBtn) {
            boostBtn.addEventListener('touchstart', (event) => {
                event.preventDefault();
                this.handleInput('boost', true);
            });
            
            boostBtn.addEventListener('click', (event) => {
                event.preventDefault();
                this.handleInput('boost', true);
            });
        }
    }

    /**
     * Gère les entrées unifiées
     */
    handleInput(action, pressed) {
        if (!pressed) return; // On ne gère que les pressions pour l'instant
        
        // Directions
        if (['up', 'down', 'left', 'right'].includes(action)) {
            if (this.directionCallback) {
                this.directionCallback(action);
            }
        } 
        // Actions
        else {
            const callback = this.actionCallbacks.get(action);
            if (callback) {
                callback();
            }
        }
    }

    /**
     * Calcule la direction du swipe
     */
    calculateSwipeDirection(deltaX, deltaY) {
        const absDeltaX = Math.abs(deltaX);
        const absDeltaY = Math.abs(deltaY);
        
        if (absDeltaX > absDeltaY) {
            return deltaX > 0 ? 'right' : 'left';
        } else {
            return deltaY > 0 ? 'down' : 'up';
        }
    }

    /**
     * Démarre le polling gamepad
     */
    startGamepadPolling() {
        const pollGamepad = () => {
            if (this.gamepadIndex >= 0) {
                const gamepad = navigator.getGamepads()[this.gamepadIndex];
                if (gamepad) {
                    this.processGamepadInput(gamepad);
                }
            }
            requestAnimationFrame(pollGamepad);
        };
        
        pollGamepad();
    }

    /**
     * Traite les entrées gamepad
     */
    processGamepadInput(gamepad) {
        // Stick analogique gauche
        const deadzone = 0.3;
        const leftStickX = Math.abs(gamepad.axes[0]) > deadzone ? gamepad.axes[0] : 0;
        const leftStickY = Math.abs(gamepad.axes[1]) > deadzone ? gamepad.axes[1] : 0;
        
        // Conversion en directions
        if (Math.abs(leftStickX) > Math.abs(leftStickY)) {
            if (leftStickX > deadzone && !this.gamepadState.right) {
                this.handleInput('right', true);
                this.gamepadState.right = true;
                this.gamepadState.left = false;
            } else if (leftStickX < -deadzone && !this.gamepadState.left) {
                this.handleInput('left', true);
                this.gamepadState.left = true;
                this.gamepadState.right = false;
            } else if (Math.abs(leftStickX) <= deadzone) {
                this.gamepadState.left = false;
                this.gamepadState.right = false;
            }
        } else if (Math.abs(leftStickY) > deadzone) {
            if (leftStickY > deadzone && !this.gamepadState.down) {
                this.handleInput('down', true);
                this.gamepadState.down = true;
                this.gamepadState.up = false;
            } else if (leftStickY < -deadzone && !this.gamepadState.up) {
                this.handleInput('up', true);
                this.gamepadState.up = true;
                this.gamepadState.down = false;
            }
        } else {
            this.gamepadState.up = false;
            this.gamepadState.down = false;
        }
        
        // D-pad
        if (gamepad.buttons[12].pressed && !this.gamepadState.dpadUp) {
            this.handleInput('up', true);
            this.gamepadState.dpadUp = true;
        } else if (!gamepad.buttons[12].pressed) {
            this.gamepadState.dpadUp = false;
        }
        
        if (gamepad.buttons[13].pressed && !this.gamepadState.dpadDown) {
            this.handleInput('down', true);
            this.gamepadState.dpadDown = true;
        } else if (!gamepad.buttons[13].pressed) {
            this.gamepadState.dpadDown = false;
        }
        
        if (gamepad.buttons[14].pressed && !this.gamepadState.dpadLeft) {
            this.handleInput('left', true);
            this.gamepadState.dpadLeft = true;
        } else if (!gamepad.buttons[14].pressed) {
            this.gamepadState.dpadLeft = false;
        }
        
        if (gamepad.buttons[15].pressed && !this.gamepadState.dpadRight) {
            this.handleInput('right', true);
            this.gamepadState.dpadRight = true;
        } else if (!gamepad.buttons[15].pressed) {
            this.gamepadState.dpadRight = false;
        }
        
        // Boutons d'action
        if (gamepad.buttons[0].pressed && !this.gamepadState.buttonA) { // A/Cross
            this.handleInput('boost', true);
            this.gamepadState.buttonA = true;
        } else if (!gamepad.buttons[0].pressed) {
            this.gamepadState.buttonA = false;
        }
        
        if (gamepad.buttons[9].pressed && !this.gamepadState.start) { // Start
            this.handleInput('pause', true);
            this.gamepadState.start = true;
        } else if (!gamepad.buttons[9].pressed) {
            this.gamepadState.start = false;
        }
    }

    /**
     * Vérifie le support gamepad
     */
    supportsGamepad() {
        return 'getGamepads' in navigator;
    }

    /**
     * Affiche les contrôles mobiles
     */
    showMobileControls() {
        const mobileControls = document.getElementById('mobileControls');
        if (mobileControls) {
            mobileControls.style.display = 'flex';
        }
    }

    /**
     * Masque les contrôles mobiles
     */
    hideMobileControls() {
        const mobileControls = document.getElementById('mobileControls');
        if (mobileControls) {
            mobileControls.style.display = 'none';
        }
    }

    /**
     * Bascule les contrôles mobiles
     */
    toggleMobileControls() {
        const mobileControls = document.getElementById('mobileControls');
        if (mobileControls) {
            const isVisible = mobileControls.style.display !== 'none';
            mobileControls.style.display = isVisible ? 'none' : 'flex';
        }
    }

    /**
     * Définit le callback pour les changements de direction
     */
    onDirectionChange(callback) {
        this.directionCallback = callback;
    }

    /**
     * Définit un callback pour une action
     */
    onAction(action, callback) {
        this.actionCallbacks.set(action, callback);
    }

    /**
     * Supprime un callback d'action
     */
    removeAction(action) {
        this.actionCallbacks.delete(action);
    }

    /**
     * Vérifie si une touche est pressée
     */
    isKeyPressed(keyCode) {
        return !!this.keys[keyCode];
    }

    /**
     * Vérifie si plusieurs touches sont pressées
     */
    areKeysPressed(keyCodes) {
        return keyCodes.every(code => this.isKeyPressed(code));
    }

    /**
     * Retourne l'état du touch
     */
    getTouchState() {
        return { ...this.touchState };
    }

    /**
     * Active/désactive les vibrations (mobile uniquement)
     */
    vibrate(pattern = [100]) {
        if ('vibrate' in navigator && this.isMobile) {
            navigator.vibrate(pattern);
        }
    }

    /**
     * Feedback haptique pour les actions importantes
     */
    hapticFeedback(type = 'light') {
        const patterns = {
            light: [50],
            medium: [100],
            heavy: [200],
            success: [100, 50, 100],
            error: [300, 100, 300]
        };
        
        this.vibrate(patterns[type] || patterns.light);
    }

    /**
     * Configuration des raccourcis clavier personnalisés
     */
    setCustomKeyMapping(key, action) {
        // Ajouter un mapping personnalisé
        document.addEventListener('keydown', (event) => {
            if (event.code === key) {
                event.preventDefault();
                this.handleInput(action, true);
            }
        });
    }

    /**
     * Nettoyage des écouteurs d'événements
     */
    cleanup() {
        // Suppression des écouteurs (à implémenter si nécessaire)
        console.log('Nettoyage du gestionnaire d\'entrées');
    }

    /**
     * Informations sur l'état des contrôles
     */
    getControlsInfo() {
        return {
            isMobile: this.isMobile,
            hasGamepad: this.gamepadIndex >= 0,
            touchActive: this.touchState.active,
            supportedInputs: {
                keyboard: true,
                mouse: true,
                touch: 'ontouchstart' in window,
                gamepad: this.supportsGamepad(),
                vibration: 'vibrate' in navigator
            }
        };
    }
}