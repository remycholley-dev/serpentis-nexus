/**
 * Tests unitaires basiques pour Serpentis Nexus
 * Système de tests simple sans framework externe
 */

class TestRunner {
    constructor() {
        this.tests = [];
        this.results = {
            passed: 0,
            failed: 0,
            total: 0
        };
    }

    /**
     * Ajoute un test
     */
    test(name, testFunction) {
        this.tests.push({ name, testFunction });
    }

    /**
     * Exécute tous les tests
     */
    async run() {
        console.log('🧪 Démarrage des tests Serpentis Nexus...\n');
        
        for (const test of this.tests) {
            try {
                await test.testFunction();
                this.results.passed++;
                console.log(`✅ ${test.name}`);
            } catch (error) {
                this.results.failed++;
                console.log(`❌ ${test.name}: ${error.message}`);
            }
            this.results.total++;
        }
        
        this.printSummary();
    }

    /**
     * Affiche le résumé des tests
     */
    printSummary() {
        console.log('\n' + '='.repeat(50));
        console.log('📊 RÉSUMÉ DES TESTS');
        console.log('='.repeat(50));
        console.log(`Total: ${this.results.total}`);
        console.log(`✅ Réussis: ${this.results.passed}`);
        console.log(`❌ Échoués: ${this.results.failed}`);
        console.log(`📈 Taux de réussite: ${Math.round((this.results.passed / this.results.total) * 100)}%`);
        
        if (this.results.failed === 0) {
            console.log('\n🎉 Tous les tests sont passés avec succès!');
        } else {
            console.log('\n⚠️  Certains tests ont échoué. Vérifiez le code.');
        }
    }

    /**
     * Assertions simples
     */
    assert(condition, message = 'Assertion failed') {
        if (!condition) {
            throw new Error(message);
        }
    }

    assertEqual(actual, expected, message = `Expected ${expected}, got ${actual}`) {
        if (actual !== expected) {
            throw new Error(message);
        }
    }

    assertNotEqual(actual, unexpected, message = `Expected not to be ${unexpected}`) {
        if (actual === unexpected) {
            throw new Error(message);
        }
    }

    assertThrows(func, message = 'Expected function to throw') {
        let threw = false;
        try {
            func();
        } catch (error) {
            threw = true;
        }
        if (!threw) {
            throw new Error(message);
        }
    }
}

// Importation des modules (simulation pour Node.js)
const mockCanvas = {
    width: 800,
    height: 600,
    getContext: () => ({
        fillStyle: '',
        strokeStyle: '',
        lineWidth: 1,
        fillRect: () => {},
        strokeRect: () => {},
        beginPath: () => {},
        moveTo: () => {},
        lineTo: () => {},
        arc: () => {},
        fill: () => {},
        stroke: () => {},
        save: () => {},
        restore: () => {},
        translate: () => {},
        rotate: () => {},
        createRadialGradient: () => ({
            addColorStop: () => {}
        }),
        createLinearGradient: () => ({
            addColorStop: () => {}
        })
    })
};

const mockAudioManager = {
    enabled: true,
    playSound: () => {},
    stopAllSounds: () => {},
    setMasterVolume: () => {}
};

// Création de l'instance de test
const runner = new TestRunner();

/**
 * TESTS DU SYSTÈME DE HASH SPATIAL
 */

// Mock simple pour SpatialHash
class MockSpatialHash {
    constructor(cellSize = 20) {
        this.cellSize = cellSize;
        this.cells = new Map();
        this.objects = new Map();
    }

    getCellKey(x, y) {
        const cellX = Math.floor(x / this.cellSize);
        const cellY = Math.floor(y / this.cellSize);
        return `${cellX},${cellY}`;
    }

    add(object, x, y) {
        const key = this.getCellKey(x, y);
        if (!this.cells.has(key)) {
            this.cells.set(key, new Set());
        }
        this.cells.get(key).add(object);
        this.objects.set(object, { x, y, cellKey: key });
    }

    remove(object) {
        const objectData = this.objects.get(object);
        if (objectData) {
            const cell = this.cells.get(objectData.cellKey);
            if (cell) {
                cell.delete(object);
                if (cell.size === 0) {
                    this.cells.delete(objectData.cellKey);
                }
            }
            this.objects.delete(object);
        }
    }

    queryPoint(x, y) {
        const key = this.getCellKey(x, y);
        const cell = this.cells.get(key);
        return cell ? Array.from(cell) : [];
    }

    clear() {
        this.cells.clear();
        this.objects.clear();
    }
}

