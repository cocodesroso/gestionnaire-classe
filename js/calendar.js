/**
 * CALENDAR.js
 * Gestion du calendrier hebdomadaire avec événements
 * 
 * Ce fichier contient :
 * - Affichage du calendrier semaine
 * - Navigation entre les semaines
 * - Création/Modification/Suppression d'événements
 * - Affichage des événements dans les cellules
 */

// ==================== VARIABLES GLOBALES ====================
let currentDate = new Date();
let events = [];
let classes = [];
let currentEventId = null;
let currentCell = null;
let eventToDelete = null;

// ==================== UTILITAIRES DATE ====================
/**
 * Obtient le lundi de la semaine d'une date donnée
 */
function getMonday(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
}

/**
 * Obtient le vendredi de la semaine d'une date donnée
 */
function getFriday(date) {
    const monday = getMonday(date);
    const friday = new Date(monday);
    friday.setDate(monday.getDate() + 4);
    return friday;
}

/**
 * Formate une date en chaîne lisible
 */
function formatDate(date) {
    const options = { day: 'numeric', month: 'long', year: 'numeric' };
    return date.toLocaleDateString('fr-FR', options);
}

/**
 * Formate une date pour l'API (YYYY-MM-DD)
 */
function formatDateISO(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Vérifie si une date est aujourd'hui
 */
function isToday(date) {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
}

/**
 * Obtient le numéro de colonne pour une date donnée (0 = lundi, 4 = vendredi)
 */
function getTodayColumn() {
    const today = new Date();
    const monday = getMonday(currentDate);
    const friday = getFriday(currentDate);
    
    const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const mondayDate = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate());
    const fridayDate = new Date(friday.getFullYear(), friday.getMonth(), friday.getDate());
    
    if (todayDate < mondayDate || todayDate > fridayDate) {
        return -1;
    }
    
    const day = today.getDay();
    return day === 0 ? -1 : day - 1;
}

// ==================== CHARGEMENT DES DONNÉES ====================
/**
 * Charge toutes les classes
 */
async function loadClasses() {
    try {
        const { data, error } = await supabase
            .from('classes')
            .select('*')
            .order('name');

        if (error) throw error;

        classes = data || [];
        populateClassSelect();

    } catch (error) {
        console.error('Erreur chargement classes:', error);
    }
}

/**
 * Remplit le select des classes dans le modal
 */
function populateClassSelect() {
    const select = document.getElementById('eventClass');
    if (!select) return;

    select.innerHTML = '<option value="">-- Sélectionner --</option>';
    
    classes.forEach(classe => {
        const option = document.createElement('option');
        option.value = classe.id;
        option.textContent = classe.name;
        select.appendChild(option);
    });
}

/**
 * Remplit le select des créneaux horaires
 */
function populateTimeSlotSelect() {
    const select = document.getElementById('eventTimeSlot');
    if (!select) return;

    select.innerHTML = '<option value="">-- Sélectionner --</option>';
    
    TIME_SLOTS.forEach((slot, index) => {
        if (!slot.isBreak) {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = slot.label;
            select.appendChild(option);
        }
    });
}

/**
 * Charge les événements de la semaine courante
 */
async function loadEvents() {
    const monday = getMonday(currentDate);
    const friday = getFriday(currentDate);
    
    const mondayStr = formatDateISO(monday);
    const fridayStr = formatDateISO(friday);

    try {
        const { data, error } = await supabase
            .from('events')
            .select(`
                *,
                classes (
                    name
                )
            `)
            .gte('date', mondayStr)
            .lte('date', fridayStr)
            .order('time_slot');

        if (error) throw error;

        events = data || [];
        console.log('✓ Événements chargés:', events.length);

    } catch (error) {
        console.error('Erreur chargement événements:', error);
    }
}

// ==================== RENDU DU CALENDRIER ====================
/**
 * Rend le calendrier complet
 */
async function renderCalendar() {
    const monday = getMonday(currentDate);
    const friday = getFriday(currentDate);
    
    updateCalendarTitle(monday, friday);
    await loadEvents();
    renderCalendarGrid(monday);
}

