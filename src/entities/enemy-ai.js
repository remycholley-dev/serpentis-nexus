/**
 * Intelligence artificielle pour les serpents ennemis
 * Implémente des comportements variés et adaptatifs
 */

export class EnemyAI {
    constructor(snake, gameEngine) {
        this.snake = snake;
        this.gameEngine = gameEngine;
        
        // Type de comportement IA
        this.behaviorType = this.selectRandomBehavior();
        
        // État de l'IA
        this.currentTarget = null;
        this.pathfindingCooldown = 0;
        this.decisionCooldown = 0;
        this.stuckCounter = 0;
        this.lastPosition = { x: 0, y: 0 };
        
        // Mémoire comportementale
        this.memory = {
            lastPlayerPosition: null,
            dangerZones: [],
            safePath: [],
            targetHistory: [],
            collisionAvoidance: true
        };
        
        // Paramètres selon le comportement
        this.behaviorParams = this.getBehaviorParameters();
        
        console.log(`IA créée avec comportement: ${this.behaviorType}`);
    }

    /**
     * Sélectionne un comportement aléatoire
     */
    selectRandomBehavior() {
        const behaviors = ['hunter', 'collector', 'territorial', 'mimic', 'opportunist'];
        return behaviors[Math.floor(Math.random() * behaviors.length)];
    }

    /**
     * Retourne les paramètres selon le comportement
     */
    getBehaviorParameters() {
        const params = {
            hunter: {
                aggressiveness: 0.8,
                collectProbability: 0.2,
                playerTrackingRange: 8,
                avoidanceRadius: 3,
                speedModifier: 1.2
            },
            collector: {
                aggressiveness: 0.2,
                collectProbability: 0.9,
                playerTrackingRange: 4,
                avoidanceRadius: 5,
                speedModifier: 0.9
            },
            territorial: {
                aggressiveness: 0.6,
                collectProbability: 0.4,
                playerTrackingRange: 6,
                avoidanceRadius: 4,
                territoryRadius: 10,
                speedModifier: 1.0
            },
            mimic: {
                aggressiveness: 0.4,
                collectProbability: 0.6,
                playerTrackingRange: 10,
                avoidanceRadius: 2,
                mimicDelay: 1000,
                speedModifier: 1.1
            },
            opportunist: {
                aggressiveness: 0.5,
                collectProbability: 0.7,
                playerTrackingRange: 7,
                avoidanceRadius: 4,
                opportunityRadius: 6,
                speedModifier: 1.0
            }
        };
        
        return params[this.behaviorType] || params.collector;
    }

    /**
     * Met à jour l'IA
     */
    update() {
        if (!this.snake.alive) return;
        
        // Mise à jour des cooldowns
        if (this.pathfindingCooldown > 0) this.pathfindingCooldown--;
        if (this.decisionCooldown > 0) this.decisionCooldown--;
        
        // Détection de blocage
        this.detectStuck();
        
        // Prise de décision principale
        if (this.decisionCooldown <= 0) {
            this.makeDecision();
            this.decisionCooldown = 30; // Nouvelle décision toutes les 0.5 secondes
        }
        
        // Mise à jour de la mémoire
        this.updateMemory();
    }

    /**
     * Prise de décision principale
     */
    makeDecision() {
        // Évaluation de l'environnement
        const environment = this.analyzeEnvironment();
        
        // Décision selon le comportement
        switch (this.behaviorType) {
            case 'hunter':
                this.hunterBehavior(environment);
                break;
            case 'collector':
                this.collectorBehavior(environment);
                break;
            case 'territorial':
                this.territorialBehavior(environment);
                break;
            case 'mimic':
                this.mimicBehavior(environment);
                break;
            case 'opportunist':
                this.opportunistBehavior(environment);
                break;
        }
        
        // Application de l'évitement de collision
        this.applyCollisionAvoidance();
    }