runner.test('SpatialHash - Création et initialisation', () => {
    const hash = new MockSpatialHash(20);
    runner.assertEqual(hash.cellSize, 20, 'La taille de cellule doit être 20');
    runner.assertEqual(hash.cells.size, 0, 'Aucune cellule au départ');
    runner.assertEqual(hash.objects.size, 0, 'Aucun objet au départ');
});

runner.test('SpatialHash - Calcul de clé de cellule', () => {
    const hash = new MockSpatialHash(20);
    runner.assertEqual(hash.getCellKey(0, 0), '0,0', 'Position (0,0) doit donner clé "0,0"');
    runner.assertEqual(hash.getCellKey(25, 35), '1,1', 'Position (25,35) doit donner clé "1,1"');
    runner.assertEqual(hash.getCellKey(-5, -10), '-1,-1', 'Positions négatives doivent fonctionner');
});

runner.test('SpatialHash - Ajout et suppression d\'objets', () => {
    const hash = new MockSpatialHash(20);
    const obj1 = { id: 1 };
    const obj2 = { id: 2 };
    
    hash.add(obj1, 10, 15);
    hash.add(obj2, 25, 30);
    
    runner.assertEqual(hash.objects.size, 2, 'Deux objets doivent être ajoutés');
    runner.assertEqual(hash.cells.size, 2, 'Deux cellules doivent être créées');
    
    hash.remove(obj1);
    runner.assertEqual(hash.objects.size, 1, 'Un objet doit rester après suppression');
});

runner.test('SpatialHash - Requête par point', () => {
    const hash = new MockSpatialHash(20);
    const obj1 = { id: 1 };
    const obj2 = { id: 2 };
    
    hash.add(obj1, 10, 15);
    hash.add(obj2, 25, 30);
    
    const results1 = hash.queryPoint(10, 15);
    runner.assertEqual(results1.length, 1, 'Un objet trouvé à la position (10,15)');
    runner.assertEqual(results1[0].id, 1, 'L\'objet trouvé doit être obj1');
    
    const results2 = hash.queryPoint(100, 100);
    runner.assertEqual(results2.length, 0, 'Aucun objet à une position vide');
});

/**
 * TESTS DU SYSTÈME DE SERPENT
 */

// Mock simple pour Snake
class MockSnake {
    constructor(x, y, type = 'player') {
        this.type = type;
        this.segments = [{ x, y, type: 'head' }];
        this.direction = { x: 1, y: 0 };
        this.alive = true;
        this.speed = 1;
        this.activePowerUps = new Map();
    }

    setDirection(direction) {
        const directions = {
            up: { x: 0, y: -1 },
            down: { x: 0, y: 1 },
            left: { x: -1, y: 0 },
            right: { x: 1, y: 0 }
        };
        
        const newDir = directions[direction];
        if (newDir && !this.isOppositeDirection(newDir)) {
            this.direction = newDir;
        }
    }

    isOppositeDirection(newDir) {
        return (this.direction.x === -newDir.x && this.direction.y === -newDir.y);
    }

    grow(segmentType = 'normal') {
        const tail = this.segments[this.segments.length - 1];
        this.segments.push({
            x: tail.x,
            y: tail.y,
            type: segmentType
        });
    }

    getHead() {
        return this.segments[0];
    }

    move() {
        if (!this.alive) return;
        
        const head = this.getHead();
        const newHead = {
            x: head.x + this.direction.x,
            y: head.y + this.direction.y,
            type: 'head'
        };
        
        this.segments.unshift(newHead);
        this.segments.pop();
    }
}

runner.test('Snake - Création et initialisation', () => {
    const snake = new MockSnake(10, 10);
    runner.assertEqual(snake.segments.length, 1, 'Le serpent doit avoir un segment initial');
    runner.assertEqual(snake.getHead().x, 10, 'Position X de la tête correcte');
    runner.assertEqual(snake.getHead().y, 10, 'Position Y de la tête correcte');
    runner.assertEqual(snake.alive, true, 'Le serpent doit être vivant');
});

runner.test('Snake - Changement de direction', () => {
    const snake = new MockSnake(10, 10);
    
    // Direction initiale: droite
    runner.assertEqual(snake.direction.x, 1, 'Direction initiale X');
    runner.assertEqual(snake.direction.y, 0, 'Direction initiale Y');
    
    // Changement vers le haut
    snake.setDirection('up');
    runner.assertEqual(snake.direction.x, 0, 'Direction haut X');
    runner.assertEqual(snake.direction.y, -1, 'Direction haut Y');
    
    // Tentative de demi-tour (doit être bloquée)
    snake.setDirection('down');
    runner.assertEqual(snake.direction.y, -1, 'Le demi-tour doit être bloqué');
});

