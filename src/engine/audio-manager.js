/**
 * Gestionnaire audio avec génération procédurale via Web Audio API
 * Évite les fichiers audio protégés par copyright
 */

export class AudioManager {
    constructor() {
        // Contexte Web Audio
        this.audioContext = null;
        this.masterGain = null;
        
        // État du son
        this.enabled = true;
        this.musicEnabled = true;
        this.sfxEnabled = true;
        this.masterVolume = 0.7;
        this.musicVolume = 0.4;
        this.sfxVolume = 0.6;
        
        // Cache des sons générés
        this.soundCache = new Map();
        this.musicLoop = null;
        
        // Générateurs de sons
        this.oscillatorNodes = [];
        this.activeVoices = new Set();
        
        this.initializeAudio();
    }

    /**
     * Initialise le contexte Web Audio
     */
    async initializeAudio() {
        try {
            // Création du contexte avec gestion des politiques navigateur
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Création du gain master
            this.masterGain = this.audioContext.createGain();
            this.masterGain.gain.value = this.masterVolume;
            this.masterGain.connect(this.audioContext.destination);
            
            // Gestion de la suspension automatique
            if (this.audioContext.state === 'suspended') {
                await this.resumeAudio();
            }
            
            // Génération des sons de base
            this.generateBaseSounds();
            
            console.log('Audio Manager initialisé');
            
        } catch (error) {
            console.warn('Erreur initialisation audio:', error);
            this.enabled = false;
        }
    }