    /**
     * Analyse l'environnement
     */
    analyzeEnvironment() {
        const head = this.snake.getHead();
        const playerSnake = this.gameEngine.playerSnake;
        const collectibles = this.gameEngine.collectibles;
        const enemies = this.gameEngine.enemies.filter(e => e !== this.snake);
        const gravityWells = this.gameEngine.gravityWells;
        
        return {
            myPosition: head,
            playerPosition: playerSnake ? playerSnake.getHead() : null,
            playerDistance: playerSnake ? this.calculateDistance(head, playerSnake.getHead()) : Infinity,
            nearestCollectible: this.findNearestCollectible(collectibles, head),
            nearestEnemy: this.findNearestEnemy(enemies, head),
            nearestGravityWell: this.findNearestGravityWell(gravityWells, head),
            dangers: this.identifyDangers(head),
            opportunities: this.identifyOpportunities(head)
        };
    }

    /**
     * Comportement chasseur
     */
    hunterBehavior(env) {
        if (env.playerPosition && env.playerDistance < this.behaviorParams.playerTrackingRange) {
            // Chasse agressive du joueur
            this.setTarget(env.playerPosition, 'hunt');
            
            // Tentative de prédiction du mouvement
            if (this.memory.lastPlayerPosition) {
                const predictedPosition = this.predictPlayerMovement(env.playerPosition);
                if (predictedPosition) {
                    this.setTarget(predictedPosition, 'intercept');
                }
            }
        } else if (env.nearestCollectible && Math.random() < this.behaviorParams.collectProbability) {
            // Collecte occasionnelle
            this.setTarget(env.nearestCollectible, 'collect');
        } else {
            // Patrouille
            this.patrolBehavior();
        }
    }

    /**
     * Comportement collecteur
     */
    collectorBehavior(env) {
        if (env.nearestCollectible) {
            // Priorité absolue aux collectibles
            this.setTarget(env.nearestCollectible, 'collect');
        } else if (env.playerPosition && env.playerDistance < this.behaviorParams.playerTrackingRange && 
                   Math.random() < this.behaviorParams.aggressiveness) {
            // Évitement ou confrontation occasionnelle
            if (this.snake.segments.length > this.gameEngine.playerSnake.segments.length) {
                this.setTarget(env.playerPosition, 'hunt');
            } else {
                this.avoidTarget(env.playerPosition);
            }
        } else {
            // Recherche de collectibles
            this.searchBehavior();
        }
    }

    /**
     * Comportement territorial
     */
    territorialBehavior(env) {
        const territoryCenter = this.getTerritoryCentre();
        const distanceFromTerritory = this.calculateDistance(env.myPosition, territoryCenter);
        
        if (distanceFromTerritory > this.behaviorParams.territoryRadius) {
            // Retour au territoire
            this.setTarget(territoryCenter, 'return');
        } else if (env.playerPosition && env.playerDistance < this.behaviorParams.territoryRadius) {
            // Défense du territoire
            this.setTarget(env.playerPosition, 'defend');
        } else if (env.nearestCollectible && 
                   this.calculateDistance(env.nearestCollectible, territoryCenter) < this.behaviorParams.territoryRadius) {
            // Collecte dans le territoire
            this.setTarget(env.nearestCollectible, 'collect');
        } else {
            // Patrouille territoriale
            this.territorialPatrol(territoryCenter);
        }
    }

    /**
     * Comportement mimique
     */
    mimicBehavior(env) {
        if (env.playerPosition) {
            // Imitation avec délai
            setTimeout(() => {
                if (this.memory.lastPlayerPosition) {
                    this.setTarget(this.memory.lastPlayerPosition, 'mimic');
                }
            }, this.behaviorParams.mimicDelay);
            
            // Maintien d'une distance d'imitation
            if (env.playerDistance < 5) {
                this.maintainDistance(env.playerPosition, 5);
            } else if (env.playerDistance > 15) {
                this.setTarget(env.playerPosition, 'approach');
            }
        }
        
        // Collecte opportuniste
        if (env.nearestCollectible && Math.random() < this.behaviorParams.collectProbability) {
            this.setTarget(env.nearestCollectible, 'collect');
        }
    }

    /**
     * Comportement opportuniste
     */
    opportunistBehavior(env) {
        // Évaluation des opportunités
        const opportunities = env.opportunities;
        
        if (opportunities.length > 0) {
            // Priorisation des opportunités
            const bestOpportunity = this.evaluateOpportunities(opportunities);
            this.setTarget(bestOpportunity.position, bestOpportunity.type);
        } else if (env.nearestCollectible) {
            this.setTarget(env.nearestCollectible, 'collect');
        } else if (env.playerPosition && env.playerDistance < this.behaviorParams.playerTrackingRange) {
            // Analyse risque/bénéfice
            const riskLevel = this.assessRisk(env);
            if (riskLevel < 0.7) {
                this.setTarget(env.playerPosition, 'hunt');
            } else {
                this.avoidTarget(env.playerPosition);
            }
        }
    }