runner.test('Snake - Croissance', () => {
    const snake = new MockSnake(10, 10);
    const initialLength = snake.segments.length;
    
    snake.grow();
    runner.assertEqual(snake.segments.length, initialLength + 1, 'Le serpent doit grandir d\'un segment');
    
    snake.grow('armored');
    const armoredSegment = snake.segments.find(s => s.type === 'armored');
    runner.assert(armoredSegment, 'Le segment blindé doit être ajouté');
});

runner.test('Snake - Mouvement', () => {
    const snake = new MockSnake(10, 10);
    const initialX = snake.getHead().x;
    
    snake.move();
    runner.assertEqual(snake.getHead().x, initialX + 1, 'Le serpent doit avancer d\'une case');
});

/**
 * TESTS DU SYSTÈME DE CONSTELLATION
 */

// Mock simple pour ConstellationManager
class MockConstellationManager {
    constructor() {
        this.patterns = {
            triangle: {
                name: 'Triangle',
                stars: ['alpha', 'beta', 'gamma'],
                colors: ['#ff0000', '#00ff00', '#0000ff']
            }
        };
        this.currentPattern = this.patterns.triangle;
        this.collectedStars = new Set();
    }

    collectStar(starType) {
        if (this.currentPattern.stars.includes(starType) && !this.collectedStars.has(starType)) {
            this.collectedStars.add(starType);
            return this.collectedStars.size === this.currentPattern.stars.length;
        }
        return false;
    }

    getProgress() {
        return {
            patternName: this.currentPattern.name,
            collected: this.collectedStars.size,
            total: this.currentPattern.stars.length,
            stars: this.currentPattern.stars.map(starType => ({
                type: starType,
                collected: this.collectedStars.has(starType)
            }))
        };
    }

    reset() {
        this.collectedStars.clear();
    }
}

runner.test('ConstellationManager - Initialisation', () => {
    const cm = new MockConstellationManager();
    runner.assert(cm.currentPattern, 'Un pattern doit être défini');
    runner.assertEqual(cm.collectedStars.size, 0, 'Aucune étoile collectée au départ');
});

runner.test('ConstellationManager - Collecte d\'étoiles', () => {
    const cm = new MockConstellationManager();
    
    const completed1 = cm.collectStar('alpha');
    runner.assertEqual(completed1, false, 'La constellation ne doit pas être complète avec une étoile');
    runner.assertEqual(cm.collectedStars.size, 1, 'Une étoile doit être collectée');
    
    cm.collectStar('beta');
    const completed2 = cm.collectStar('gamma');
    runner.assertEqual(completed2, true, 'La constellation doit être complète');
});

runner.test('ConstellationManager - Étoiles invalides', () => {
    const cm = new MockConstellationManager();
    
    const completed = cm.collectStar('invalid');
    runner.assertEqual(completed, false, 'Les étoiles invalides ne doivent pas être acceptées');
    runner.assertEqual(cm.collectedStars.size, 0, 'Aucune étoile ne doit être ajoutée');
});

runner.test('ConstellationManager - Progression', () => {
    const cm = new MockConstellationManager();
    cm.collectStar('alpha');
    cm.collectStar('beta');
    
    const progress = cm.getProgress();
    runner.assertEqual(progress.collected, 2, 'Deux étoiles collectées');
    runner.assertEqual(progress.total, 3, 'Trois étoiles au total');
    runner.assertEqual(progress.patternName, 'Triangle', 'Nom du pattern correct');
});

/**
 * TESTS UTILITAIRES
 */