/**
 * Met à jour le titre du calendrier
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
    TIME_SLOTS.forEach((slot, slotIndex) => {
        // Label de l'heure
        const timeLabel = document.createElement('div');
        timeLabel.className = 'time-label';
        timeLabel.textContent = slot.label;
        gridEl.appendChild(timeLabel);
        
        // Cellules pour chaque jour
        for (let i = 0; i < 5; i++) {
            const date = new Date(monday);
            date.setDate(monday.getDate() + i);
            
            const cell = document.createElement('div');
            cell.className = 'calendar-cell';
            cell.dataset.date = formatDateISO(date);
            cell.dataset.timeSlot = slotIndex;
            
            // Marquer la pause déjeuner
            if (slot.isBreak) {
                cell.classList.add('lunch-break');
            } else {
                // Ajouter le clic pour créer un événement
                cell.addEventListener('click', function() {
                    openEventModal(null, formatDateISO(date), slotIndex);
                });
            }
            
            // Marquer la colonne du jour actuel
            if (i === todayColumn && !slot.isBreak) {
                cell.classList.add('today-column');
            }
            
            // Afficher les événements dans cette cellule
            const cellEvents = events.filter(e => 
                e.date === formatDateISO(date) && e.time_slot === slotIndex
            );
            
            cellEvents.forEach(event => {
                const eventEl = createEventElement(event);
                cell.appendChild(eventEl);
            });
            
            gridEl.appendChild(cell);
        }
    });
}

/**
 * Crée un élément d'événement
 */
function createEventElement(event) {
    const eventEl = document.createElement('div');
    eventEl.className = 'calendar-event';
    
    // Ajouter une classe CSS selon la matière
    const subjectClass = event.subject.toLowerCase().replace(/\s/g, '-');
    eventEl.classList.add(`subject-${subjectClass}`);
    
    // Contenu
    let groupType = '';
    if (event.group_type === 'ap1') groupType = ' (AP1)';
    else if (event.group_type === 'ap2') groupType = ' (AP2)';
    
    eventEl.innerHTML = `
        <div class="event-time">${event.subject}</div>
        <div class="event-class">${event.classes.name}${groupType}</div>
    `;
    
    // Clic pour éditer
    eventEl.addEventListener('click', function(e) {
        e.stopPropagation();
        openEventModal(event.id);
    });
    
    return eventEl;
}

// ==================== GESTION DES ÉVÉNEMENTS ====================
/**
 * Ouvre le modal pour créer ou modifier un événement
 */
function openEventModal(eventId = null, date = null, timeSlot = null) {
    currentEventId = eventId;
    
    const modal = document.getElementById('eventModal');
    const title = document.getElementById('eventModalTitle');
    const deleteBtn = document.getElementById('deleteEventBtn');
    
    if (eventId) {
        // Mode édition
        const event = events.find(e => e.id === eventId);
        if (!event) return;
        
        title.textContent = 'Modifier l\'événement';
        deleteBtn.style.display = 'block';
        
        document.getElementById('eventSubject').value = event.subject;
        document.getElementById('eventClass').value = event.class_id;
        document.getElementById('eventDate').value = event.date;
        document.getElementById('eventTimeSlot').value = event.time_slot;
        document.getElementById('eventNotes').value = event.notes || '';
        
        // Sélectionner le type de groupe
        document.querySelector(`input[name="groupType"][value="${event.group_type}"]`).checked = true;
        
    } else {
        // Mode création
        title.textContent = 'Nouvel événement';
        deleteBtn.style.display = 'none';
        
        document.getElementById('eventSubject').value = '';
        document.getElementById('eventClass').value = '';
        document.getElementById('eventDate').value = date || formatDateISO(currentDate);
        document.getElementById('eventTimeSlot').value = timeSlot !== null ? timeSlot : '';
        document.getElementById('eventNotes').value = '';
        
        document.querySelector('input[name="groupType"][value="full"]').checked = true;
    }
    
    modal.classList.add('active');
}

/**
 * Ferme le modal d'événement
 */
function closeEventModal() {
    document.getElementById('eventModal').classList.remove('active');
    currentEventId = null;
}

/**
 * Enregistre un événement
 */
