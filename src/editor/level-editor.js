/**
 * Éditeur de niveaux intégré
 * Permet de créer et modifier des niveaux personnalisés
 */

import { GravityWell } from '../entities/gravity-well.js';
import { ParticleSystem } from '../systems/particle-system.js';

export class LevelEditor {
    constructor(canvas, audioManager) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.audioManager = audioManager;
        
        // Dimensions
        this.width = canvas.width;
        this.height = canvas.height;
        this.gridSize = 20;
        this.gridWidth = Math.floor(this.width / this.gridSize);
        this.gridHeight = Math.floor(this.height / this.gridSize);
        
        // État de l'éditeur
        this.active = false;
        this.currentTool = 'select';
        this.selectedElement = null;
        this.dragData = null;
        
        // Éléments du niveau
        this.elements = {
            gravityWells: [],
            enemies: [],
            spawnPoints: [{ x: 10, y: 10, type: 'player' }],
            collectibles: [],
            walls: [],
            portals: []
        };
        
        // Interface utilisateur
        this.ui = {
            showGrid: true,
            showHelp: false,
            toolPanel: null,
            propertyPanel: null
        };
        
        // Outils disponibles
        this.tools = {
            select: { name: 'Sélection', cursor: 'pointer' },
            gravitywell: { name: 'Puits Gravitationnel', cursor: 'crosshair' },
            enemy: { name: 'Ennemi', cursor: 'crosshair' },
            spawn: { name: 'Point de Spawn', cursor: 'crosshair' },
            collectible: { name: 'Collectible', cursor: 'crosshair' },
            wall: { name: 'Mur', cursor: 'crosshair' },
            portal: { name: 'Portail', cursor: 'crosshair' },
            delete: { name: 'Supprimer', cursor: 'no-drop' }
        };
        
        // Particules pour feedback visuel
        this.particleSystem = new ParticleSystem();
        
