/**
 * Système de hachage spatial pour optimisation des collisions
 * Divise l'espace en cellules pour accélérer les requêtes de proximité
 */

export class SpatialHash {
    constructor(cellSize = 20) {
        this.cellSize = cellSize;
        this.cells = new Map();
        this.objects = new Map(); // Mapping objet -> cellules
        
        // Statistiques de performance
        this.stats = {
            totalObjects: 0,
            totalCells: 0,
            queriesThisFrame: 0,
            collisionChecksAvoided: 0
        };
    }

    /**
     * Calcule la clé de cellule pour une position
     */
    getCellKey(x, y) {
        const cellX = Math.floor(x / this.cellSize);
        const cellY = Math.floor(y / this.cellSize);
        return `${cellX},${cellY}`;
    }

    /**
     * Calcule toutes les cellules qu'un objet occupe
     */
    getObjectCells(object, x, y, width = 1, height = 1) {
        const cells = [];
        
        const startCellX = Math.floor(x / this.cellSize);
        const endCellX = Math.floor((x + width - 1) / this.cellSize);
        const startCellY = Math.floor(y / this.cellSize);
        const endCellY = Math.floor((y + height - 1) / this.cellSize);
        
        for (let cellX = startCellX; cellX <= endCellX; cellX++) {
            for (let cellY = startCellY; cellY <= endCellY; cellY++) {
                cells.push(`${cellX},${cellY}`);
            }
        }
        
        return cells;
    }

    /**
     * Ajoute un objet au hash spatial
     */
    add(object, x, y, width = 1, height = 1) {
        // Suppression de l'objet existant s'il y en a un
        this.remove(object);
        
        const cellKeys = this.getObjectCells(object, x, y, width, height);
        
        // Ajout dans chaque cellule
        cellKeys.forEach(key => {
            if (!this.cells.has(key)) {
                this.cells.set(key, new Set());
            }
            this.cells.get(key).add(object);
        });
        
        // Mémorisation des cellules pour cet objet
        this.objects.set(object, {
            cellKeys,
            x, y, width, height,
            lastUpdate: Date.now()
        });
        
        this.stats.totalObjects = this.objects.size;
        this.stats.totalCells = this.cells.size;
    }

    /**
     * Supprime un objet du hash spatial
     */
    remove(object) {
        const objectData = this.objects.get(object);
        if (!objectData) return false;
        
        // Suppression de toutes les cellules
        objectData.cellKeys.forEach(key => {
            const cellSet = this.cells.get(key);
            if (cellSet) {
                cellSet.delete(object);
                
                // Suppression de la cellule si elle est vide
                if (cellSet.size === 0) {
                    this.cells.delete(key);
                }
            }
        });
        
        this.objects.delete(object);
        this.stats.totalObjects = this.objects.size;
        this.stats.totalCells = this.cells.size;
        
        return true;
    }

    /**
     * Met à jour la position d'un objet
     */
    update(object, newX, newY, newWidth, newHeight) {
        const objectData = this.objects.get(object);
        if (!objectData) {
            // Si l'objet n'existe pas, l'ajouter
            this.add(object, newX, newY, newWidth, newHeight);
            return;
        }
        
        // Vérification si l'objet a vraiment bougé
        if (objectData.x === newX && objectData.y === newY && 
            objectData.width === newWidth && objectData.height === newHeight) {
            return;
        }
        
        const newCellKeys = this.getObjectCells(object, newX, newY, newWidth, newHeight);
        const oldCellKeys = objectData.cellKeys;
        
        // Optimisation : vérifier si les cellules ont changé
        const cellsChanged = !this.arraysEqual(oldCellKeys, newCellKeys);
        
        if (cellsChanged) {
            // Suppression des anciennes cellules
            oldCellKeys.forEach(key => {
                const cellSet = this.cells.get(key);
                if (cellSet) {
                    cellSet.delete(object);
                    if (cellSet.size === 0) {
                        this.cells.delete(key);
                    }
                }
            });
            
            // Ajout aux nouvelles cellules
            newCellKeys.forEach(key => {
                if (!this.cells.has(key)) {
                    this.cells.set(key, new Set());
                }
                this.cells.get(key).add(object);
            });
            
            // Mise à jour des données de l'objet
            this.objects.set(object, {
                cellKeys: newCellKeys,
                x: newX, y: newY,
                width: newWidth, height: newHeight,
                lastUpdate: Date.now()
            });
        } else {
            // Mise à jour des coordonnées seulement
            objectData.x = newX;
            objectData.y = newY;
            objectData.width = newWidth;
            objectData.height = newHeight;
            objectData.lastUpdate = Date.now();
        }
    }