async function saveEvent() {
    const subject = document.getElementById('eventSubject').value;
    const classId = parseInt(document.getElementById('eventClass').value);
    const date = document.getElementById('eventDate').value;
    const timeSlot = parseInt(document.getElementById('eventTimeSlot').value);
    const notes = document.getElementById('eventNotes').value.trim() || null;
    const groupType = document.querySelector('input[name="groupType"]:checked').value;

    // Validation
    if (!subject || !classId || !date || isNaN(timeSlot)) {
        alert('Veuillez remplir tous les champs obligatoires');
        return;
    }

    try {
        const eventData = {
            subject,
            class_id: classId,
            date,
            time_slot: timeSlot,
            group_type: groupType,
            notes
        };

        if (currentEventId) {
            // Modification
            const { error } = await supabase
                .from('events')
                .update(eventData)
                .eq('id', currentEventId);

            if (error) throw error;

            console.log('✓ Événement modifié');
        } else {
            // Création
            const { error } = await supabase
                .from('events')
                .insert(eventData);

            if (error) throw error;

            console.log('✓ Événement créé');
        }

        closeEventModal();
        await renderCalendar();

    } catch (error) {
        console.error('Erreur sauvegarde événement:', error);
        alert('Erreur lors de l\'enregistrement');
    }
}

/**
 * Ouvre le modal de confirmation de suppression
 */
function confirmDeleteEvent() {
    if (!currentEventId) return;
    
    eventToDelete = currentEventId;
    document.getElementById('deleteEventModal').classList.add('active');
}

/**
 * Ferme le modal de suppression
 */
function closeDeleteEventModal() {
    document.getElementById('deleteEventModal').classList.remove('active');
    eventToDelete = null;
}

/**
 * Supprime un événement
 */
async function deleteEvent() {
    if (!eventToDelete) return;

    try {
        const { error } = await supabase
            .from('events')
            .delete()
            .eq('id', eventToDelete);

        if (error) throw error;

        console.log('✓ Événement supprimé');
        closeDeleteEventModal();
        closeEventModal();
        await renderCalendar();

    } catch (error) {
        console.error('Erreur suppression événement:', error);
        alert('Erreur lors de la suppression');
    }
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
 */
function goToDate(dateString) {
    if (!dateString) return;
    
    const selectedDate = new Date(dateString + 'T12:00:00');
    if (isNaN(selectedDate.getTime())) return;
    
    currentDate = selectedDate;
    renderCalendar();
}

// ==================== INITIALISATION ====================
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(async () => {
        if (document.getElementById('calendarGrid')) {
            // Charger les données
            await loadClasses();
            populateTimeSlotSelect();
            await renderCalendar();
            
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
            
            // Modal événement
            const closeEventModalBtn = document.getElementById('closeEventModal');
            if (closeEventModalBtn) closeEventModalBtn.addEventListener('click', closeEventModal);
            
            const cancelEventBtn = document.getElementById('cancelEventBtn');
            if (cancelEventBtn) cancelEventBtn.addEventListener('click', closeEventModal);
            
            const saveEventBtn = document.getElementById('saveEventBtn');
            if (saveEventBtn) saveEventBtn.addEventListener('click', saveEvent);
            
            const deleteEventBtn = document.getElementById('deleteEventBtn');
            if (deleteEventBtn) deleteEventBtn.addEventListener('click', confirmDeleteEvent);
            
            // Modal suppression
            const closeDeleteEventModalBtn = document.getElementById('closeDeleteEventModal');
            if (closeDeleteEventModalBtn) closeDeleteEventModalBtn.addEventListener('click', closeDeleteEventModal);
            
            const cancelDeleteEventBtn = document.getElementById('cancelDeleteEventBtn');
            if (cancelDeleteEventBtn) cancelDeleteEventBtn.addEventListener('click', closeDeleteEventModal);
            
            const confirmDeleteEventBtn = document.getElementById('confirmDeleteEventBtn');
            if (confirmDeleteEventBtn) confirmDeleteEventBtn.addEventListener('click', deleteEvent);
            
            // Fermer les modals en cliquant en dehors
            const eventModal = document.getElementById('eventModal');
            const deleteEventModal = document.getElementById('deleteEventModal');
            
            if (eventModal) {
                eventModal.addEventListener('click', function(e) {
                    if (e.target === eventModal) closeEventModal();
                });
            }
            
            if (deleteEventModal) {
                deleteEventModal.addEventListener('click', function(e) {
                    if (e.target === deleteEventModal) closeDeleteEventModal();
                });
            }
            
            console.log('✓ Calendrier initialisé');
        }
    }, 100);
});
