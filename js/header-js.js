/**
 * HEADER-JS.JS
 * Gestion du header de l'application
 * 
 * Ce fichier contient :
 * - Chargement dynamique du header
 * - Gestion de la déconnexion
 */

// ==================== CHARGEMENT DU HEADER ====================
/**
 * Charge le header depuis le fichier composant
 * Insère le HTML au début du body
 */
async function loadHeader() {
    try {
        const response = await fetch('components/header-html.html');
        
        if (!response.ok) {
            throw new Error('Erreur lors du chargement du header');
        }
        
        const headerHTML = await response.text();
        
        // Insérer le header au début du body
        document.body.insertAdjacentHTML('afterbegin', headerHTML);
        
        // Initialiser les événements après insertion
        initHeaderEvents();
        
        console.log('✓ Header chargé');
    } catch (error) {
        console.error('Erreur chargement header:', error);
    }
}

// ==================== GESTION DES ÉVÉNEMENTS ====================
/**
 * Initialise les événements du header
 * Notamment le bouton de déconnexion et la navigation active
 */
function initHeaderEvents() {
    const disconnectBtn = document.getElementById('disconnectBtn');
    
    if (disconnectBtn) {
        disconnectBtn.addEventListener('click', handleDisconnect);
    }
    
    // Marquer le lien actif selon la page courante
    highlightActiveNav();
}

/**
 * Met en surbrillance le lien de navigation actif
 */
function highlightActiveNav() {
    const currentPage = window.location.pathname.split('/').pop();
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        const linkPage = link.getAttribute('href');
        if (linkPage === currentPage) {
            link.classList.add('active');
        }
    });
}

/**
 * Gère la déconnexion de l'utilisateur
 * Supprime la session Supabase et redirige vers la page de login
 */
async function handleDisconnect() {
    try {
        // Déconnexion Supabase
        const { error } = await supabase.auth.signOut();
        
        if (error) throw error;
        
        // Redirection vers la page de connexion
        window.location.href = 'login-html.html';
        
    } catch (error) {
        console.error('Erreur lors de la déconnexion:', error);
        alert('Erreur lors de la déconnexion');
    }
}

// ==================== INITIALISATION ====================
/**
 * Charge le header au chargement du DOM
 */
document.addEventListener('DOMContentLoaded', function() {
    loadHeader();
});