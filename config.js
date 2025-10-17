/**
 * CONFIG.JS
 * Configuration globale de l'application et initialisation de Supabase
 * 
 * Ce fichier contient :
 * - Les credentials Supabase
 * - L'initialisation du client Supabase
 * - Les constantes globales de l'application
 */

// ==================== CONFIGURATION SUPABASE ====================
/**
 * URL de votre projet Supabase
 * @constant {string}
 */
const SUPABASE_URL = 'https://kvqmeucnkgivipxdvelm.supabase.co';

/**
 * Clé publique (anon) de votre projet Supabase
 * Cette clé est sécurisée pour être utilisée côté client
 * @constant {string}
 */
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2cW1ldWNua2dpdmlweGR2ZWxtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxODQwOTIsImV4cCI6MjA3NTc2MDA5Mn0.PvDYzgDEQdlAyVTcKlZpHdb4Z-CJl_PDs53KVNxqbqk';

/**
 * Client Supabase initialisé
 * Utilisé pour toutes les interactions avec la base de données et l'authentification
 * @constant {SupabaseClient}
 */
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ==================== CONSTANTES DE L'APPLICATION ====================
/**
 * Configuration des créneaux horaires pour le calendrier
 * @constant {Array<Object>}
 */
const TIME_SLOTS = [
    { start: '08:00', end: '09:00', label: '8h - 9h' },
    { start: '09:00', end: '10:00', label: '9h - 10h' },
    { start: '10:00', end: '11:00', label: '10h - 11h' },
    { start: '11:00', end: '12:00', label: '11h - 12h' },
    { start: '12:00', end: '13:30', label: 'Pause repas', isBreak: true },
    { start: '13:30', end: '14:30', label: '13h30 - 14h30' },
    { start: '14:30', end: '15:30', label: '14h30 - 15h30' },
    { start: '15:30', end: '16:30', label: '15h30 - 16h30' },
    { start: '16:30', end: '17:30', label: '16h30 - 17h30' },
    { start: '17:30', end: '18:30', label: '17h30 - 18h30' },
    { start: '18:30', end: '19:30', label: '18h30 - 19h30' }
];

/**
 * Matières disponibles pour les cours
 * @constant {Array<string>}
 */
const SUBJECTS = [
    'Technologie',
    'PPPE L1',
    'PPPE L2',
    'PPPE L3',
    'Autre'
];

/**
 * Types de groupes disponibles
 * @constant {Array<string>}
 */
const GROUP_TYPES = [
    'AP1',
    'AP2',
    'Classe entière'
];

/**
 * Durée d'affichage des messages (en millisecondes)
 * @constant {number}
 */
const ALERT_DURATION = 5000;

/**
 * Messages d'erreur par défaut
 * @constant {Object}
 */
const ERROR_MESSAGES = {
    AUTH_FAILED: 'Erreur d\'authentification',
    INVALID_CREDENTIALS: 'Email ou mot de passe incorrect',
    INVALID_2FA_CODE: 'Code de vérification incorrect',
    NETWORK_ERROR: 'Erreur de connexion au serveur',
    GENERIC_ERROR: 'Une erreur est survenue',
    SESSION_EXPIRED: 'Votre session a expiré',
    REQUIRED_FIELDS: 'Veuillez remplir tous les champs requis'
};

/**
 * Messages de succès
 * @constant {Object}
 */
const SUCCESS_MESSAGES = {
    LOGIN_SUCCESS: 'Connexion réussie !',
    LOGOUT_SUCCESS: 'Déconnexion réussie',
    '2FA_ENABLED': '2FA activé avec succès !',
    DATA_SAVED: 'Données enregistrées'
};

// ==================== EXPORTS ====================
// Les variables sont déjà dans le scope global
// Pas besoin d'exports en JavaScript vanilla

console.log('✓ Configuration chargée');