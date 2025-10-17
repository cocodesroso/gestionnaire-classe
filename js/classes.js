/**
 * CLASSES.js
 * Gestion CRUD des classes (Create, Read, Update, Delete)
 * 
 * Ce fichier contient :
 * - Affichage de la liste des classes
 * - Ajout d'une nouvelle classe
 * - Modification d'une classe
 * - Suppression d'une classe
 * - Recherche d'élèves dans toutes les classes
 */

// ==================== VARIABLES GLOBALES ====================
let classes = [];
let currentClassId = null; // Pour l'édition
let classToDelete = null; // Pour la suppression
let allStudents = []; // Tous les élèves pour la recherche

// ==================== CHARGEMENT DES CLASSES ====================
/**
 * Charge toutes les classes depuis Supabase
 */
async function loadClasses() {
    try {
        const { data, error } = await supabase
            .from('classes')
            .select('*')
            .order('name');

        if (error) throw error;

        classes = data || [];
        renderClasses();
        
        // Charger aussi tous les élèves pour la recherche
        await loadAllStudents();

    } catch (error) {
        console.error('Erreur chargement classes:', error);
        alert('Erreur lors du chargement des classes');
    }
}

/**
 * Charge tous les élèves de toutes les classes pour la recherche
 */
async function loadAllStudents() {
    try {
        const { data, error } = await supabase
            .from('students')
            .select(`
                id,
                first_name,
                last_name,
                class_id,
                classes (
                    name
                )
            `)
            .order('last_name');

        if (error) throw error;

        allStudents = data || [];
        console.log('✓ Élèves chargés pour la recherche:', allStudents.length);

    } catch (error) {
        console.error('Erreur chargement élèves:', error);
    }
}

/**
 * Affiche les classes dans la grille
 */
function renderClasses() {
    const gridEl = document.getElementById('classesGrid');
    const noClassesEl = document.getElementById('noClasses');

    if (!gridEl) return;

    // Afficher message si aucune classe
    if (classes.length === 0) {
        gridEl.innerHTML = '';
        if (noClassesEl) noClassesEl.classList.remove('hidden');
        return;
    }

    // Masquer le message
    if (noClassesEl) noClassesEl.classList.add('hidden');

    // Afficher les classes
    gridEl.innerHTML = '';
    classes.forEach(classe => {
        const card = createClassCard(classe);
        gridEl.appendChild(card);
    });
}

/**
 * Crée une carte pour une classe
 * @param {Object} classe - Objet classe
 * @returns {HTMLElement} Élément DOM de la carte
 */
function createClassCard(classe) {
    const card = document.createElement('div');
    card.className = 'class-card';
    // Ajouter le clic sur la carte pour ouvrir le trombinoscope
    card.style.cursor = 'pointer';
    card.addEventListener('click', function() {
        window.location.href = `trombinoscope.html?class_id=${classe.id}`;
    });
    card.innerHTML = `
        <div class="class-icon">📁</div>
        <div class="class-name">${classe.name}</div>
        <div class="class-actions">
            <button class="btn-icon edit" onclick="event.stopPropagation(); editClass(${classe.id})" title="Modifier">
                ✏️
            </button>
            <button class="btn-icon delete" onclick="event.stopPropagation(); confirmDeleteClass(${classe.id})" title="Supprimer">
                🗑️
            </button>
        </div>
    `;

    return card;
}

// ==================== RECHERCHE D'ÉLÈVES ====================
/**
 * Gère la recherche d'élèves en temps réel
 * @param {string} query - Terme de recherche
 */
function searchStudents(query) {
    const resultsEl = document.getElementById('searchResults');
    
    // Si la recherche est vide, masquer les résultats
    if (!query || query.trim().length < 2) {
        resultsEl.classList.add('hidden');
        return;
    }
    
    const searchTerm = query.trim().toLowerCase();
    
    // Filtrer les élèves
    const results = allStudents.filter(student => {
        const firstName = student.first_name.toLowerCase();
        const lastName = student.last_name.toLowerCase();
        return firstName.includes(searchTerm) || lastName.includes(searchTerm);
    });
    
    // Afficher les résultats
    displaySearchResults(results);
}

/**
 * Affiche les résultats de recherche
 * @param {Array} results - Liste des élèves trouvés
 */
function displaySearchResults(results) {
    const resultsEl = document.getElementById('searchResults');
    
    if (results.length === 0) {
        resultsEl.innerHTML = '<div class="search-no-result">Aucun élève trouvé</div>';
        resultsEl.classList.remove('hidden');
        return;
    }
    
    resultsEl.innerHTML = '';
    results.forEach(student => {
        const item = document.createElement('div');
        item.className = 'search-result-item';
        item.innerHTML = `
            <div class="search-result-name">${student.first_name} ${student.last_name.toUpperCase()}</div>
            <div class="search-result-class">Classe ${student.classes.name}</div>
        `;
        
        // Clic pour ouvrir la fiche élève
        item.addEventListener('click', function() {
            window.location.href = `fiche-eleve.html?student_id=${student.id}&class_id=${student.class_id}`;
        });
        
        resultsEl.appendChild(item);
    });
    
    resultsEl.classList.remove('hidden');
}

/**
 * Ferme les résultats de recherche
 */