    /**
     * Définit une cible
     */
    setTarget(position, action) {
        this.currentTarget = {
            x: position.x,
            y: position.y,
            action: action,
            priority: this.getActionPriority(action)
        };
        
        // Calcul du chemin
        if (this.pathfindingCooldown <= 0) {
            const direction = this.calculateBestDirection(position);
            if (direction) {
                this.snake.setDirection(direction);
                this.pathfindingCooldown = 15; // Nouveau pathfinding toutes les 0.25 secondes
            }
        }
    }

    /**
     * Évite une cible
     */
    avoidTarget(position) {
        const head = this.snake.getHead();
        const avoidDirection = {
            x: head.x - position.x,
            y: head.y - position.y
        };
        
        // Normalisation et application
        const magnitude = Math.sqrt(avoidDirection.x ** 2 + avoidDirection.y ** 2);
        if (magnitude > 0) {
            avoidDirection.x /= magnitude;
            avoidDirection.y /= magnitude;
            
            const direction = this.vectorToDirection(avoidDirection);
            if (direction) {
                this.snake.setDirection(direction);
            }
        }
    }

    /**
     * Calcule la meilleure direction vers une cible
     */
    calculateBestDirection(target) {
        const head = this.snake.getHead();
        const dx = target.x - head.x;
        const dy = target.y - head.y;
        
        // A* simplifié pour éviter les obstacles
        const directions = [
            { name: 'right', dx: 1, dy: 0, cost: Math.abs(dx - 1) + Math.abs(dy) },
            { name: 'left', dx: -1, dy: 0, cost: Math.abs(dx + 1) + Math.abs(dy) },
            { name: 'down', dx: 0, dy: 1, cost: Math.abs(dx) + Math.abs(dy - 1) },
            { name: 'up', dx: 0, dy: -1, cost: Math.abs(dx) + Math.abs(dy + 1) }
        ];
        
        // Tri par coût
        directions.sort((a, b) => a.cost - b.cost);
        
        // Vérification des obstacles
        for (const dir of directions) {
            const nextPos = {
                x: head.x + dir.dx,
                y: head.y + dir.dy
            };
            
            if (this.isPositionSafe(nextPos)) {
                return dir.name;
            }
        }
        
        // Direction par défaut si aucune n'est sûre
        return directions[0].name;
    }

    /**
     * Vérifie si une position est sûre
     */
    isPositionSafe(position) {
        const { x, y } = position;
        
        // Vérification des limites
        if (x < 0 || x >= this.gameEngine.gridWidth || 
            y < 0 || y >= this.gameEngine.gridHeight) {
            return false;
        }
        
        // Vérification des collisions avec soi-même
        for (const segment of this.snake.segments) {
            if (segment.x === x && segment.y === y) {
                return false;
            }
        }
        
        // Vérification des collisions avec d'autres serpents
        const allSnakes = [this.gameEngine.playerSnake, ...this.gameEngine.enemies];
        for (const snake of allSnakes) {
            if (snake === this.snake || !snake.alive) continue;
            
            for (const segment of snake.segments) {
                if (segment.x === x && segment.y === y) {
                    return false;
                }
            }
        }
        
        // Vérification des puits gravitationnels dangereux
        for (const well of this.gameEngine.gravityWells) {
            if (well.type === 'repel' && well.isInRange(x, y)) {
                const distance = this.calculateDistance(position, { x: well.x, y: well.y });
                if (distance < 2) { // Trop proche du centre
                    return false;
                }
            }
        }
        
        return true;
    }

