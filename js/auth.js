/**
 * AUTH.JS
 * Gestion de l'authentification et de l'authentification à deux facteurs (2FA)
 * 
 * Ce fichier contient :
 * - Gestion de la connexion/déconnexion
 * - Configuration du 2FA (TOTP)
 * - Vérification des codes 2FA
 * - Gestion des sessions
 * - Affichage des alertes
 */

// ==================== VARIABLES GLOBALES ====================
let currentUser = null;
let factorId = null;

// ==================== UTILITAIRES ====================
/**
 * Affiche un message d'alerte à l'utilisateur
 * @param {string} message - Le message à afficher
 * @param {string} type - Le type d'alerte ('info', 'success', 'error', 'warning')
 */
function showAlert(message, type = 'info') {
    const alertContainer = document.getElementById('alertContainer');
    alertContainer.innerHTML = `<div class="alert alert-${type}">${message}</div>`;
    
    setTimeout(() => {
        alertContainer.innerHTML = '';
    }, ALERT_DURATION);
}

/**
 * Désactive ou active un bouton et change son texte
 * @param {HTMLElement} button - L'élément bouton
 * @param {boolean} disabled - True pour désactiver, false pour activer
 * @param {string} text - Le nouveau texte du bouton
 */
function toggleButton(button, disabled, text) {
    button.disabled = disabled;
    button.textContent = text;
}

// ==================== GESTION DE LA SESSION ====================
/**
 * Vérifie si une session est active au chargement de la page
 * Redirige vers index.html si l'utilisateur est déjà connecté
 */
async function checkExistingSession() {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
        // Session active, rediriger vers l'application
        window.location.href = 'index.html';
    }
}

// ==================== CONNEXION ====================
/**
 * Gère la connexion de l'utilisateur avec email et mot de passe
 * Vérifie ensuite si le 2FA est configuré ou doit être configuré
 */
async function handleLogin() {
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const loginBtn = document.getElementById('loginBtn');

    // Validation des champs
    if (!email || !password) {
        showAlert(ERROR_MESSAGES.REQUIRED_FIELDS, 'error');
        return;
    }

    toggleButton(loginBtn, true, 'Connexion...');

    try {
        // Tentative de connexion
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (error) {
            // Gestion des erreurs spécifiques
            if (error.message.includes('MFA') || error.message.includes('factor')) {
                showVerify2FA();
            } else if (error.message.includes('Invalid')) {
                showAlert(ERROR_MESSAGES.INVALID_CREDENTIALS, 'error');
            } else {
                throw error;
            }
        } else if (data.user) {
            currentUser = data.user;
            
            // Vérifier si le 2FA est configuré
            const { data: factors } = await supabase.auth.mfa.listFactors();
            
            if (factors && factors.totp && factors.totp.length > 0) {
                // 2FA déjà configuré, demander le code
                factorId = factors.totp[0].id;
                showVerify2FA();
            } else {
                // Pas de 2FA, proposer la configuration
                await setupMFA();
            }
        }
    } catch (error) {
        console.error('Erreur de connexion:', error);
        showAlert(error.message || ERROR_MESSAGES.AUTH_FAILED, 'error');
        toggleButton(loginBtn, false, 'Se connecter');
    }
}

// ==================== CONFIGURATION DU 2FA ====================
/**
 * Configure l'authentification à deux facteurs (2FA) pour l'utilisateur
 * Génère un QR code et un secret TOTP
 */
async function setupMFA() {
    try {
        // Masquer le formulaire de connexion
        document.getElementById('passwordForm').classList.add('hidden');
        document.getElementById('setup2FAForm').classList.remove('hidden');

        // Enrôler un nouveau facteur TOTP
        const { data, error } = await supabase.auth.mfa.enroll({
            factorType: 'totp'
        });

        if (error) throw error;

        factorId = data.id;
        const qrCode = data.totp.qr_code;
        const secret = data.totp.secret;

        // Afficher le QR code
        document.getElementById('qrCodeContainer').innerHTML = `
            <img src="${qrCode}" alt="QR Code 2FA">
        `;

        // Afficher le secret
        document.getElementById('secretCode').textContent = `Secret: ${secret}`;

        showAlert('Scannez le QR code avec votre application d\'authentification', 'info');
    } catch (error) {
        console.error('Erreur configuration 2FA:', error);
        showAlert('Erreur lors de la configuration du 2FA', 'error');
        cancelSetup();
    }
}

/**
 * Vérifie le code de configuration 2FA saisi par l'utilisateur
 * Active le 2FA si le code est valide
 */