function closeSearchResults() {
    const resultsEl = document.getElementById('searchResults');
    resultsEl.classList.add('hidden');
}

// ==================== AJOUT / MODIFICATION ====================
/**
 * Ouvre le modal pour ajouter une nouvelle classe
 */
function openAddModal() {
    currentClassId = null;
    document.getElementById('modalTitle').textContent = 'Nouvelle classe';
    document.getElementById('className').value = '';
    document.getElementById('classModal').classList.add('active');
    document.getElementById('className').focus();
}

/**
 * Ouvre le modal pour modifier une classe
 * @param {number} classId - ID de la classe à modifier
 */
function editClass(classId) {
    const classe = classes.find(c => c.id === classId);
    if (!classe) return;

    currentClassId = classId;
    document.getElementById('modalTitle').textContent = 'Modifier la classe';
    document.getElementById('className').value = classe.name;
    document.getElementById('classModal').classList.add('active');
    document.getElementById('className').focus();
}

/**
 * Ferme le modal de classe
 */
function closeClassModal() {
    document.getElementById('classModal').classList.remove('active');
    currentClassId = null;
}

/**
 * Enregistre une classe (création ou modification)
 */
async function saveClass() {
    const name = document.getElementById('className').value.trim();

    if (!name) {
        alert('Veuillez saisir un nom de classe');
        return;
    }

    try {
        if (currentClassId) {
            // Modification
            const { error } = await supabase
                .from('classes')
                .update({ name: name })
                .eq('id', currentClassId);

            if (error) throw error;

            console.log('✓ Classe modifiée');
        } else {
            // Création
            const { error } = await supabase
                .from('classes')
                .insert({ name: name });

            if (error) throw error;

            console.log('✓ Classe créée');
        }

        closeClassModal();
        await loadClasses();

    } catch (error) {
        console.error('Erreur sauvegarde classe:', error);
        alert('Erreur lors de l\'enregistrement');
    }
}

// ==================== SUPPRESSION ====================
/**
 * Ouvre le modal de confirmation de suppression
 * @param {number} classId - ID de la classe à supprimer
 */
function confirmDeleteClass(classId) {
    classToDelete = classId;
    document.getElementById('deleteModal').classList.add('active');
}

/**
 * Ferme le modal de suppression
 */
function closeDeleteModal() {
    document.getElementById('deleteModal').classList.remove('active');
    classToDelete = null;
}

/**
 * Supprime une classe
 */
async function deleteClass() {
    if (!classToDelete) return;

    try {
        const { error } = await supabase
            .from('classes')
            .delete()
            .eq('id', classToDelete);

        if (error) throw error;

        console.log('✓ Classe supprimée');
        closeDeleteModal();
        await loadClasses();

    } catch (error) {
        console.error('Erreur suppression classe:', error);
        alert('Erreur lors de la suppression');
    }
}

// ==================== ÉVÉNEMENTS ====================
/**
 * Initialise les événements de la page
 */
document.addEventListener('DOMContentLoaded', function() {
    // Attendre que le header soit chargé
    setTimeout(() => {
        // Charger les classes
        loadClasses();

        // Bouton ajouter
        const addBtn = document.getElementById('addClassBtn');
        if (addBtn) addBtn.addEventListener('click', openAddModal);

        // Champ de recherche
        const searchInput = document.getElementById('studentSearch');
        if (searchInput) {
            // Recherche en temps réel
            searchInput.addEventListener('input', function(e) {
                searchStudents(e.target.value);
            });
            
            // Fermer les résultats en cliquant ailleurs
            document.addEventListener('click', function(e) {
                if (!searchInput.contains(e.target) && !document.getElementById('searchResults').contains(e.target)) {
                    closeSearchResults();
                }
            });
        }

        // Modal classe - Fermeture
        const closeModal = document.getElementById('closeModal');
        if (closeModal) closeModal.addEventListener('click', closeClassModal);

        const cancelBtn = document.getElementById('cancelBtn');
        if (cancelBtn) cancelBtn.addEventListener('click', closeClassModal);

        // Modal classe - Sauvegarde
        const saveBtn = document.getElementById('saveClassBtn');
        if (saveBtn) saveBtn.addEventListener('click', saveClass);

        // Touche Entrée pour sauvegarder
        const classNameInput = document.getElementById('className');
        if (classNameInput) {
            classNameInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') saveClass();
            });
        }

        // Modal suppression - Fermeture
        const closeDeleteModalBtn = document.getElementById('closeDeleteModal');
        if (closeDeleteModalBtn) closeDeleteModalBtn.addEventListener('click', closeDeleteModal);

        const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
        if (cancelDeleteBtn) cancelDeleteBtn.addEventListener('click', closeDeleteModal);

        // Modal suppression - Confirmation
        const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
        if (confirmDeleteBtn) confirmDeleteBtn.addEventListener('click', deleteClass);

        // Fermer les modals en cliquant en dehors
        const classModal = document.getElementById('classModal');
        const deleteModal = document.getElementById('deleteModal');

        if (classModal) {
            classModal.addEventListener('click', function(e) {
                if (e.target === classModal) closeClassModal();
            });
        }

        if (deleteModal) {
            deleteModal.addEventListener('click', function(e) {
                if (e.target === deleteModal) closeDeleteModal();
            });
        }

        console.log('✓ Page Classes initialisée');
    }, 100);
});
