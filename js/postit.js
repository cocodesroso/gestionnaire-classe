/**
 * POSTIT.js
 * Gestion des post-it (tâches à faire)
 */

// ==================== VARIABLES GLOBALES ====================
let postits = [];
let classes = [];
let currentPostitId = null;
let postitToDelete = null;
let currentFilter = 'all';

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
 * Remplit le select des classes
 */
function populateClassSelect() {
    const select = document.getElementById('postitClass');
    if (!select) return;

    select.innerHTML = '<option value="">Aucune classe</option>';
    
    classes.forEach(classe => {
        const option = document.createElement('option');
        option.value = classe.id;
        option.textContent = classe.name;
        select.appendChild(option);
    });
}

/**
 * Charge tous les post-it
 */
async function loadPostits() {
    try {
        const { data, error } = await supabase
            .from('postits')
            .select(`
                *,
                classes (
                    name
                )
            `)
            .order('deadline', { ascending: true });

        if (error) throw error;

        postits = data || [];
        renderPostits();

    } catch (error) {
        console.error('Erreur chargement post-it:', error);
        alert('Erreur lors du chargement des post-it');
    }
}

/**
 * Affiche les post-it selon le filtre actif
 */
function renderPostits() {
    const gridEl = document.getElementById('postitGrid');
    const noPostitEl = document.getElementById('noPostit');

    if (!gridEl) return;

    // Filtrer les post-it
    let filteredPostits = postits;
    
    if (currentFilter === 'todo') {
        filteredPostits = postits.filter(p => !p.done);
    } else if (currentFilter === 'done') {
        filteredPostits = postits.filter(p => p.done);
    } else if (currentFilter === 'urgent') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const in3Days = new Date(today);
        in3Days.setDate(today.getDate() + 3);
        
        filteredPostits = postits.filter(p => {
            if (p.done) return false;
            const deadline = new Date(p.deadline);
            return deadline <= in3Days;
        });
    }

    // Afficher message si aucun post-it
    if (filteredPostits.length === 0) {
        gridEl.innerHTML = '';
        if (noPostitEl) noPostitEl.classList.remove('hidden');
        return;
    }

    // Masquer le message
    if (noPostitEl) noPostitEl.classList.add('hidden');

    // Afficher les post-it
    gridEl.innerHTML = '';
    filteredPostits.forEach(postit => {
        const card = createPostitCard(postit);
        gridEl.appendChild(card);
    });
}

/**
 * Crée une carte post-it
 */
function createPostitCard(postit) {
    const card = document.createElement('div');
    card.className = 'postit-card';
    card.draggable = true;
    
    // Classes CSS selon l'état
    if (postit.done) {
        card.classList.add('done');
    }
    
    // Vérifier si urgent (échéance dans moins de 3 jours)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const deadline = new Date(postit.deadline);
    const diffDays = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));
    
    if (!postit.done && diffDays <= 3) {
        card.classList.add('urgent');
    }
    
    // Classe liée
    let classInfo = '';
    if (postit.class_id && postit.classes) {
        const groupLabel = postit.group_type === 'ap1' ? ' (AP1)' : 
                          postit.group_type === 'ap2' ? ' (AP2)' : '';
        classInfo = `
            <div class="postit-class">
                <span class="postit-class-icon">📚</span>
                <span>${postit.classes.name}${groupLabel}</span>
            </div>
        `;
    }
    
    // Formatage de la date
    const deadlineStr = new Date(postit.deadline).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short'
    });
    
    let deadlineClass = '';
    if (!postit.done) {
        if (diffDays < 0) deadlineClass = 'overdue';
        else if (diffDays === 0) deadlineClass = 'today';
    }
    
    card.innerHTML = `
        <div class="postit-pin">📌</div>
        <div class="postit-content">
            <div class="postit-text">${postit.text}</div>
            <div class="postit-info">
                ${classInfo}
                <div class="postit-deadline ${deadlineClass}">
                    <span>📅</span>
                    <span>${deadlineStr}</span>
                </div>
            </div>
        </div>
        <div class="postit-actions">
            <button class="btn-icon check" onclick="toggleDone(${postit.id})" title="${postit.done ? 'Marquer comme à faire' : 'Marquer comme fait'}">
                ${postit.done ? '↩️' : '✓'}
            </button>
            <button class="btn-icon edit" onclick="editPostit(${postit.id})" title="Modifier">
                ✏️
            </button>
            <button class="btn-icon delete" onclick="confirmDeletePostit(${postit.id})" title="Supprimer">
                🗑️
            </button>
        </div>
    `;
    
    return card;
}

// ==================== AJOUT / MODIFICATION ====================
/**
 * Ouvre le modal pour ajouter un post-it
 */
function openAddModal() {
    currentPostitId = null;
    document.getElementById('modalTitle').textContent = 'Nouveau post-it';
    document.getElementById('postitText').value = '';
    document.getElementById('postitClass').value = '';
    document.getElementById('postitGroup').value = 'full';
    document.getElementById('postitDeadline').value = '';
    
    document.getElementById('postitModal').classList.add('active');
    document.getElementById('postitText').focus();
}

/**
 * Ouvre le modal pour modifier un post-it
 */