async function verifySetup2FA() {
    const code = document.getElementById('setupCode').value.trim();

    // Validation du format du code
    if (code.length !== 6 || !/^\d{6}$/.test(code)) {
        showAlert('Le code doit contenir 6 chiffres', 'error');
        return;
    }

    try {
        // Challenge et vérification du code
        const { data, error } = await supabase.auth.mfa.challengeAndVerify({
            factorId: factorId,
            code: code
        });

        if (error) throw error;

        showAlert(SUCCESS_MESSAGES['2FA_ENABLED'], 'success');
        
        // Redirection vers l'application après un court délai
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1500);
    } catch (error) {
        console.error('Erreur vérification setup 2FA:', error);
        showAlert(ERROR_MESSAGES.INVALID_2FA_CODE, 'error');
    }
}

/**
 * Annule la configuration du 2FA et retourne au formulaire de connexion
 */
function cancelSetup() {
    document.getElementById('setup2FAForm').classList.add('hidden');
    document.getElementById('passwordForm').classList.remove('hidden');
    document.getElementById('setupCode').value = '';
    
    const loginBtn = document.getElementById('loginBtn');
    toggleButton(loginBtn, false, 'Se connecter');
}

// ==================== VÉRIFICATION 2FA ====================
/**
 * Affiche le formulaire de vérification 2FA
 */
function showVerify2FA() {
    document.getElementById('passwordForm').classList.add('hidden');
    document.getElementById('setup2FAForm').classList.add('hidden');
    document.getElementById('verify2FAForm').classList.remove('hidden');
}

/**
 * Vérifie le code 2FA lors de la connexion
 * Authentifie l'utilisateur si le code est correct
 */
async function verify2FACode() {
    const code = document.getElementById('verifyCode').value.trim();

    // Validation du format du code
    if (code.length !== 6 || !/^\d{6}$/.test(code)) {
        showAlert('Le code doit contenir 6 chiffres', 'error');
        return;
    }

    try {
        // Récupérer le factorId si nécessaire
        if (!factorId) {
            const { data: factors } = await supabase.auth.mfa.listFactors();
            if (factors && factors.totp && factors.totp.length > 0) {
                factorId = factors.totp[0].id;
            } else {
                throw new Error('Aucun facteur 2FA trouvé');
            }
        }

        // Challenge et vérification du code
        const { data, error } = await supabase.auth.mfa.challengeAndVerify({
            factorId: factorId,
            code: code
        });

        if (error) throw error;

        showAlert(SUCCESS_MESSAGES.LOGIN_SUCCESS, 'success');
        
        // Redirection vers l'application
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
    } catch (error) {
        console.error('Erreur vérification 2FA:', error);
        showAlert(ERROR_MESSAGES.INVALID_2FA_CODE, 'error');
    }
}

/**
 * Annule la vérification 2FA et retourne au formulaire de connexion
 */
function cancelVerify() {
    document.getElementById('verify2FAForm').classList.add('hidden');
    document.getElementById('passwordForm').classList.remove('hidden');
    document.getElementById('verifyCode').value = '';
    
    const loginBtn = document.getElementById('loginBtn');
    toggleButton(loginBtn, false, 'Se connecter');
}

// ==================== GESTION DES ÉVÉNEMENTS ====================
/**
 * Initialisation des événements au chargement du DOM
 */
document.addEventListener('DOMContentLoaded', function() {
    // Vérifier si une session existe déjà
    checkExistingSession();

    // Bouton de connexion
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
        loginBtn.addEventListener('click', handleLogin);
    }

    // Bouton d'activation 2FA
    const setupBtn = document.getElementById('setupBtn');
    if (setupBtn) {
        setupBtn.addEventListener('click', verifySetup2FA);
    }

    // Bouton de vérification 2FA
    const verifyBtn = document.getElementById('verifyBtn');
    if (verifyBtn) {
        verifyBtn.addEventListener('click', verify2FACode);
    }

    // Bouton d'annulation setup
    const cancelSetupBtn = document.getElementById('cancelSetupBtn');
    if (cancelSetupBtn) {
        cancelSetupBtn.addEventListener('click', cancelSetup);
    }

    // Bouton d'annulation vérification
    const cancelVerifyBtn = document.getElementById('cancelVerifyBtn');
    if (cancelVerifyBtn) {
        cancelVerifyBtn.addEventListener('click', cancelVerify);
    }

    // Gestion de la touche Entrée pour les champs de saisie
    const passwordInput = document.getElementById('password');
    if (passwordInput) {
        passwordInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') handleLogin();
        });
    }

    const setupCodeInput = document.getElementById('setupCode');
    if (setupCodeInput) {
        setupCodeInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') verifySetup2FA();
        });
    }

    const verifyCodeInput = document.getElementById('verifyCode');
    if (verifyCodeInput) {
        verifyCodeInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') verify2FACode();
        });
    }

    console.log('✓ Authentification initialisée');
});