    /**
     * Reprend le contexte audio (nécessaire après interaction utilisateur)
     */
    async resumeAudio() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            try {
                await this.audioContext.resume();
                console.log('Contexte audio repris');
            } catch (error) {
                console.warn('Erreur reprise audio:', error);
            }
        }
    }

    /**
     * Génère les sons de base du jeu
     */
    generateBaseSounds() {
        if (!this.enabled) return;
        
        // Sons d'interface
        this.createSound('menuSelect', this.generateMenuSelectSound());
        this.createSound('menuConfirm', this.generateMenuConfirmSound());
        this.createSound('menuBack', this.generateMenuBackSound());
        
        // Sons de jeu
        this.createSound('collect', this.generateCollectSound());
        this.createSound('boost', this.generateBoostSound());
        this.createSound('playerHit', this.generatePlayerHitSound());
        this.createSound('enemyDestroyed', this.generateEnemyDestroyedSound());
        this.createSound('constellationComplete', this.generateConstellationCompleteSound());
        this.createSound('levelClear', this.generateLevelClearSound());
        this.createSound('gameOver', this.generateGameOverSound());
        
        // Sons d'ambiance
        this.createSound('gravityWell', this.generateGravityWellSound());
        this.createSound('teleport', this.generateTeleportSound());
        
        console.log(`${this.soundCache.size} sons générés`);
    }

    /**
     * Crée et cache un son
     */
    createSound(name, generator) {
        this.soundCache.set(name, generator);
    }

    /**
     * Joue un son
     */
    playSound(name, options = {}) {
        if (!this.enabled || !this.sfxEnabled) return;
        
        const generator = this.soundCache.get(name);
        if (!generator) {
            console.warn(`Son inconnu: ${name}`);
            return;
        }
        
        // Reprise du contexte si nécessaire
        if (this.audioContext.state === 'suspended') {
            this.resumeAudio();
        }
        
        // Génération et lecture du son
        try {
            const audioBuffer = generator.call(this, options);
            this.playBuffer(audioBuffer, options);
        } catch (error) {
            console.warn(`Erreur lecture son ${name}:`, error);
        }
    }

    /**
     * Lecture d'un buffer audio
     */
    playBuffer(audioBuffer, options = {}) {
        const source = this.audioContext.createBufferSource();
        const gainNode = this.audioContext.createGain();
        
        source.buffer = audioBuffer;
        source.connect(gainNode);
        gainNode.connect(this.masterGain);
        
        // Configuration du volume
        const volume = (options.volume || 1) * this.sfxVolume;
        gainNode.gain.value = volume;
        
        // Configuration de la hauteur
        if (options.pitch) {
            source.playbackRate.value = options.pitch;
        }
        
        // Configuration du panoramique
        if (options.pan && this.audioContext.createStereoPanner) {
            const panNode = this.audioContext.createStereoPanner();
            panNode.pan.value = Math.max(-1, Math.min(1, options.pan));
            gainNode.connect(panNode);
            panNode.connect(this.masterGain);
        }
        
        // Démarrage
        source.start();
        
        // Nettoyage automatique
        source.onended = () => {
            this.activeVoices.delete(source);
        };
        
        this.activeVoices.add(source);
    }

    /**
     * Générateurs de sons spécifiques
     */
    
    generateMenuSelectSound() {
        return () => {
            const buffer = this.audioContext.createBuffer(1, 4410, this.audioContext.sampleRate);
            const data = buffer.getChannelData(0);
            
            for (let i = 0; i < data.length; i++) {
                const t = i / this.audioContext.sampleRate;
                const freq = 800 + Math.sin(t * 20) * 200;
                data[i] = Math.sin(t * freq * 2 * Math.PI) * 0.3 * Math.exp(-t * 8);
            }
            
            return buffer;
        };
    }
    
    generateMenuConfirmSound() {
        return () => {
            const buffer = this.audioContext.createBuffer(1, 8820, this.audioContext.sampleRate);
            const data = buffer.getChannelData(0);
            
            for (let i = 0; i < data.length; i++) {
                const t = i / this.audioContext.sampleRate;
                const freq1 = 600 + Math.sin(t * 10) * 100;
                const freq2 = 900 + Math.sin(t * 15) * 150;
                data[i] = (Math.sin(t * freq1 * 2 * Math.PI) + Math.sin(t * freq2 * 2 * Math.PI)) * 0.2 * Math.exp(-t * 4);
            }
            
            return buffer;
        };
    }
    
    generateMenuBackSound() {
        return () => {
            const buffer = this.audioContext.createBuffer(1, 6615, this.audioContext.sampleRate);
            const data = buffer.getChannelData(0);
            
            for (let i = 0; i < data.length; i++) {
                const t = i / this.audioContext.sampleRate;
                const freq = 400 - t * 200;
                data[i] = Math.sin(t * freq * 2 * Math.PI) * 0.25 * Math.exp(-t * 3);
            }
            
            return buffer;
        };
    }
    
    generateCollectSound() {
        return () => {
            const buffer = this.audioContext.createBuffer(1, 4410, this.audioContext.sampleRate);
            const data = buffer.getChannelData(0);
            
            for (let i = 0; i < data.length; i++) {
                const t = i / this.audioContext.sampleRate;
                const freq = 1000 + t * 500;
                const envelope = Math.exp(-t * 5);
                data[i] = Math.sin(t * freq * 2 * Math.PI) * 0.4 * envelope;
            }
            
            return buffer;
        };
    }
    
    generateBoostSound() {
        return () => {
            const buffer = this.audioContext.createBuffer(1, 13230, this.audioContext.sampleRate);
            const data = buffer.getChannelData(0);
            
            for (let i = 0; i < data.length; i++) {
                const t = i / this.audioContext.sampleRate;
                const freq = 200 + t * 800;
                const noise = (Math.random() - 0.5) * 0.1;
                const tone = Math.sin(t * freq * 2 * Math.PI);
                const envelope = Math.max(0, 1 - t * 3);
                data[i] = (tone * 0.8 + noise * 0.2) * 0.5 * envelope;
            }
            
            return buffer;
        };
    }
    
    generatePlayerHitSound() {
        return () => {
            const buffer = this.audioContext.createBuffer(1, 8820, this.audioContext.sampleRate);
            const data = buffer.getChannelData(0);
            
            for (let i = 0; i < data.length; i++) {
                const t = i / this.audioContext.sampleRate;
                const noise = (Math.random() - 0.5) * 2;
                const tone = Math.sin(t * 150 * 2 * Math.PI);
                const envelope = Math.exp(-t * 2);
                data[i] = (noise * 0.7 + tone * 0.3) * 0.6 * envelope;
            }
            
            return buffer;
        };
    }
    
    generateEnemyDestroyedSound() {
        return () => {
            const buffer = this.audioContext.createBuffer(1, 11025, this.audioContext.sampleRate);
            const data = buffer.getChannelData(0);
            
            for (let i = 0; i < data.length; i++) {
                const t = i / this.audioContext.sampleRate;
                const freq = 800 - t * 600;
                const mod = 1 + Math.sin(t * 30) * 0.3;
                const envelope = Math.exp(-t * 3);
                data[i] = Math.sin(t * freq * mod * 2 * Math.PI) * 0.4 * envelope;
            }
            
            return buffer;
        };
    }
    
    generateConstellationCompleteSound() {
        return () => {
            const buffer = this.audioContext.createBuffer(1, 22050, this.audioContext.sampleRate);
            const data = buffer.getChannelData(0);
            
            const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
            
            for (let i = 0; i < data.length; i++) {
                const t = i / this.audioContext.sampleRate;
                const noteIndex = Math.floor(t * 4);
                const freq = notes[Math.min(noteIndex, notes.length - 1)];
                const envelope = Math.max(0, 1 - (t % 0.25) * 4) * Math.exp(-t * 0.5);
                data[i] = Math.sin(t * freq * 2 * Math.PI) * 0.3 * envelope;
            }
            
            return buffer;
        };
    }
    
    generateLevelClearSound() {
        return () => {
            const buffer = this.audioContext.createBuffer(1, 17640, this.audioContext.sampleRate);
            const data = buffer.getChannelData(0);
            
            for (let i = 0; i < data.length; i++) {
                const t = i / this.audioContext.sampleRate;
                const freq1 = 440 + Math.sin(t * 5) * 50;
                const freq2 = 880 + Math.sin(t * 7) * 70;
                const envelope = Math.exp(-t * 2);
                data[i] = (Math.sin(t * freq1 * 2 * Math.PI) + Math.sin(t * freq2 * 2 * Math.PI)) * 0.2 * envelope;
            }
            
            return buffer;
        };
    }
    
    generateGameOverSound() {
        return () => {
            const buffer = this.audioContext.createBuffer(1, 33075, this.audioContext.sampleRate);
            const data = buffer.getChannelData(0);
            
            for (let i = 0; i < data.length; i++) {
                const t = i / this.audioContext.sampleRate;
                const freq = 200 + Math.sin(t * 2) * 50 - t * 100;
                const envelope = Math.exp(-t * 0.8);
                data[i] = Math.sin(t * Math.max(50, freq) * 2 * Math.PI) * 0.4 * envelope;
            }
            
            return buffer;
        };
    }
    
    generateGravityWellSound() {
        return () => {
            const buffer = this.audioContext.createBuffer(1, 22050, this.audioContext.sampleRate);
            const data = buffer.getChannelData(0);
            
            for (let i = 0; i < data.length; i++) {
                const t = i / this.audioContext.sampleRate;
                const freq = 100 + Math.sin(t * 3) * 20;
                const mod = Math.sin(t * 8) * 0.5 + 1;
                const envelope = Math.sin(t * Math.PI); // Fade in/out
                data[i] = Math.sin(t * freq * mod * 2 * Math.PI) * 0.2 * envelope;
            }
            
            return buffer;
        };
    }
    
    generateTeleportSound() {
        return () => {
            const buffer = this.audioContext.createBuffer(1, 8820, this.audioContext.sampleRate);
            const data = buffer.getChannelData(0);
            
            for (let i = 0; i < data.length; i++) {
                const t = i / this.audioContext.sampleRate;
                const freq = 1000 + Math.sin(t * 50) * 500;
                const noise = (Math.random() - 0.5) * 0.3;
                const envelope = Math.exp(-t * 5);
                data[i] = (Math.sin(t * freq * 2 * Math.PI) * 0.7 + noise * 0.3) * 0.4 * envelope;
            }
            
            return buffer;
        };
    }

    /**
     * Génère et joue une musique d'ambiance en boucle
     */
    startAmbientMusic() {
        if (!this.enabled || !this.musicEnabled || this.musicLoop) return;
        
        this.musicLoop = this.generateAmbientLoop();
        this.playAmbientLoop();
    }
    
    generateAmbientLoop() {
        // Boucle ambient space/synthwave
        const duration = 4; // 4 secondes de boucle
        const sampleRate = this.audioContext.sampleRate;
        const buffer = this.audioContext.createBuffer(1, duration * sampleRate, sampleRate);
        const data = buffer.getChannelData(0);
        
        // Accords de base en Dm
        const chord1 = [293.66, 349.23, 440.00]; // D, F, A
        const chord2 = [261.63, 329.63, 392.00]; // C, E, G
        const chord3 = [246.94, 293.66, 369.99]; // B♭, D, F#
        
        for (let i = 0; i < data.length; i++) {
            const t = i / sampleRate;
            const progress = (t / duration) % 1;
            
            let chord;
            if (progress < 0.5) chord = chord1;
            else if (progress < 0.75) chord = chord2;
            else chord = chord3;
            
            let sample = 0;
            chord.forEach((freq, index) => {
                const envelope = Math.sin(progress * Math.PI) * 0.1; // Fade in/out
                const vibrato = 1 + Math.sin(t * 5) * 0.02; // Subtle vibrato
                sample += Math.sin(t * freq * vibrato * 2 * Math.PI) * envelope / chord.length;
            });
            
            // Ajout d'harmoniques
            const fundamental = 110; // A2
            sample += Math.sin(t * fundamental * 2 * Math.PI) * 0.05;
            sample += Math.sin(t * fundamental * 3 * 2 * Math.PI) * 0.02;
            
            data[i] = sample * this.musicVolume;
        }
        
        return buffer;
    }
    
    playAmbientLoop() {
        if (!this.musicLoop || !this.enabled || !this.musicEnabled) return;
        
        const source = this.audioContext.createBufferSource();
        source.buffer = this.musicLoop;
        source.loop = true;
        source.loopStart = 0;
        source.loopEnd = this.musicLoop.duration;
        
        const gainNode = this.audioContext.createGain();
        gainNode.gain.value = this.musicVolume;
        
        source.connect(gainNode);
        gainNode.connect(this.masterGain);
        
        source.start();
        
        this.currentMusicSource = source;
    }
    
    stopAmbientMusic() {
        if (this.currentMusicSource) {
            this.currentMusicSource.stop();
            this.currentMusicSource = null;
        }
    }

    /**
     * Contrôles de volume
     */
    setMasterVolume(volume) {
        this.masterVolume = Math.max(0, Math.min(1, volume));
        if (this.masterGain) {
            this.masterGain.gain.value = this.masterVolume;
        }
    }
    
    setSfxVolume(volume) {
        this.sfxVolume = Math.max(0, Math.min(1, volume));
    }
    
    setMusicVolume(volume) {
        this.musicVolume = Math.max(0, Math.min(1, volume));
        if (this.currentMusicSource && this.currentMusicSource.gainNode) {
            this.currentMusicSource.gainNode.gain.value = this.musicVolume;
        }
    }

    /**
     * Activation/désactivation
     */
    enableSound(enabled = true) {
        this.enabled = enabled;
        if (!enabled) {
            this.stopAllSounds();
        }
    }
    
    enableMusic(enabled = true) {
        this.musicEnabled = enabled;
        if (enabled) {
            this.startAmbientMusic();
        } else {
            this.stopAmbientMusic();
        }
    }
    
    enableSfx(enabled = true) {
        this.sfxEnabled = enabled;
    }

    /**
     * Arrête tous les sons
     */
    stopAllSounds() {
        this.activeVoices.forEach(voice => {
            try {
                voice.stop();
            } catch (e) {
                // Ignorer les erreurs de stop sur des sources déjà arrêtées
            }
        });
        this.activeVoices.clear();
        
        this.stopAmbientMusic();
    }

    /**
     * Génère un son procédural personnalisé
     */
    generateCustomSound(params) {
        const {
            duration = 0.5,
            frequency = 440,
            type = 'sine', // 'sine', 'square', 'sawtooth', 'triangle', 'noise'
            envelope = [0.1, 0.3, 0.2, 0.4], // ADSR
            modulation = null
        } = params;
        
        const sampleRate = this.audioContext.sampleRate;
        const buffer = this.audioContext.createBuffer(1, duration * sampleRate, sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < data.length; i++) {
            const t = i / sampleRate;
            const progress = t / duration;
            
            // Calcul de l'enveloppe ADSR
            let envValue = 1;
            const [attack, decay, sustain, release] = envelope;
            
            if (progress < attack) {
                envValue = progress / attack;
            } else if (progress < attack + decay) {
                envValue = 1 - ((progress - attack) / decay) * (1 - sustain);
            } else if (progress < 1 - release) {
                envValue = sustain;
            } else {
                envValue = sustain * (1 - progress) / release;
            }
            
            // Génération de la forme d'onde
            let sample = 0;
            let freq = frequency;
            
            // Modulation optionnelle
            if (modulation) {
                freq *= 1 + Math.sin(t * modulation.rate * 2 * Math.PI) * modulation.depth;
            }
            
            switch (type) {
                case 'sine':
                    sample = Math.sin(t * freq * 2 * Math.PI);
                    break;
                case 'square':
                    sample = Math.sign(Math.sin(t * freq * 2 * Math.PI));
                    break;
                case 'sawtooth':
                    sample = 2 * (t * freq % 1) - 1;
                    break;
                case 'triangle':
                    sample = 2 * Math.abs(2 * (t * freq % 1) - 1) - 1;
                    break;
                case 'noise':
                    sample = (Math.random() - 0.5) * 2;
                    break;
            }
            
            data[i] = sample * envValue * 0.3;
        }
        
        return buffer;
    }

    /**
     * Joue un son personnalisé
     */
    playCustomSound(params) {
        if (!this.enabled || !this.sfxEnabled) return;
        
        const buffer = this.generateCustomSound(params);
        this.playBuffer(buffer);
    }

    /**
     * Informations sur l'état audio
     */
    getAudioInfo() {
        return {
            enabled: this.enabled,
            musicEnabled: this.musicEnabled,
            sfxEnabled: this.sfxEnabled,
            masterVolume: this.masterVolume,
            musicVolume: this.musicVolume,
            sfxVolume: this.sfxVolume,
            contextState: this.audioContext ? this.audioContext.state : 'unavailable',
            activeSounds: this.activeVoices.size,
            cachedSounds: this.soundCache.size
        };
    }
}