    /**
     * Applique l'évitement de collision
     */
    applyCollisionAvoidance() {
        const head = this.snake.getHead();
        const currentDirection = this.snake.getCurrentDirectionName();
        
        // Prédiction de la prochaine position
        const directions = {
            up: { x: 0, y: -1 },
            down: { x: 0, y: 1 },
            left: { x: -1, y: 0 },
            right: { x: 1, y: 0 }
        };
        
        const nextPos = {
            x: head.x + directions[currentDirection].x,
            y: head.y + directions[currentDirection].y
        };
        
        // Si la prochaine position est dangereuse
        if (!this.isPositionSafe(nextPos)) {
            const alternativeDirections = Object.keys(directions).filter(dir => dir !== currentDirection);
            
            for (const dir of alternativeDirections) {
                const altPos = {
                    x: head.x + directions[dir].x,
                    y: head.y + directions[dir].y
                };
                
                if (this.isPositionSafe(altPos)) {
                    this.snake.setDirection(dir);
                    break;
                }
            }
        }
    }

    /**
     * Détection de blocage
     */
    detectStuck() {
        const head = this.snake.getHead();
        
        if (this.lastPosition.x === head.x && this.lastPosition.y === head.y) {
            this.stuckCounter++;
        } else {
            this.stuckCounter = 0;
        }
        
        // Si bloqué trop longtemps, changer de direction aléatoirement
        if (this.stuckCounter > 10) {
            const randomDirections = ['up', 'down', 'left', 'right'];
            const randomDir = randomDirections[Math.floor(Math.random() * randomDirections.length)];
            this.snake.setDirection(randomDir);
            this.stuckCounter = 0;
        }
        
        this.lastPosition = { x: head.x, y: head.y };
    }

    /**
     * Met à jour la mémoire de l'IA
     */
    updateMemory() {
        // Mémorisation de la position du joueur
        if (this.gameEngine.playerSnake && this.gameEngine.playerSnake.alive) {
            this.memory.lastPlayerPosition = { ...this.gameEngine.playerSnake.getHead() };
        }
        
        // Mise à jour de l'historique des cibles
        if (this.currentTarget) {
            this.memory.targetHistory.push({
                target: { ...this.currentTarget },
                timestamp: Date.now()
            });
            
            // Limitation de l'historique
            if (this.memory.targetHistory.length > 10) {
                this.memory.targetHistory.shift();
            }
        }
    }