function editPostit(postitId) {
    const postit = postits.find(p => p.id === postitId);
    if (!postit) return;

    currentPostitId = postitId;
    document.getElementById('modalTitle').textContent = 'Modifier le post-it';
    document.getElementById('postitText').value = postit.text;
    document.getElementById('postitClass').value = postit.class_id || '';
    document.getElementById('postitGroup').value = postit.group_type;
    document.getElementById('postitDeadline').value = postit.deadline;
    
    document.getElementById('postitModal').classList.add('active');
    document.getElementById('postitText').focus();
}

/**
 * Ferme le modal
 */
function closePostitModal() {
    document.getElementById('postitModal').classList.remove('active');
    currentPostitId = null;
}

/**
 * Enregistre un post-it
 */
async function savePostit() {
    const text = document.getElementById('postitText').value.trim();
    const classId = document.getElementById('postitClass').value || null;
    const groupType = document.getElementById('postitGroup').value;
    const deadline = document.getElementById('postitDeadline').value;

    if (!text || !deadline) {
        alert('Veuillez remplir la tâche et la date d\'échéance');
        return;
    }

    try {
        const postitData = {
            text,
            class_id: classId ? parseInt(classId) : null,
            group_type: groupType,
            deadline,
            done: false
        };

        if (currentPostitId) {
            // Modification
            const { error } = await supabase
                .from('postits')
                .update(postitData)
                .eq('id', currentPostitId);

            if (error) throw error;

            console.log('✓ Post-it modifié');
        } else {
            // Création
            const { error } = await supabase
                .from('postits')
                .insert(postitData);

            if (error) throw error;

            console.log('✓ Post-it créé');
        }

        closePostitModal();
        await loadPostits();

    } catch (error) {
        console.error('Erreur sauvegarde post-it:', error);
        alert('Erreur lors de l\'enregistrement');
    }
}

// ==================== MARQUER COMME FAIT ====================
/**
 * Toggle l'état fait/à faire
 */
async function toggleDone(postitId) {
    const postit = postits.find(p => p.id === postitId);
    if (!postit) return;

    try {
        const { error } = await supabase
            .from('postits')
            .update({ done: !postit.done })
            .eq('id', postitId);

        if (error) throw error;

        console.log('✓ État modifié');
        await loadPostits();

    } catch (error) {
        console.error('Erreur toggle done:', error);
        alert('Erreur lors de la modification');
    }
}

// ==================== SUPPRESSION ====================
/**
 * Ouvre le modal de confirmation de suppression
 */
function confirmDeletePostit(postitId) {
    postitToDelete = postitId;
    document.getElementById('deleteModal').classList.add('active');
}

/**
 * Ferme le modal de suppression
 */
function closeDeleteModal() {
    document.getElementById('deleteModal').classList.remove('active');
    postitToDelete = null;
}

/**
 * Supprime un post-it
 */
async function deletePostit() {
    if (!postitToDelete) return;

    try {
        const { error } = await supabase
            .from('postits')
            .delete()
            .eq('id', postitToDelete);

        if (error) throw error;

        console.log('✓ Post-it supprimé');
        closeDeleteModal();
        await loadPostits();

    } catch (error) {
        console.error('Erreur suppression post-it:', error);
        alert('Erreur lors de la suppression');
    }
}

// ==================== FILTRES ====================
/**
 * Change le filtre actif
 */
function setFilter(filter) {
    currentFilter = filter;
    
    // Mettre à jour les boutons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.filter === filter) {
            btn.classList.add('active');
        }
    });
    
    renderPostits();
}

// ==================== ÉVÉNEMENTS ====================
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(async () => {
        // Charger les données
        await loadClasses();
        await loadPostits();

        // Bouton ajouter
        const addBtn = document.getElementById('addPostitBtn');
        if (addBtn) addBtn.addEventListener('click', openAddModal);

        // Boutons de filtres
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                setFilter(this.dataset.filter);
            });
        });

        // Modal post-it - Fermeture
        const closeModal = document.getElementById('closeModal');
        if (closeModal) closeModal.addEventListener('click', closePostitModal);

        const cancelBtn = document.getElementById('cancelBtn');
        if (cancelBtn) cancelBtn.addEventListener('click', closePostitModal);

        // Modal post-it - Sauvegarde
        const saveBtn = document.getElementById('savePostitBtn');
        if (saveBtn) saveBtn.addEventListener('click', savePostit);

        // Modal suppression - Fermeture
        const closeDeleteModalBtn = document.getElementById('closeDeleteModal');
        if (closeDeleteModalBtn) closeDeleteModalBtn.addEventListener('click', closeDeleteModal);

        const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
        if (cancelDeleteBtn) cancelDeleteBtn.addEventListener('click', closeDeleteModal);

        // Modal suppression - Confirmation
        const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
        if (confirmDeleteBtn) confirmDeleteBtn.addEventListener('click', deletePostit);

        // Fermer les modals en cliquant en dehors
        const postitModal = document.getElementById('postitModal');
        const deleteModal = document.getElementById('deleteModal');

        if (postitModal) {
            postitModal.addEventListener('click', function(e) {
                if (e.target === postitModal) closePostitModal();
            });
        }

        if (deleteModal) {
            deleteModal.addEventListener('click', function(e) {
                if (e.target === deleteModal) closeDeleteModal();
            });
        }

        console.log('✓ Page Post-it initialisée');
    }, 100);
});