runner.test('Utilitaires - Calcul de distance', () => {
    function calculateDistance(x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    const distance1 = calculateDistance(0, 0, 3, 4);
    runner.assertEqual(distance1, 5, 'Distance (0,0) à (3,4) doit être 5');
    
    const distance2 = calculateDistance(0, 0, 0, 0);
    runner.assertEqual(distance2, 0, 'Distance d\'un point à lui-même doit être 0');
});

runner.test('Utilitaires - Détection de collision rectangulaire', () => {
    function rectsOverlap(x1, y1, w1, h1, x2, y2, w2, h2) {
        return !(x1 >= x2 + w2 || x2 >= x1 + w1 || 
                y1 >= y2 + h2 || y2 >= y1 + h1);
    }
    
    // Rectangles qui se chevauchent
    const overlap1 = rectsOverlap(0, 0, 10, 10, 5, 5, 10, 10);
    runner.assertEqual(overlap1, true, 'Rectangles qui se chevauchent');
    
    // Rectangles qui ne se touchent pas
    const overlap2 = rectsOverlap(0, 0, 5, 5, 10, 10, 5, 5);
    runner.assertEqual(overlap2, false, 'Rectangles qui ne se touchent pas');
    
    // Rectangles adjacents
    const overlap3 = rectsOverlap(0, 0, 5, 5, 5, 0, 5, 5);
    runner.assertEqual(overlap3, false, 'Rectangles adjacents ne se chevauchent pas');
});

runner.test('Utilitaires - Génération d\'ID unique', () => {
    function generateId() {
        return 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    const id1 = generateId();
    const id2 = generateId();
    
    runner.assertNotEqual(id1, id2, 'Les IDs générés doivent être uniques');
    runner.assert(id1.startsWith('id_'), 'L\'ID doit commencer par "id_"');
});

/**
 * TESTS D'INTÉGRATION
 */

runner.test('Intégration - Simulation de partie basique', () => {
    // Simulation d'une partie simple
    const snake = new MockSnake(10, 10);
    const constellation = new MockConstellationManager();
    const spatialHash = new MockSpatialHash(20);
    
    // Ajout du serpent au hash spatial
    spatialHash.add(snake, snake.getHead().x, snake.getHead().y);
    
    // Mouvement du serpent
    snake.move();
    
    // Collecte d'une étoile
    const completed = constellation.collectStar('alpha');
    
    runner.assertEqual(snake.getHead().x, 11, 'Le serpent a bougé');
    runner.assertEqual(completed, false, 'La constellation n\'est pas encore complète');
    runner.assertEqual(constellation.collectedStars.size, 1, 'Une étoile a été collectée');
});

runner.test('Intégration - Gestion des collisions', () => {
    function checkCollision(snake, obstacles) {
        const head = snake.getHead();
        return obstacles.some(obstacle => 
            head.x === obstacle.x && head.y === obstacle.y
        );
    }
    
    const snake = new MockSnake(10, 10);
    const obstacles = [
        { x: 11, y: 10 },
        { x: 5, y: 5 }
    ];
    
    // Pas de collision initiale
    const collision1 = checkCollision(snake, obstacles);
    runner.assertEqual(collision1, false, 'Pas de collision initiale');
    
    // Mouvement vers un obstacle
    snake.move(); // Serpent passe à (11, 10)
    const collision2 = checkCollision(snake, obstacles);
    runner.assertEqual(collision2, true, 'Collision détectée après mouvement');
});

/**
 * TESTS DE PERFORMANCE
 */

runner.test('Performance - Hash spatial avec beaucoup d\'objets', () => {
    const hash = new MockSpatialHash(20);
    const objects = [];
    
    // Ajout de 1000 objets
    const startTime = Date.now();
    for (let i = 0; i < 1000; i++) {
        const obj = { id: i };
        objects.push(obj);
        hash.add(obj, Math.random() * 1000, Math.random() * 1000);
    }
    const addTime = Date.now() - startTime;
    
    // Test de requête
    const queryStartTime = Date.now();
    for (let i = 0; i < 100; i++) {
        hash.queryPoint(Math.random() * 1000, Math.random() * 1000);
    }
    const queryTime = Date.now() - queryStartTime;
    
    runner.assert(addTime < 1000, 'L\'ajout de 1000 objets doit prendre moins d\'1 seconde');
    runner.assert(queryTime < 100, '100 requêtes doivent prendre moins de 100ms');
    
    console.log(`   📊 Performance: ${addTime}ms pour ajouter 1000 objets, ${queryTime}ms pour 100 requêtes`);
});

/**
 * EXÉCUTION DES TESTS
 */

// Fonction principale d'exécution
async function runTests() {
    console.log('🎮 Tests unitaires pour Serpentis Nexus');
    console.log('Version: 1.0.0');
    console.log('Date: ' + new Date().toISOString());
    console.log('');
    
    await runner.run();
    
    // Code de sortie pour CI/CD
    if (typeof process !== 'undefined') {
        process.exit(runner.results.failed > 0 ? 1 : 0);
    }
}

// Vérification si le fichier est exécuté directement
if (typeof require !== 'undefined' && require.main === module) {
    runTests().catch(console.error);
}

// Export pour utilisation en module
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { TestRunner, runTests };
}