    /**
     * Utilitaires de calcul
     */
    calculateDistance(pos1, pos2) {
        const dx = pos2.x - pos1.x;
        const dy = pos2.y - pos1.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    findNearestCollectible(collectibles, position) {
        if (!collectibles.length) return null;
        
        let nearest = null;
        let minDistance = Infinity;
        
        for (const collectible of collectibles) {
            const distance = this.calculateDistance(position, collectible);
            if (distance < minDistance) {
                minDistance = distance;
                nearest = collectible;
            }
        }
        
        return nearest;
    }

    findNearestEnemy(enemies, position) {
        if (!enemies.length) return null;
        
        let nearest = null;
        let minDistance = Infinity;
        
        for (const enemy of enemies) {
            const distance = this.calculateDistance(position, enemy.getHead());
            if (distance < minDistance) {
                minDistance = distance;
                nearest = enemy;
            }
        }
        
        return nearest;
    }

    findNearestGravityWell(wells, position) {
        if (!wells.length) return null;
        
        let nearest = null;
        let minDistance = Infinity;
        
        for (const well of wells) {
            const distance = this.calculateDistance(position, { x: well.x, y: well.y });
            if (distance < minDistance) {
                minDistance = distance;
                nearest = well;
            }
        }
        
        return nearest;
    }

    vectorToDirection(vector) {
        const absX = Math.abs(vector.x);
        const absY = Math.abs(vector.y);
        
        if (absX > absY) {
            return vector.x > 0 ? 'right' : 'left';
        } else {
            return vector.y > 0 ? 'down' : 'up';
        }
    }

    getActionPriority(action) {
        const priorities = {
            'hunt': 8,
            'defend': 9,
            'collect': 6,
            'avoid': 10,
            'patrol': 3,
            'return': 7,
            'mimic': 4,
            'intercept': 9
        };
        
        return priorities[action] || 5;
    }

    // Comportements spécialisés
    patrolBehavior() {
        // Implémentation simplifiée de patrouille
        const directions = ['up', 'down', 'left', 'right'];
        if (Math.random() < 0.1) { // 10% de chance de changer de direction
            const randomDir = directions[Math.floor(Math.random() * directions.length)];
            this.snake.setDirection(randomDir);
        }
    }

    searchBehavior() {
        // Recherche active de collectibles
        const head = this.snake.getHead();
        const searchDirections = this.getSpiralSearchDirections(head);
        
        for (const dir of searchDirections) {
            const nextPos = {
                x: head.x + dir.dx,
                y: head.y + dir.dy
            };
            
            if (this.isPositionSafe(nextPos)) {
                this.snake.setDirection(dir.name);
                break;
            }
        }
    }

    getSpiralSearchDirections(center) {
        // Génère des directions en spirale pour la recherche
        return [
            { name: 'right', dx: 1, dy: 0 },
            { name: 'down', dx: 0, dy: 1 },
            { name: 'left', dx: -1, dy: 0 },
            { name: 'up', dx: 0, dy: -1 }
        ];
    }

    getTerritoryCentre() {
        // Centre du territoire (position de spawn)
        return { x: Math.floor(this.gameEngine.gridWidth / 4), y: Math.floor(this.gameEngine.gridHeight / 4) };
    }

    territorialPatrol(center) {
        const head = this.snake.getHead();
        const distance = this.calculateDistance(head, center);
        
        // Mouvement circulaire autour du centre
        const angle = Math.atan2(head.y - center.y, head.x - center.x);
        const targetAngle = angle + 0.1; // Rotation lente
        
        const targetX = center.x + Math.cos(targetAngle) * Math.min(distance, this.behaviorParams.territoryRadius);
        const targetY = center.y + Math.sin(targetAngle) * Math.min(distance, this.behaviorParams.territoryRadius);
        
        this.setTarget({ x: Math.round(targetX), y: Math.round(targetY) }, 'patrol');
    }

    maintainDistance(target, desiredDistance) {
        const head = this.snake.getHead();
        const currentDistance = this.calculateDistance(head, target);
        
        if (currentDistance < desiredDistance) {
            this.avoidTarget(target);
        } else if (currentDistance > desiredDistance * 1.5) {
            this.setTarget(target, 'approach');
        }
    }

    identifyDangers(position) {
        const dangers = [];
        
        // Puits gravitationnels dangereux
        for (const well of this.gameEngine.gravityWells) {
            if (well.type === 'repel' && well.isInRange(position.x, position.y)) {
                dangers.push({ type: 'gravity_well', position: well, severity: 0.8 });
            }
        }
        
        // Serpents plus gros
        const allSnakes = [this.gameEngine.playerSnake, ...this.gameEngine.enemies];
        for (const snake of allSnakes) {
            if (snake === this.snake || !snake.alive) continue;
            
            if (snake.segments.length > this.snake.segments.length) {
                const distance = this.calculateDistance(position, snake.getHead());
                if (distance < 5) {
                    dangers.push({ type: 'larger_snake', position: snake.getHead(), severity: 0.9 });
                }
            }
        }
        
        return dangers;
    }

    identifyOpportunities(position) {
        const opportunities = [];
        
        // Serpents plus petits
        const allSnakes = [this.gameEngine.playerSnake, ...this.gameEngine.enemies];
        for (const snake of allSnakes) {
            if (snake === this.snake || !snake.alive) continue;
            
            if (snake.segments.length < this.snake.segments.length) {
                const distance = this.calculateDistance(position, snake.getHead());
                if (distance < this.behaviorParams.opportunityRadius) {
                    opportunities.push({
                        type: 'smaller_snake',
                        position: snake.getHead(),
                        value: snake.segments.length * 10
                    });
                }
            }
        }
        
        return opportunities;
    }

    evaluateOpportunities(opportunities) {
        return opportunities.reduce((best, current) => 
            current.value > best.value ? current : best
        );
    }

    assessRisk(environment) {
        let risk = 0;
        
        if (environment.playerDistance < 3) risk += 0.4;
        if (environment.dangers.length > 0) risk += environment.dangers.length * 0.2;
        if (this.snake.segments.length < environment.playerPosition?.length) risk += 0.3;
        
        return Math.min(risk, 1);
    }

    predictPlayerMovement(currentPos) {
        if (!this.memory.lastPlayerPosition) return null;
        
        const movement = {
            x: currentPos.x - this.memory.lastPlayerPosition.x,
            y: currentPos.y - this.memory.lastPlayerPosition.y
        };
        
        return {
            x: currentPos.x + movement.x,
            y: currentPos.y + movement.y
        };
    }
}