    /**
     * Trouve tous les objets proches d'une position
     */
    queryPoint(x, y, radius = 0) {
        this.stats.queriesThisFrame++;
        
        const results = new Set();
        
        if (radius === 0) {
            // Requête ponctuelle
            const key = this.getCellKey(x, y);
            const cell = this.cells.get(key);
            if (cell) {
                cell.forEach(obj => results.add(obj));
            }
        } else {
            // Requête avec rayon
            const cellKeys = this.getObjectCells({}, x - radius, y - radius, 
                                              radius * 2, radius * 2);
            
            cellKeys.forEach(key => {
                const cell = this.cells.get(key);
                if (cell) {
                    cell.forEach(obj => {
                        const objData = this.objects.get(obj);
                        if (objData) {
                            const distance = this.calculateDistance(
                                x, y, objData.x, objData.y
                            );
                            if (distance <= radius) {
                                results.add(obj);
                            }
                        }
                    });
                }
            });
        }
        
        return Array.from(results);
    }

    /**
     * Trouve tous les objets dans une zone rectangulaire
     */
    queryRect(x, y, width, height) {
        this.stats.queriesThisFrame++;
        
        const results = new Set();
        const cellKeys = this.getObjectCells({}, x, y, width, height);
        
        cellKeys.forEach(key => {
            const cell = this.cells.get(key);
            if (cell) {
                cell.forEach(obj => {
                    const objData = this.objects.get(obj);
                    if (objData && this.rectsOverlap(
                        x, y, width, height,
                        objData.x, objData.y, objData.width, objData.height
                    )) {
                        results.add(obj);
                    }
                });
            }
        });
        
        return Array.from(results);
    }

    /**
     * Trouve les objets en collision avec un autre objet
     */
    queryCollisions(object) {
        const objectData = this.objects.get(object);
        if (!objectData) return [];
        
        this.stats.queriesThisFrame++;
        
        const results = new Set();
        
        objectData.cellKeys.forEach(key => {
            const cell = this.cells.get(key);
            if (cell) {
                cell.forEach(other => {
                    if (other !== object) {
                        const otherData = this.objects.get(other);
                        if (otherData && this.rectsOverlap(
                            objectData.x, objectData.y, objectData.width, objectData.height,
                            otherData.x, otherData.y, otherData.width, otherData.height
                        )) {
                            results.add(other);
                        }
                    }
                });
            }
        });
        
        return Array.from(results);
    }

    /**
     * Trouve les N objets les plus proches
     */
    queryNearest(x, y, count = 1, maxDistance = Infinity, filter = null) {
        this.stats.queriesThisFrame++;
        
        const candidates = [];
        
        // Commencer par chercher dans un rayon croissant
        let searchRadius = this.cellSize;
        
        while (candidates.length < count && searchRadius <= maxDistance) {
            const objectsInRange = this.queryPoint(x, y, searchRadius);
            
            objectsInRange.forEach(obj => {
                if (filter && !filter(obj)) return;
                
                const objData = this.objects.get(obj);
                if (objData) {
                    const distance = this.calculateDistance(x, y, objData.x, objData.y);
                    if (distance <= maxDistance) {
                        candidates.push({ object: obj, distance });
                    }
                }
            });
            
            searchRadius *= 2;
        }
        
        // Tri par distance et limitation du nombre
        candidates.sort((a, b) => a.distance - b.distance);
        return candidates.slice(0, count).map(c => c.object);
    }

    /**
     * Raycast simple pour trouver le premier objet intersecté
     */
    raycast(startX, startY, dirX, dirY, maxDistance = 100, filter = null) {
        this.stats.queriesThisFrame++;
        
        const stepSize = this.cellSize / 2;
        const steps = Math.ceil(maxDistance / stepSize);
        
        for (let i = 1; i <= steps; i++) {
            const x = startX + dirX * i * stepSize;
            const y = startY + dirY * i * stepSize;
            
            const objects = this.queryPoint(x, y);
            
            for (const obj of objects) {
                if (filter && !filter(obj)) continue;
                
                const objData = this.objects.get(obj);
                if (objData && this.pointInRect(x, y, objData.x, objData.y, 
                                                objData.width, objData.height)) {
                    return {
                        object: obj,
                        point: { x, y },
                        distance: i * stepSize
                    };
                }
            }
        }
        
        return null;
    }

    /**
     * Vide le hash spatial
     */
    clear() {
        this.cells.clear();
        this.objects.clear();
        this.resetStats();
    }

    /**
     * Réinitialise les statistiques de frame
     */
    resetFrameStats() {
        this.stats.queriesThisFrame = 0;
        this.stats.collisionChecksAvoided = 0;
    }

    /**
     * Réinitialise toutes les statistiques
     */
    resetStats() {
        this.stats = {
            totalObjects: 0,
            totalCells: 0,
            queriesThisFrame: 0,
            collisionChecksAvoided: 0
        };
    }

