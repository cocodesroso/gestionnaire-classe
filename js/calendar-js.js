/**
 * CALENDAR-JS.JS
 * Gestion du calendrier hebdomadaire
 * 
 * Ce fichier contient :
 * - Affichage du calendrier semaine
 * - Navigation entre les semaines
 * - Mise en surbrillance du jour actuel
 */

// ==================== VARIABLES GLOBALES ====================
let currentDate = new Date();

// ==================== UTILITAIRES DATE ====================
/**
 * Obtient le lundi de la semaine d'une date donnée
 * @param {Date} date - La date de référence
 * @returns {Date} Le lundi de la semaine
 */
function getMonday(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
}

/**
 * Obtient le vendredi de la semaine d'une date donnée
 * @param {Date} date - La date de référence
 * @returns {Date} Le vendredi de la semaine
 */
function getFriday(date) {
    const monday = getMonday(date);
    const friday = new Date(monday);
    friday.setDate(monday.getDate() + 4);
    return friday;
}

/**
 * Formate une date en chaîne lisible
 * @param {Date} date - La date à formater
 * @returns {string} Date formatée
 */
function formatDate(date) {
    const options = { day: 'numeric', month: 'long', year: 'numeric' };
    return date.toLocaleDateString('fr-FR', options);
}

/**
 * Vérifie si une date est aujourd'hui
 * @param {Date} date - La date à vérifier
 * @returns {boolean}
 */
function isToday(date) {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
}

/**
 * Obtient le numéro de colonne pour une date donnée (0 = lundi, 4 = vendredi)
 * @param {Date} date - La date
 * @returns {number} Le numéro de colonne
 */
function getTodayColumn() {
    const today = new Date();
    const monday = getMonday(currentDate);
    const friday = getFriday(currentDate);
    
    // Vérifier si aujourd'hui est dans la semaine affichée
    if (today < monday || today > friday) {
        return -1; // Aujourd'hui n'est pas dans cette semaine
    }
    
    const day = today.getDay();
    // Convertir dimanche (0) en -1, lundi (1) en 0, etc.
    return day === 0 ? -1 : day - 1;
}

// ==================== RENDU DU CALENDRIER ====================
/**
 * Rend le calendrier complet
 */
function renderCalendar() {
    const monday = getMonday(currentDate);
    const friday = getFriday(currentDate);
    
    // Mettre à jour le titre
    updateCalendarTitle(monday, friday);
    
    // Rendre la grille
    renderCalendarGrid(monday);
}

/**
 * Met à jour le titre du calendrier
 * @param {Date} monday - Lundi de la semaine
 * @param {Date} friday - Vendredi de la semaine
 */
function updateCalendarTitle(monday, friday) {
    const titleEl = document.getElementById('calendarTitle');
    if (!titleEl) return;
    
    const mondayStr = monday.getDate();
    const fridayStr = friday.getDate();
    const monthYear = formatDate(friday);
    const monthName = monthYear.split(' ')[1];
    const year = monthYear.split(' ')[2];
    
    titleEl.textContent = `Semaine du ${mondayStr} au ${fridayStr} ${monthName} ${year}`;
}

/**
 * Rend la grille du calendrier
 * @param {Date} monday - Lundi de la semaine
 */
function renderCalendarGrid(monday) {
    const gridEl = document.getElementById('calendarGrid');
    if (!gridEl) return;
    
    gridEl.innerHTML = '';
    
    // Colonne vide pour l'en-tête
    const emptyHeader = document.createElement('div');
    emptyHeader.className = 'calendar-day-header';
    gridEl.appendChild(emptyHeader);
    
    // En-têtes des jours
    const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'];
    const todayColumn = getTodayColumn();
    
    for (let i = 0; i < 5; i++) {
        const date = new Date(monday);
        date.setDate(monday.getDate() + i);
        
        const header = document.createElement('div');
        header.className = 'calendar-day-header';
        if (i === todayColumn) {
            header.classList.add('today');
        }
        
        header.innerHTML = `
            <span class="day-name">${days[i]}</span>
            <span class="day-number">${date.getDate()}</span>
        `;
        gridEl.appendChild(header);
    }
    
    // Créneaux horaires
    TIME_SLOTS.forEach(slot => {
        // Label de l'heure
        const timeLabel = document.createElement('div');
        timeLabel.className = 'time-label';
        timeLabel.textContent = slot.label;
        gridEl.appendChild(timeLabel);
        
        // Cellules pour chaque jour
        for (let i = 0; i < 5; i++) {
            const cell = document.createElement('div');
            cell.className = 'calendar-cell';
            
            // Marquer la pause déjeuner
            if (slot.isBreak) {
                cell.classList.add('lunch-break');
            }
            
            // Marquer la colonne du jour actuel
            if (i === todayColumn && !slot.isBreak) {
                cell.classList.add('today-column');
            }
            
            gridEl.appendChild(cell);
        }
    });
}

// ==================== NAVIGATION ====================
/**
 * Va à la semaine précédente
 */
function previousWeek() {
    currentDate.setDate(currentDate.getDate() - 7);
    renderCalendar();
}

/**
 * Va à la semaine suivante
 */
function nextWeek() {
    currentDate.setDate(currentDate.getDate() + 7);
    renderCalendar();
}

/**
 * Retourne à la semaine actuelle
 */
function goToToday() {
    currentDate = new Date();
    renderCalendar();
}

/**
 * Va à une date spécifique
 * @param {string} dateString - Date au format YYYY-MM-DD
 */
function goToDate(dateString) {
    if (!dateString) return;
    
    const selectedDate = new Date(dateString + 'T12:00:00'); // Ajouter une heure pour éviter les problèmes de timezone
    if (isNaN(selectedDate.getTime())) return; // Date invalide
    
    currentDate = selectedDate;
    renderCalendar();
}

// ==================== INITIALISATION ====================
/**
 * Initialise le calendrier au chargement du DOM
 */
document.addEventListener('DOMContentLoaded', function() {
    // Attendre que le header soit chargé
    setTimeout(() => {
        // Vérifier que les éléments existent
        if (document.getElementById('calendarGrid')) {
            renderCalendar();
            
            // Événements de navigation
            const prevBtn = document.getElementById('prevWeekBtn');
            const nextBtn = document.getElementById('nextWeekBtn');
            const todayBtn = document.getElementById('todayBtn');
            const dateInput = document.getElementById('datePickerInput');
            
            if (prevBtn) prevBtn.addEventListener('click', previousWeek);
            if (nextBtn) nextBtn.addEventListener('click', nextWeek);
            if (todayBtn) todayBtn.addEventListener('click', goToToday);
            if (dateInput) {
                dateInput.addEventListener('change', function(e) {
                    goToDate(e.target.value);
                });
            }
            
            console.log('✓ Calendrier initialisé');
        }
    }, 100);
});