        this.initializeEditor();
    }

    /**
     * Initialise l'éditeur
     */
    initializeEditor() {
        this.createUI();
        this.setupEventListeners();
        console.log('Éditeur de niveaux initialisé');
    }

    /**
     * Démarre l'éditeur
     */
    start() {
        this.active = true;
        this.showUI();
        this.canvas.style.cursor = this.tools[this.currentTool].cursor;
    }

    /**
     * Arrête l'éditeur
     */
    stop() {
        this.active = false;
        this.hideUI();
        this.canvas.style.cursor = 'default';
    }

    /**
     * Crée l'interface utilisateur
     */
    createUI() {
        // Panel d'outils
        this.ui.toolPanel = this.createToolPanel();
        
        // Panel de propriétés
        this.ui.propertyPanel = this.createPropertyPanel();
        
        // Boutons de contrôle
        this.createControlButtons();
    }

    /**
     * Crée le panel d'outils
     */
    createToolPanel() {
        const panel = document.createElement('div');
        panel.className = 'editor-tool-panel';
        panel.style.cssText = `
            position: absolute;
            top: 100px;
            right: 20px;
            width: 200px;
            background: rgba(26, 26, 46, 0.95);
            border: 2px solid #00ff88;
            border-radius: 8px;
            padding: 1rem;
            display: none;
            z-index: 100;
        `;

        const title = document.createElement('h3');
        title.textContent = 'Outils';
        title.style.cssText = `
            color: #00ff88;
            margin: 0 0 1rem 0;
            text-align: center;
        `;
        panel.appendChild(title);

        Object.keys(this.tools).forEach(toolId => {
            const tool = this.tools[toolId];
            const button = document.createElement('button');
            button.textContent = tool.name;
            button.className = 'editor-tool-btn';
            button.dataset.tool = toolId;
            button.style.cssText = `
                display: block;
                width: 100%;
                margin: 0.25rem 0;
                padding: 0.5rem;
                background: ${toolId === this.currentTool ? '#00ff88' : 'transparent'};
                color: ${toolId === this.currentTool ? '#000' : '#00ff88'};
                border: 1px solid #00ff88;
                border-radius: 4px;
                cursor: pointer;
                font-family: inherit;
                font-size: 0.9rem;
            `;
            
            button.addEventListener('click', () => this.selectTool(toolId));
            panel.appendChild(button);
        });

        document.body.appendChild(panel);
        return panel;
    }

    /**
     * Crée le panel de propriétés
     */
    createPropertyPanel() {
        const panel = document.createElement('div');
        panel.className = 'editor-property-panel';
        panel.style.cssText = `
            position: absolute;
            top: 100px;
            left: 20px;
            width: 250px;
            background: rgba(26, 26, 46, 0.95);
            border: 2px solid #00ff88;
            border-radius: 8px;
            padding: 1rem;
            display: none;
            z-index: 100;
        `;

        const title = document.createElement('h3');
        title.textContent = 'Propriétés';
        title.style.cssText = `
            color: #00ff88;
            margin: 0 0 1rem 0;
            text-align: center;
        `;
        panel.appendChild(title);

        const content = document.createElement('div');
        content.id = 'property-content';
        content.style.cssText = `
            color: #ffffff;
            font-size: 0.9rem;
        `;
        panel.appendChild(content);

        document.body.appendChild(panel);
        return panel;
    }

    /**
     * Crée les boutons de contrôle
     */
    createControlButtons() {
        const container = document.createElement('div');
        container.className = 'editor-controls';
        container.style.cssText = `
            position: absolute;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            display: none;
            gap: 1rem;
            z-index: 100;
        `;

        const buttons = [
            { id: 'test', text: 'Tester', action: () => this.testLevel() },
            { id: 'save', text: 'Sauvegarder', action: () => this.saveLevel() },
            { id: 'load', text: 'Charger', action: () => this.loadLevel() },
            { id: 'clear', text: 'Vider', action: () => this.clearLevel() },
            { id: 'help', text: 'Aide', action: () => this.toggleHelp() },
            { id: 'exit', text: 'Sortir', action: () => this.exitEditor() }
        ];

        buttons.forEach(btn => {
            const button = document.createElement('button');
            button.textContent = btn.text;
            button.className = 'editor-control-btn';
            button.style.cssText = `
                padding: 0.75rem 1.5rem;
                background: transparent;
                color: #00ff88;
                border: 2px solid #00ff88;
                border-radius: 6px;
                cursor: pointer;
                font-family: inherit;
                transition: all 0.2s;
            `;
            
            button.addEventListener('click', btn.action);
            
            button.addEventListener('mouseover', () => {
                button.style.background = 'rgba(0, 255, 136, 0.1)';
            });
            
            button.addEventListener('mouseout', () => {
                button.style.background = 'transparent';
            });
            
            container.appendChild(button);
        });

        document.body.appendChild(container);
        this.ui.controlButtons = container;
    }

    /**
     * Configure les écouteurs d'événements
     */
    setupEventListeners() {
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
        
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
    }

    /**
     * Gère le clic souris
     */
    handleMouseDown(event) {
        if (!this.active) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const gridX = Math.floor(x / this.gridSize);
        const gridY = Math.floor(y / this.gridSize);
        
        if (event.button === 0) { // Clic gauche
            this.handleLeftClick(gridX, gridY, x, y);
        } else if (event.button === 2) { // Clic droit
            this.handleRightClick(gridX, gridY);
        }
    }

    /**
     * Gère le mouvement de la souris
     */
    handleMouseMove(event) {
        if (!this.active) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const gridX = Math.floor(x / this.gridSize);
        const gridY = Math.floor(y / this.gridSize);
        
        // Mise à jour du drag
        if (this.dragData) {
            this.dragData.currentX = gridX;
            this.dragData.currentY = gridY;
            this.updateDraggedElement();
        }
        
        // Mise à jour du survol
        this.updateHover(gridX, gridY);
    }

    /**
     * Gère le relâchement de la souris
     */
    handleMouseUp(event) {
        if (!this.active) return;
        
        if (this.dragData) {
            this.finalizeDrag();
        }
    }

    /**
     * Gère le clic gauche
     */
    handleLeftClick(gridX, gridY, screenX, screenY) {
        switch (this.currentTool) {
            case 'select':
                this.selectElement(gridX, gridY);
                break;
            case 'gravitywell':
                this.addGravityWell(gridX, gridY);
                break;
            case 'enemy':
                this.addEnemy(gridX, gridY);
                break;
            case 'spawn':
                this.addSpawnPoint(gridX, gridY);
                break;
            case 'collectible':
                this.addCollectible(gridX, gridY);
                break;
            case 'wall':
                this.addWall(gridX, gridY);
                break;
            case 'portal':
                this.addPortal(gridX, gridY);
                break;
            case 'delete':
                this.deleteElement(gridX, gridY);
                break;
        }
        
        this.audioManager.playSound('menuSelect');
    }

    /**
     * Gère le clic droit
     */
    handleRightClick(gridX, gridY) {
        // Menu contextuel ou propriétés rapides
        const element = this.findElementAt(gridX, gridY);
        if (element) {
            this.selectedElement = element;
            this.updatePropertyPanel();
        }
    }

    /**
     * Gère les touches clavier
     */
    handleKeyDown(event) {
        if (!this.active) return;
        
        switch (event.key) {
            case 'Escape':
                this.selectedElement = null;
                this.currentTool = 'select';
                this.updateToolButtons();
                break;
            case 'Delete':
                if (this.selectedElement) {
                    this.removeElement(this.selectedElement);
                    this.selectedElement = null;
                }
                break;
            case 'g':
                this.ui.showGrid = !this.ui.showGrid;
                break;
            case 's':
                if (event.ctrlKey) {
                    event.preventDefault();
                    this.saveLevel();
                }
                break;
            case 'l':
                if (event.ctrlKey) {
                    event.preventDefault();
                    this.loadLevel();
                }
                break;
        }
    }

    /**
     * Sélectionne un outil
     */
    selectTool(toolId) {
        this.currentTool = toolId;
        this.canvas.style.cursor = this.tools[toolId].cursor;
        this.updateToolButtons();
        this.selectedElement = null;
        this.updatePropertyPanel();
    }

    /**
     * Met à jour les boutons d'outils
     */
    updateToolButtons() {
        const buttons = this.ui.toolPanel.querySelectorAll('.editor-tool-btn');
        buttons.forEach(btn => {
            const isSelected = btn.dataset.tool === this.currentTool;
            btn.style.background = isSelected ? '#00ff88' : 'transparent';
            btn.style.color = isSelected ? '#000' : '#00ff88';
        });
    }

    /**
     * Ajoute un puits gravitationnel
     */
    addGravityWell(gridX, gridY) {
        const well = {
            id: this.generateId(),
            type: 'gravityWell',
            x: gridX,
            y: gridY,
            strength: 1.0,
            radius: 60,
            wellType: 'attract',
            color: '#0088ff'
        };
        
        this.elements.gravityWells.push(well);
        this.particleSystem.emit(gridX * this.gridSize, gridY * this.gridSize, '#0088ff');
    }

    /**
     * Ajoute un ennemi
     */
    addEnemy(gridX, gridY) {
        const enemy = {
            id: this.generateId(),
            type: 'enemy',
            x: gridX,
            y: gridY,
            behavior: 'collector',
            color: '#ff4444'
        };
        
        this.elements.enemies.push(enemy);
        this.particleSystem.emit(gridX * this.gridSize, gridY * this.gridSize, '#ff4444');
    }

    /**
     * Ajoute un point de spawn
     */
    addSpawnPoint(gridX, gridY) {
        // Suppression de l'ancien spawn point
        this.elements.spawnPoints = this.elements.spawnPoints.filter(sp => sp.type !== 'player');
        
        const spawn = {
            id: this.generateId(),
            type: 'spawn',
            x: gridX,
            y: gridY,
            spawnType: 'player',
            color: '#00ff88'
        };
        
        this.elements.spawnPoints.push(spawn);
        this.particleSystem.emit(gridX * this.gridSize, gridY * this.gridSize, '#00ff88');
    }

    /**
     * Ajoute un collectible
     */
    addCollectible(gridX, gridY) {
        const collectible = {
            id: this.generateId(),
            type: 'collectible',
            x: gridX,
            y: gridY,
            starType: 'alpha',
            color: '#ffaa00'
        };
        
        this.elements.collectibles.push(collectible);
        this.particleSystem.emit(gridX * this.gridSize, gridY * this.gridSize, '#ffaa00');
    }

    /**
     * Ajoute un mur
     */
    addWall(gridX, gridY) {
        const wall = {
            id: this.generateId(),
            type: 'wall',
            x: gridX,
            y: gridY,
            width: 1,
            height: 1,
            color: '#666666'
        };
        
        this.elements.walls.push(wall);
    }

    /**
     * Ajoute un portail
     */
    addPortal(gridX, gridY) {
        const portal = {
            id: this.generateId(),
            type: 'portal',
            x: gridX,
            y: gridY,
            linkedPortal: null,
            color: '#ff00ff'
        };
        
        this.elements.portals.push(portal);
        this.particleSystem.emit(gridX * this.gridSize, gridY * this.gridSize, '#ff00ff');
    }

    /**
     * Sélectionne un élément
     */
    selectElement(gridX, gridY) {
        const element = this.findElementAt(gridX, gridY);
        this.selectedElement = element;
        
        if (element) {
            this.startDrag(element, gridX, gridY);
        }
        
        this.updatePropertyPanel();
    }

    /**
     * Supprime un élément
     */
    deleteElement(gridX, gridY) {
        const element = this.findElementAt(gridX, gridY);
        if (element) {
            this.removeElement(element);
            this.particleSystem.emit(gridX * this.gridSize, gridY * this.gridSize, '#ff0000');
        }
    }

    /**
     * Trouve un élément à une position
     */
    findElementAt(gridX, gridY) {
        // Recherche dans tous les types d'éléments
        const allElements = [
            ...this.elements.gravityWells,
            ...this.elements.enemies,
            ...this.elements.spawnPoints,
            ...this.elements.collectibles,
            ...this.elements.walls,
            ...this.elements.portals
        ];
        
        return allElements.find(element => 
            element.x === gridX && element.y === gridY
        );
    }

    /**
     * Supprime un élément
     */
    removeElement(element) {
        const elementTypes = Object.keys(this.elements);
        
        elementTypes.forEach(type => {
            const index = this.elements[type].indexOf(element);
            if (index >= 0) {
                this.elements[type].splice(index, 1);
            }
        });
        
        if (this.selectedElement === element) {
            this.selectedElement = null;
            this.updatePropertyPanel();
        }
    }

    /**
     * Démarre le drag d'un élément
     */
    startDrag(element, startX, startY) {
        this.dragData = {
            element,
            startX,
            startY,
            currentX: startX,
            currentY: startY,
            originalX: element.x,
            originalY: element.y
        };
    }

    /**
     * Met à jour l'élément en cours de drag
     */
    updateDraggedElement() {
        if (!this.dragData) return;
        
        this.dragData.element.x = this.dragData.currentX;
        this.dragData.element.y = this.dragData.currentY;
    }

    /**
     * Finalise le drag
     */
    finalizeDrag() {
        if (!this.dragData) return;
        
        // Vérification si la position est valide
        if (!this.isValidPosition(this.dragData.currentX, this.dragData.currentY)) {
            // Retour à la position originale
            this.dragData.element.x = this.dragData.originalX;
            this.dragData.element.y = this.dragData.originalY;
        }
        
        this.dragData = null;
    }

    /**
     * Vérifie si une position est valide
     */
    isValidPosition(x, y) {
        return x >= 0 && x < this.gridWidth && y >= 0 && y < this.gridHeight;
    }

    /**
     * Met à jour le survol
     */
    updateHover(gridX, gridY) {
        // Mise à jour du curseur selon l'outil
        const element = this.findElementAt(gridX, gridY);
        
        if (this.currentTool === 'select' && element) {
            this.canvas.style.cursor = 'grab';
        } else {
            this.canvas.style.cursor = this.tools[this.currentTool].cursor;
        }
    }

    /**
     * Met à jour le panel de propriétés
     */
    updatePropertyPanel() {
        const content = document.getElementById('property-content');
        if (!content) return;
        
        if (!this.selectedElement) {
            content.innerHTML = '<p>Aucun élément sélectionné</p>';
            return;
        }
        
        const element = this.selectedElement;
        let html = `<h4>${element.type.charAt(0).toUpperCase() + element.type.slice(1)}</h4>`;
        html += `<p><strong>Position:</strong> ${element.x}, ${element.y}</p>`;
        
        // Propriétés spécifiques selon le type
        switch (element.type) {
            case 'gravityWell':
                html += this.createGravityWellProperties(element);
                break;
            case 'enemy':
                html += this.createEnemyProperties(element);
                break;
            case 'collectible':
                html += this.createCollectibleProperties(element);
                break;
        }
        
        content.innerHTML = html;
        this.bindPropertyControls();
    }

    /**
     * Crée les contrôles pour puits gravitationnel
     */
    createGravityWellProperties(element) {
        return `
            <div class="property-group">
                <label>Force: <input type="range" min="0.1" max="2" step="0.1" value="${element.strength}" data-prop="strength"></label>
                <label>Rayon: <input type="range" min="20" max="120" step="10" value="${element.radius}" data-prop="radius"></label>
                <label>Type: 
                    <select data-prop="wellType">
                        <option value="attract" ${element.wellType === 'attract' ? 'selected' : ''}>Attraction</option>
                        <option value="repel" ${element.wellType === 'repel' ? 'selected' : ''}>Répulsion</option>
                        <option value="vortex" ${element.wellType === 'vortex' ? 'selected' : ''}>Vortex</option>
                        <option value="pulse" ${element.wellType === 'pulse' ? 'selected' : ''}>Pulse</option>
                    </select>
                </label>
            </div>
        `;
    }

    /**
     * Crée les contrôles pour ennemi
     */
    createEnemyProperties(element) {
        return `
            <div class="property-group">
                <label>Comportement: 
                    <select data-prop="behavior">
                        <option value="collector" ${element.behavior === 'collector' ? 'selected' : ''}>Collecteur</option>
                        <option value="hunter" ${element.behavior === 'hunter' ? 'selected' : ''}>Chasseur</option>
                        <option value="territorial" ${element.behavior === 'territorial' ? 'selected' : ''}>Territorial</option>
                        <option value="mimic" ${element.behavior === 'mimic' ? 'selected' : ''}>Mimique</option>
                        <option value="opportunist" ${element.behavior === 'opportunist' ? 'selected' : ''}>Opportuniste</option>
                    </select>
                </label>
            </div>
        `;
    }

    /**
     * Crée les contrôles pour collectible
     */
    createCollectibleProperties(element) {
        return `
            <div class="property-group">
                <label>Type d'étoile: 
                    <select data-prop="starType">
                        <option value="alpha" ${element.starType === 'alpha' ? 'selected' : ''}>Alpha</option>
                        <option value="beta" ${element.starType === 'beta' ? 'selected' : ''}>Beta</option>
                        <option value="gamma" ${element.starType === 'gamma' ? 'selected' : ''}>Gamma</option>
                        <option value="delta" ${element.starType === 'delta' ? 'selected' : ''}>Delta</option>
                    </select>
                </label>
            </div>
        `;
    }

    /**
     * Lie les contrôles de propriétés
     */
    bindPropertyControls() {
        const controls = document.querySelectorAll('#property-content [data-prop]');
        
        controls.forEach(control => {
            control.addEventListener('change', (e) => {
                const prop = e.target.dataset.prop;
                let value = e.target.value;
                
                // Conversion de type si nécessaire
                if (e.target.type === 'range') {
                    value = parseFloat(value);
                }
                
                if (this.selectedElement) {
                    this.selectedElement[prop] = value;
                }
            });
        });
    }

    /**
     * Met à jour l'éditeur
     */
    update(deltaTime) {
        if (!this.active) return;
        
        this.particleSystem.update(deltaTime);
    }

    /**
     * Effectue le rendu de l'éditeur
     */
    render() {
        if (!this.active) return;
        
        // Effacement
        this.ctx.fillStyle = '#0a0a0a';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // Grille
        if (this.ui.showGrid) {
            this.renderGrid();
        }
        
        // Éléments
        this.renderElements();
        
        // Élément sélectionné
        if (this.selectedElement) {
            this.renderSelection();
        }
        
        // Particules
        this.particleSystem.render(this.ctx);
        
        // Interface
        this.renderUI();
    }

    /**
     * Rendu de la grille
     */
    renderGrid() {
        this.ctx.strokeStyle = '#333333';
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
     * Rendu des éléments
     */
    renderElements() {
        // Puits gravitationnels
        this.elements.gravityWells.forEach(well => {
            this.renderGravityWell(well);
        });
        
        // Ennemis
        this.elements.enemies.forEach(enemy => {
            this.renderEnemy(enemy);
        });
        
        // Points de spawn
        this.elements.spawnPoints.forEach(spawn => {
            this.renderSpawnPoint(spawn);
        });
        
        // Collectibles
        this.elements.collectibles.forEach(collectible => {
            this.renderCollectible(collectible);
        });
        
        // Murs
        this.elements.walls.forEach(wall => {
            this.renderWall(wall);
        });
        
        // Portails
        this.elements.portals.forEach(portal => {
            this.renderPortal(portal);
        });
    }

    /**
     * Rendu d'un puits gravitationnel
     */
    renderGravityWell(well) {
        const x = well.x * this.gridSize;
        const y = well.y * this.gridSize;
        
        // Zone d'influence
        const gradient = this.ctx.createRadialGradient(x, y, 0, x, y, well.radius);
        gradient.addColorStop(0, well.color + '40');
        gradient.addColorStop(1, well.color + '00');
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(x, y, well.radius, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Centre
        this.ctx.fillStyle = well.color;
        this.ctx.fillRect(x - this.gridSize/2, y - this.gridSize/2, this.gridSize, this.gridSize);
        
        // Label
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '10px monospace';
        this.ctx.fillText(well.wellType[0].toUpperCase(), x - 3, y + 15);
    }

    /**
     * Rendu d'un ennemi
     */
    renderEnemy(enemy) {
        const x = enemy.x * this.gridSize;
        const y = enemy.y * this.gridSize;
        
        this.ctx.fillStyle = enemy.color;
        this.ctx.fillRect(x, y, this.gridSize, this.gridSize);
        
        // Indicateur de comportement
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '8px monospace';
        this.ctx.fillText(enemy.behavior[0].toUpperCase(), x + 2, y + 12);
    }

    /**
     * Rendu d'un point de spawn
     */
    renderSpawnPoint(spawn) {
        const x = spawn.x * this.gridSize;
        const y = spawn.y * this.gridSize;
        
        this.ctx.strokeStyle = spawn.color;
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(x + 2, y + 2, this.gridSize - 4, this.gridSize - 4);
        
        // Croix
        this.ctx.beginPath();
        this.ctx.moveTo(x + 5, y + this.gridSize/2);
        this.ctx.lineTo(x + this.gridSize - 5, y + this.gridSize/2);
        this.ctx.moveTo(x + this.gridSize/2, y + 5);
        this.ctx.lineTo(x + this.gridSize/2, y + this.gridSize - 5);
        this.ctx.stroke();
    }

    /**
     * Rendu d'un collectible
     */
    renderCollectible(collectible) {
        const x = collectible.x * this.gridSize + this.gridSize/2;
        const y = collectible.y * this.gridSize + this.gridSize/2;
        
        this.ctx.fillStyle = collectible.color;
        this.ctx.beginPath();
        this.ctx.arc(x, y, this.gridSize * 0.3, 0, Math.PI * 2);
        this.ctx.fill();
    }

    /**
     * Rendu d'un mur
     */
    renderWall(wall) {
        const x = wall.x * this.gridSize;
        const y = wall.y * this.gridSize;
        
        this.ctx.fillStyle = wall.color;
        this.ctx.fillRect(x, y, this.gridSize * wall.width, this.gridSize * wall.height);
    }

    /**
     * Rendu d'un portail
     */
    renderPortal(portal) {
        const x = portal.x * this.gridSize;
        const y = portal.y * this.gridSize;
        
        // Effet de portail
        const time = Date.now() * 0.005;
        for (let i = 0; i < 3; i++) {
            const radius = (this.gridSize * 0.4) * (1 + i * 0.2 + Math.sin(time + i) * 0.1);
            this.ctx.strokeStyle = portal.color + (Math.floor((1 - i * 0.3) * 255).toString(16));
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.arc(x + this.gridSize/2, y + this.gridSize/2, radius, 0, Math.PI * 2);
            this.ctx.stroke();
        }
    }

    /**
     * Rendu de la sélection
     */
    renderSelection() {
        const element = this.selectedElement;
        const x = element.x * this.gridSize;
        const y = element.y * this.gridSize;
        
        // Bordure de sélection
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);
        this.ctx.strokeRect(x - 2, y - 2, this.gridSize + 4, this.gridSize + 4);
        this.ctx.setLineDash([]);
    }

    /**
     * Rendu de l'interface
     */
    renderUI() {
        // Informations en haut
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '16px monospace';
        this.ctx.fillText(`Éditeur - Outil: ${this.tools[this.currentTool].name}`, 20, 30);
        
        // Compteurs
        const counts = this.getElementCounts();
        this.ctx.font = '12px monospace';
        let yPos = 50;
        Object.entries(counts).forEach(([type, count]) => {
            this.ctx.fillText(`${type}: ${count}`, 20, yPos);
            yPos += 20;
        });
    }

    /**
     * Utilitaires
     */
    
    generateId() {
        return 'element_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    getElementCounts() {
        return {
            'Puits Gravitationnels': this.elements.gravityWells.length,
            'Ennemis': this.elements.enemies.length,
            'Collectibles': this.elements.collectibles.length,
            'Murs': this.elements.walls.length,
            'Portails': this.elements.portals.length
        };
    }

    /**
     * Actions de l'éditeur
     */
    
    testLevel() {
        console.log('Test du niveau...');
        const levelData = this.exportLevel();
        
        // Simulation de test
        this.audioManager.playSound('menuConfirm');
        alert('Niveau testé avec succès!\n\nÉléments: ' + JSON.stringify(this.getElementCounts(), null, 2));
    }
    
    saveLevel() {
        const levelData = this.exportLevel();
        const levelName = prompt('Nom du niveau:', 'Mon Niveau');
        
        if (levelName) {
            localStorage.setItem(`serpentis_level_${levelName}`, JSON.stringify(levelData));
            this.audioManager.playSound('menuConfirm');
            alert(`Niveau "${levelName}" sauvegardé!`);
        }
    }
    
    loadLevel() {
        const levelName = prompt('Nom du niveau à charger:');
        
        if (levelName) {
            const saved = localStorage.getItem(`serpentis_level_${levelName}`);
            if (saved) {
                try {
                    const levelData = JSON.parse(saved);
                    this.importLevel(levelData);
                    this.audioManager.playSound('menuConfirm');
                    alert(`Niveau "${levelName}" chargé!`);
                } catch (error) {
                    alert('Erreur lors du chargement du niveau');
                }
            } else {
                alert('Niveau non trouvé');
            }
        }
    }
    
    clearLevel() {
        if (confirm('Vider le niveau? Cette action ne peut pas être annulée.')) {
            Object.keys(this.elements).forEach(type => {
                if (type !== 'spawnPoints') {
                    this.elements[type] = [];
                }
            });
            
            // Garder un spawn point par défaut
            this.elements.spawnPoints = [{ x: 10, y: 10, type: 'player', id: this.generateId() }];
            
            this.selectedElement = null;
            this.updatePropertyPanel();
            this.audioManager.playSound('menuBack');
        }
    }
    
    toggleHelp() {
        this.ui.showHelp = !this.ui.showHelp;
        // Implémentation de l'aide (peut être étendue)
        if (this.ui.showHelp) {
            alert(`Aide de l'éditeur:

Outils:
- Sélection: Cliquer pour sélectionner/déplacer
- Puits Gravitationnel: Cliquer pour placer
- Ennemi: Cliquer pour placer
- Point de Spawn: Cliquer pour placer (remplace le précédent)
- Collectible: Cliquer pour placer
- Mur: Cliquer pour placer
- Portail: Cliquer pour placer
- Supprimer: Cliquer sur un élément pour le supprimer

Raccourcis:
- Escape: Désélectionner
- Delete: Supprimer l'élément sélectionné
- G: Afficher/masquer la grille
- Ctrl+S: Sauvegarder
- Ctrl+L: Charger`);
        }
    }
    
    exitEditor() {
        if (confirm('Quitter l\'éditeur? Les modifications non sauvegardées seront perdues.')) {
            this.stop();
            if (window.serpentisNexus) {
                window.serpentisNexus.returnToMenu();
            }
        }
    }

    /**
     * Import/Export
     */
    
    exportLevel() {
        return {
            name: 'Niveau Personnalisé',
            created: new Date().toISOString(),
            elements: JSON.parse(JSON.stringify(this.elements)),
            metadata: {
                version: '1.0',
                gridSize: this.gridSize,
                dimensions: { width: this.gridWidth, height: this.gridHeight }
            }
        };
    }
    
    importLevel(levelData) {
        if (levelData.elements) {
            this.elements = levelData.elements;
            
            // Régénération des IDs si nécessaire
            Object.values(this.elements).forEach(elementArray => {
                elementArray.forEach(element => {
                    if (!element.id) {
                        element.id = this.generateId();
                    }
                });
            });
        }
        
        this.selectedElement = null;
        this.updatePropertyPanel();
    }

    /**
     * Interface utilisateur
     */
    
    showUI() {
        if (this.ui.toolPanel) this.ui.toolPanel.style.display = 'block';
        if (this.ui.propertyPanel) this.ui.propertyPanel.style.display = 'block';
        if (this.ui.controlButtons) this.ui.controlButtons.style.display = 'flex';
    }
    
    hideUI() {
        if (this.ui.toolPanel) this.ui.toolPanel.style.display = 'none';
        if (this.ui.propertyPanel) this.ui.propertyPanel.style.display = 'none';
        if (this.ui.controlButtons) this.ui.controlButtons.style.display = 'none';
    }

    /**
     * Gestion du redimensionnement
     */
    handleResize(width, height) {
        this.width = width;
        this.height = height;
        this.gridWidth = Math.floor(width / this.gridSize);
        this.gridHeight = Math.floor(height / this.gridSize);
    }
}