    /**
     * Optimisation : supprime les cellules vides et les objets obsolètes
     */
    optimize() {
        const now = Date.now();
        const timeout = 5000; // 5 secondes
        
        // Suppression des objets obsolètes
        const toRemove = [];
        this.objects.forEach((data, object) => {
            if (now - data.lastUpdate > timeout) {
                toRemove.push(object);
            }
        });
        
        toRemove.forEach(object => this.remove(object));
        
        // Nettoyage des cellules vides
        const emptyCells = [];
        this.cells.forEach((cellSet, key) => {
            if (cellSet.size === 0) {
                emptyCells.push(key);
            }
        });
        
        emptyCells.forEach(key => this.cells.delete(key));
        
        this.stats.totalCells = this.cells.size;
        
        if (toRemove.length > 0 || emptyCells.length > 0) {
            console.log(`Hash spatial optimisé: ${toRemove.length} objets et ${emptyCells.length} cellules supprimés`);
        }
    }

    /**
     * Utilitaires de calcul
     */
    
    calculateDistance(x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    rectsOverlap(x1, y1, w1, h1, x2, y2, w2, h2) {
        return !(x1 >= x2 + w2 || x2 >= x1 + w1 || 
                y1 >= y2 + h2 || y2 >= y1 + h1);
    }
    
    pointInRect(px, py, rx, ry, rw, rh) {
        return px >= rx && px < rx + rw && py >= ry && py < ry + rh;
    }
    
    arraysEqual(arr1, arr2) {
        if (arr1.length !== arr2.length) return false;
        
        const sorted1 = [...arr1].sort();
        const sorted2 = [...arr2].sort();
        
        return sorted1.every((val, i) => val === sorted2[i]);
    }

    /**
     * Debug : affiche des informations sur le hash spatial
     */
    getDebugInfo() {
        const cellDistribution = {};
        let maxObjectsPerCell = 0;
        let totalObjectReferences = 0;
        
        this.cells.forEach((cellSet, key) => {
            const objectCount = cellSet.size;
            totalObjectReferences += objectCount;
            maxObjectsPerCell = Math.max(maxObjectsPerCell, objectCount);
            
            if (!cellDistribution[objectCount]) {
                cellDistribution[objectCount] = 0;
            }
            cellDistribution[objectCount]++;
        });
        
        return {
            ...this.stats,
            cellSize: this.cellSize,
            maxObjectsPerCell,
            totalObjectReferences,
            averageObjectsPerCell: this.cells.size > 0 ? 
                totalObjectReferences / this.cells.size : 0,
            cellDistribution,
            memoryUsage: this.estimateMemoryUsage()
        };
    }

    /**
     * Estime l'utilisation mémoire approximative
     */
    estimateMemoryUsage() {
        // Estimation approximative en bytes
        const cellKeySize = 20; // Estimation pour "x,y" string
        const setOverhead = 50; // Estimation pour Set object
        const mapOverhead = 100; // Estimation pour Map entries
        
        const cellsMemory = this.cells.size * (cellKeySize + setOverhead) + mapOverhead;
        const objectsMemory = this.objects.size * (100 + mapOverhead); // Données objet
        
        return {
            estimated: Math.round((cellsMemory + objectsMemory) / 1024), // KB
            cells: Math.round(cellsMemory / 1024),
            objects: Math.round(objectsMemory / 1024)
        };
    }

    /**
     * Rendu de debug visuel (si contexte fourni)
     */
    renderDebug(ctx, offsetX = 0, offsetY = 0, alpha = 0.3) {
        if (!ctx) return;
        
        ctx.save();
        ctx.globalAlpha = alpha;
        
        // Rendu des cellules
        this.cells.forEach((cellSet, key) => {
            const [cellX, cellY] = key.split(',').map(Number);
            const screenX = cellX * this.cellSize + offsetX;
            const screenY = cellY * this.cellSize + offsetY;
            
            // Couleur selon le nombre d'objets dans la cellule
            const objectCount = cellSet.size;
            const intensity = Math.min(objectCount / 10, 1);
            
            ctx.fillStyle = `rgba(0, 255, 0, ${intensity * 0.5})`;
            ctx.fillRect(screenX, screenY, this.cellSize, this.cellSize);
            
            ctx.strokeStyle = 'rgba(0, 255, 0, 0.8)';
            ctx.lineWidth = 1;
            ctx.strokeRect(screenX, screenY, this.cellSize, this.cellSize);
            
            // Affichage du nombre d'objets
            if (objectCount > 0) {
                ctx.fillStyle = 'white';
                ctx.font = '10px monospace';
                ctx.fillText(objectCount.toString(), 
                           screenX + 2, screenY + 12);
            }
        });
        
        ctx.restore();
    }
}