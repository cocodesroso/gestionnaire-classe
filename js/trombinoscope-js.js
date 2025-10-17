/**
 * TROMBINOSCOPE-JS.JS
 * Gestion CRUD des élèves (Create, Read, Update, Delete)
 * 
 * Ce fichier contient :
 * - Affichage de la liste des élèves d'une classe
 * - Ajout d'un nouvel élève
 * - Modification d'un élève
 * - Suppression d'un élève
 */

// ==================== VARIABLES GLOBALES ====================
let students = [];
let currentClassId = null;
let currentStudentId = null; // Pour l'édition
let studentToDelete = null; // Pour la suppression
let currentSort = { field: 'none', order: 'none' }; // Gestion du tri
let currentFilter = 'all'; // Filtre actuel : 'all', 'ap1', 'ap2'
let photosHidden = false; // État du masquage des photos

// ==================== INITIALISATION ====================
/**
 * Récupère l'ID de la classe depuis l'URL
 * @returns {number|null} L'ID de la classe
 */
function getClassIdFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const classId = urlParams.get('class_id');
    return classId ? parseInt(classId) : null;
}

/**
 * Charge les informations de la classe
 */
async function loadClassInfo() {
    currentClassId = getClassIdFromURL();
    
    if (!currentClassId) {
        alert('Aucune classe spécifiée');
        window.location.href = 'classes-html.html';
        return;
    }

    try {
        const { data, error } = await supabase
            .from('classes')
            .select('*')
            .eq('id', currentClassId)
            .single();

        if (error) throw error;

        if (data) {
            document.getElementById('classTitle').textContent = `Classe ${data.name}`;
        }

    } catch (error) {
        console.error('Erreur chargement classe:', error);
        alert('Classe introuvable');
        window.location.href = 'classes-html.html';
    }
}

// ==================== CHARGEMENT DES ÉLÈVES ====================
/**
 * Charge tous les élèves de la classe
 */
async function loadStudents() {
    if (!currentClassId) return;

    try {
        const { data, error } = await supabase
            .from('students')
            .select('*')
            .eq('class_id', currentClassId)
            .order('last_name');

        if (error) throw error;

        students = data || [];
        renderStudents();

    } catch (error) {
        console.error('Erreur chargement élèves:', error);
        alert('Erreur lors du chargement des élèves');
    }
}

/**
 * Affiche les élèves dans la grille
 */
function renderStudents() {
    const gridEl = document.getElementById('studentsGrid');
    const noStudentsEl = document.getElementById('noStudents');

    if (!gridEl) return;

    // Filtrer les élèves selon le filtre actuel
    let filteredStudents = students;
    if (currentFilter === 'ap1') {
        filteredStudents = students.filter(s => s.ap1 === true);
    } else if (currentFilter === 'ap2') {
        filteredStudents = students.filter(s => s.ap2 === true);
    }

    // Afficher message si aucun élève après filtrage
    if (filteredStudents.length === 0) {
        gridEl.innerHTML = '';
        if (noStudentsEl) {
            noStudentsEl.classList.remove('hidden');
            // Message adapté selon le filtre
            const noStudentsTitle = noStudentsEl.querySelector('h3');
            if (noStudentsTitle) {
                if (currentFilter === 'ap1') {
                    noStudentsTitle.textContent = 'Aucun élève dans le groupe AP1';
                } else if (currentFilter === 'ap2') {
                    noStudentsTitle.textContent = 'Aucun élève dans le groupe AP2';
                } else {
                    noStudentsTitle.textContent = 'Aucun élève pour le moment';
                }
            }
        }
        return;
    }

    // Masquer le message
    if (noStudentsEl) noStudentsEl.classList.add('hidden');

    // Trier les élèves selon le tri actuel
    let sortedStudents = [...filteredStudents];
    
    if (currentSort.field === 'last_name' && currentSort.order !== 'none') {
        sortedStudents.sort((a, b) => {
            const comparison = a.last_name.localeCompare(b.last_name, 'fr');
            return currentSort.order === 'asc' ? comparison : -comparison;
        });
    } else if (currentSort.field === 'first_name' && currentSort.order !== 'none') {
        sortedStudents.sort((a, b) => {
            const comparison = a.first_name.localeCompare(b.first_name, 'fr');
            return currentSort.order === 'asc' ? comparison : -comparison;
        });
    }

    // Afficher les élèves
    gridEl.innerHTML = '';
    sortedStudents.forEach((student, index) => {
        const card = createStudentCard(student, index);
        gridEl.appendChild(card);
    });
    
    // Appliquer le masquage des photos si actif
    if (photosHidden) {
        gridEl.classList.add('hide-photos');
    } else {
        gridEl.classList.remove('hide-photos');
    }
}

/**
 * Crée une carte pour un élève
 * @param {Object} student - Objet élève
 * @param {number} index - Index pour la couleur de l'avatar
 * @returns {HTMLElement} Élément DOM de la carte
 */
function createStudentCard(student, index) {
    const card = document.createElement('div');
    card.className = 'student-card';
    
    // Créer les initiales
    const initials = (student.first_name.charAt(0) + student.last_name.charAt(0)).toUpperCase();
    
    // Couleur de l'avatar (rotation entre 6 couleurs)
    const colorClass = `color-${(index % 6) + 1}`;
    
    // Zone photo/avatar
    let photoHTML = '';
    if (student.photo_url) {
        // Photo en fond
        photoHTML = `<div class="student-card-photo" style="background-image: url('${student.photo_url}')"></div>`;
    } else {
        // Avatar avec initiales
        photoHTML = `
            <div class="student-card-photo">
                <div class="student-card-avatar ${colorClass}">${initials}</div>
            </div>
        `;
    }
    
    // MODIFICATION : Prénom en haut, NOM en dessous
    card.innerHTML = `
        ${photoHTML}
        <div class="student-card-name">
            <div class="student-first-name">${student.first_name}</div>
            <div class="student-last-name">${student.last_name.toUpperCase()}</div>
        </div>
    `;
    
    // Clic sur la carte pour ouvrir la fiche élève
    card.addEventListener('click', function() {
        openStudentFile(student.id);
    });

    return card;
}

/**
 * Ouvre la fiche complète d'un élève
 * @param {number} studentId - ID de l'élève
 */
function openStudentFile(studentId) {
    window.location.href = `fiche-eleve-html.html?student_id=${studentId}&class_id=${currentClassId}`;
}

// ==================== AJOUT / MODIFICATION ====================
/**
 * Ouvre le modal pour ajouter un nouvel élève
 */
function openAddModal() {
    currentStudentId = null;
    document.getElementById('modalTitle').textContent = 'Nouvel élève';
    document.getElementById('studentFirstName').value = '';
    document.getElementById('studentLastName').value = '';
    document.getElementById('studentBirthdate').value = '';
    
    const modal = document.getElementById('studentModal');
    modal.classList.remove('hidden');
    modal.classList.add('active');
    
    document.getElementById('studentFirstName').focus();
}

/**
 * Ouvre le modal pour modifier un élève
 * @param {number} studentId - ID de l'élève à modifier
 */
function editStudent(studentId) {
    const student = students.find(s => s.id === studentId);
    if (!student) return;

    currentStudentId = studentId;
    document.getElementById('modalTitle').textContent = 'Modifier l\'élève';
    document.getElementById('studentFirstName').value = student.first_name;
    document.getElementById('studentLastName').value = student.last_name;
    document.getElementById('studentBirthdate').value = student.birthdate || '';
    
    const modal = document.getElementById('studentModal');
    modal.classList.remove('hidden');
    modal.classList.add('active');
    
    document.getElementById('studentFirstName').focus();
}

/**
 * Ferme le modal d'élève
 */
function closeStudentModal() {
    const modal = document.getElementById('studentModal');
    modal.classList.remove('active');
    modal.classList.add('hidden');
    currentStudentId = null;
}

/**
 * Enregistre un élève (création ou modification)
 */
async function saveStudent() {
    const firstName = document.getElementById('studentFirstName').value.trim();
    const lastName = document.getElementById('studentLastName').value.trim();
    const birthdate = document.getElementById('studentBirthdate').value || null;

    if (!firstName || !lastName) {
        alert('Veuillez saisir le prénom et le nom');
        return;
    }

    try {
        if (currentStudentId) {
            // Modification
            const { error } = await supabase
                .from('students')
                .update({
                    first_name: firstName,
                    last_name: lastName,
                    birthdate: birthdate
                })
                .eq('id', currentStudentId);

            if (error) throw error;

            console.log('✓ Élève modifié');
        } else {
            // Création
            const { error } = await supabase
                .from('students')
                .insert({
                    class_id: currentClassId,
                    first_name: firstName,
                    last_name: lastName,
                    birthdate: birthdate
                });

            if (error) throw error;

            console.log('✓ Élève créé');
        }

        closeStudentModal();
        await loadStudents();

    } catch (error) {
        console.error('Erreur sauvegarde élève:', error);
        alert('Erreur lors de l\'enregistrement');
    }
}

// ==================== SUPPRESSION ====================
/**
 * Ouvre le modal de confirmation de suppression
 * @param {number} studentId - ID de l'élève à supprimer
 */
function confirmDeleteStudent(studentId) {
    studentToDelete = studentId;
    const modal = document.getElementById('deleteModal');
    modal.classList.remove('hidden');
    modal.classList.add('active');
}

/**
 * Ferme le modal de suppression
 */
function closeDeleteModal() {
    const modal = document.getElementById('deleteModal');
    modal.classList.remove('active');
    modal.classList.add('hidden');
    studentToDelete = null;
}

/**
 * Supprime un élève
 */
async function deleteStudent() {
    if (!studentToDelete) return;

    try {
        const { error } = await supabase
            .from('students')
            .delete()
            .eq('id', studentToDelete);

        if (error) throw error;

        console.log('✓ Élève supprimé');
        closeDeleteModal();
        await loadStudents();

    } catch (error) {
        console.error('Erreur suppression élève:', error);
        alert('Erreur lors de la suppression');
    }
}

// ==================== IMPORT CSV ====================
/**
 * Ouvre le sélecteur de fichier CSV
 */
function openCsvImport() {
    document.getElementById('csvFileInput').click();
}

// ==================== TRI ====================
/**
 * Gère le tri par nom de famille
 */
function toggleSortLastName() {
    const btn = document.getElementById('sortLastNameBtn');
    const icon = btn.querySelector('.sort-icon');
    
    // Réinitialiser l'autre bouton
    const firstNameBtn = document.getElementById('sortFirstNameBtn');
    firstNameBtn.classList.remove('active');
    firstNameBtn.setAttribute('data-order', 'none');
    firstNameBtn.querySelector('.sort-icon').textContent = '⇅';
    
    // Cycle : none → asc → desc → none
    if (currentSort.field !== 'last_name' || currentSort.order === 'none') {
        currentSort = { field: 'last_name', order: 'asc' };
        icon.textContent = '▲';
        btn.classList.add('active');
        btn.setAttribute('data-order', 'asc');
    } else if (currentSort.order === 'asc') {
        currentSort = { field: 'last_name', order: 'desc' };
        icon.textContent = '▼';
        btn.setAttribute('data-order', 'desc');
    } else {
        currentSort = { field: 'none', order: 'none' };
        icon.textContent = '⇅';
        btn.classList.remove('active');
        btn.setAttribute('data-order', 'none');
    }
    
    renderStudents();
}

// ==================== FILTRES ====================
/**
 * Gère le changement de filtre (Classe/AP1/AP2)
 */
function handleFilterChange() {
    const selectedFilter = document.querySelector('input[name="groupFilter"]:checked');
    if (selectedFilter) {
        currentFilter = selectedFilter.value;
        renderStudents();
    }
}

/**
 * Toggle le masquage des photos
 */
function togglePhotos() {
    photosHidden = !photosHidden;
    const btn = document.getElementById('togglePhotosBtn');
    
    if (photosHidden) {
        btn.classList.add('active');
        btn.title = 'Afficher les photos';
    } else {
        btn.classList.remove('active');
        btn.title = 'Masquer les photos';
    }
    
    renderStudents();
}

// ==================== GESTION DES PHOTOS ====================
/**
 * Variable pour stocker l'ID de l'élève dont on change la photo
 */
let studentPhotoId = null;

/**
 * Ouvre le sélecteur de fichier pour changer/ajouter une photo
 * @param {number} studentId - ID de l'élève
 */
function changePhoto(studentId) {
    studentPhotoId = studentId;
    
    // Créer un input file temporaire
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/jpeg,image/png,image/jpg';
    
    input.onchange = async function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        // Vérifier la taille (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('La photo est trop grande (max 5 MB)');
            return;
        }
        
        // Vérifier le type
        if (!file.type.startsWith('image/')) {
            alert('Veuillez sélectionner une image');
            return;
        }
        
        await uploadPhoto(studentId, file);
    };
    
    input.click();
}

/**
 * Upload une photo vers Supabase Storage
 * @param {number} studentId - ID de l'élève
 * @param {File} file - Fichier image
 */
async function uploadPhoto(studentId, file) {
    try {
        console.log('Upload de la photo pour l\'élève', studentId);
        
        // Nom du fichier : student_{id}_{timestamp}.extension
        const fileExt = file.name.split('.').pop();
        const fileName = `student_${studentId}_${Date.now()}.${fileExt}`;
        const filePath = fileName;
        
        // Supprimer l'ancienne photo si elle existe
        const student = students.find(s => s.id === studentId);
        if (student && student.photo_url) {
            await deletePhotoFile(student.photo_url);
        }
        
        // Upload vers Supabase Storage
        const { data, error } = await supabase.storage
            .from('student-photos')
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false
            });
        
        if (error) throw error;
        
        console.log('Photo uploadée:', data);
        
        // Obtenir l'URL signée (valide 1 an)
        const { data: urlData, error: urlError } = await supabase.storage
            .from('student-photos')
            .createSignedUrl(filePath, 31536000); // 1 an en secondes
        
        if (urlError) throw urlError;
        
        const photoUrl = urlData.signedUrl;
        
        // Mettre à jour la base de données
        const { error: updateError } = await supabase
            .from('students')
            .update({ photo_url: photoUrl })
            .eq('id', studentId);
        
        if (updateError) throw updateError;
        
        console.log('Photo enregistrée dans la base');
        
        // Recharger les élèves
        await loadStudents();
        
    } catch (error) {
        console.error('Erreur upload photo:', error);
        alert('Erreur lors de l\'upload de la photo');
    }
}

/**
 * Supprime la photo d'un élève
 * @param {number} studentId - ID de l'élève
 */
async function deletePhoto(studentId) {
    if (!confirm('Supprimer la photo de cet élève ?')) return;
    
    try {
        const student = students.find(s => s.id === studentId);
        if (!student || !student.photo_url) return;
        
        // Supprimer le fichier du storage
        await deletePhotoFile(student.photo_url);
        
        // Mettre à jour la base de données
        const { error } = await supabase
            .from('students')
            .update({ photo_url: null })
            .eq('id', studentId);
        
        if (error) throw error;
        
        console.log('Photo supprimée');
        
        // Recharger les élèves
        await loadStudents();
        
    } catch (error) {
        console.error('Erreur suppression photo:', error);
        alert('Erreur lors de la suppression de la photo');
    }
}

/**
 * Supprime un fichier du storage Supabase
 * @param {string} photoUrl - URL de la photo
 */
async function deletePhotoFile(photoUrl) {
    try {
        // Extraire le nom du fichier de l'URL
        const urlParts = photoUrl.split('/');
        const fileName = urlParts[urlParts.length - 1].split('?')[0];
        
        console.log('Suppression du fichier:', fileName);
        
        const { error } = await supabase.storage
            .from('student-photos')
            .remove([fileName]);
        
        if (error) {
            console.warn('Erreur suppression fichier storage:', error);
        }
    } catch (error) {
        console.warn('Erreur lors de la suppression du fichier:', error);
    }
}

/**
 * Gère le tri par prénom
 */
function toggleSortFirstName() {
    const btn = document.getElementById('sortFirstNameBtn');
    const icon = btn.querySelector('.sort-icon');
    
    // Réinitialiser l'autre bouton
    const lastNameBtn = document.getElementById('sortLastNameBtn');
    lastNameBtn.classList.remove('active');
    lastNameBtn.setAttribute('data-order', 'none');
    lastNameBtn.querySelector('.sort-icon').textContent = '⇅';
    
    // Cycle : none → asc → desc → none
    if (currentSort.field !== 'first_name' || currentSort.order === 'none') {
        currentSort = { field: 'first_name', order: 'asc' };
        icon.textContent = '▲';
        btn.classList.add('active');
        btn.setAttribute('data-order', 'asc');
    } else if (currentSort.order === 'asc') {
        currentSort = { field: 'first_name', order: 'desc' };
        icon.textContent = '▼';
        btn.setAttribute('data-order', 'desc');
    } else {
        currentSort = { field: 'none', order: 'none' };
        icon.textContent = '⇅';
        btn.classList.remove('active');
        btn.setAttribute('data-order', 'none');
    }
    
    renderStudents();
}

/**
 * Gère la sélection d'un fichier CSV
 */
async function handleCsvFile(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Vérifier que c'est bien un CSV
    if (!file.name.endsWith('.csv')) {
        alert('Veuillez sélectionner un fichier CSV');
        return;
    }

    const reader = new FileReader();
    reader.onload = async function(e) {
        const csvText = e.target.result;
        await processCsv(csvText);
    };
    reader.readAsText(file, 'UTF-8');

    // Réinitialiser l'input pour permettre de réimporter le même fichier
    event.target.value = '';
}

/**
 * Parse le nom complet pour séparer NOM et prénom
 * Format attendu: "NOM EN MAJUSCULES Prénom" (ex: "ABDOURAHAMANE AHMED Nousrati")
 * Le prénom est toujours le dernier mot (en minuscules/capitalisé)
 * Le NOM est tout ce qui précède (en MAJUSCULES)
 * @param {string} fullName - Nom complet
 * @returns {Object} {lastName, firstName}
 */
function parseFullName(fullName) {
    if (!fullName) return { lastName: '', firstName: '' };

    const parts = fullName.trim().split(/\s+/);
    
    if (parts.length === 0) return { lastName: '', firstName: '' };
    if (parts.length === 1) return { lastName: parts[0], firstName: '' };
    
    // Le dernier mot est le prénom (minuscules/capitalisé)
    const firstName = parts[parts.length - 1];
    
    // Tout le reste est le NOM (majuscules)
    const lastName = parts.slice(0, -1).join(' ');
    
    return { lastName, firstName };
}

/**
 * Parse la date de naissance
 * Gère plusieurs formats: JJ/MM/AAAA, MM-JJ-AA, etc.
 * @param {string} dateStr - Date à parser
 * @returns {string|null} Date au format ISO ou null
 */
function parseBirthdate(dateStr) {
    if (!dateStr) return null;
    
    const trimmed = dateStr.trim();
    
    // Format MM-JJ-AA (ex: 01-14-11)
    if (trimmed.match(/^\d{2}-\d{2}-\d{2}$/)) {
        const parts = trimmed.split('-');
        const month = parts[0];
        const day = parts[1];
        let year = parts[2];
        
        // Convertir année 2 chiffres en 4 chiffres
        // Si < 50, on considère 20xx, sinon 19xx
        const yearNum = parseInt(year);
        year = yearNum < 50 ? `20${year}` : `19${year}`;
        
        return `${year}-${month}-${day}`;
    }
    
    // Format JJ/MM/AAAA (ex: 14/01/2011)
    if (trimmed.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
        const parts = trimmed.split('/');
        const day = parts[0].padStart(2, '0');
        const month = parts[1].padStart(2, '0');
        const year = parts[2];
        
        return `${year}-${month}-${day}`;
    }
    
    // Format MM/JJ/AAAA (ex: 01/14/2011)
    if (trimmed.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
        const parts = trimmed.split('/');
        const month = parts[0].padStart(2, '0');
        const day = parts[1].padStart(2, '0');
        const year = parts[2];
        
        return `${year}-${month}-${day}`;
    }
    
    console.warn(`Format de date non reconnu: ${dateStr}`);
    return null;
}

/**
 * Traite le CSV et importe les élèves
 * @param {string} csvText - Contenu du CSV
 */
async function processCsv(csvText) {
    try {
        console.log('=== DÉBUT IMPORT CSV ===');
        console.log('Contenu CSV (100 premiers caractères):', csvText.substring(0, 100));
        
        // Parser le CSV avec PapaParse
        const result = Papa.parse(csvText, {
            header: true,
            skipEmptyLines: true,
            transformHeader: function(header) {
                // Nettoyer les en-têtes (enlever les espaces)
                return header.trim();
            }
        });

        console.log('Headers détectés:', result.meta.fields);
        console.log('Nombre de lignes:', result.data.length);

        if (result.errors.length > 0) {
            console.error('Erreurs de parsing:', result.errors);
        }

        const rows = result.data;
        
        if (rows.length === 0) {
            alert('Le fichier CSV est vide');
            return;
        }

        // Récupérer les élèves existants pour détecter les doublons
        const { data: existingStudents } = await supabase
            .from('students')
            .select('first_name, last_name')
            .eq('class_id', currentClassId);

        const existingSet = new Set(
            (existingStudents || []).map(s => 
                `${s.last_name.toUpperCase()}_${s.first_name.toLowerCase()}`
            )
        );

        const toImport = [];
        const duplicates = [];
        const errors = [];

        // Traiter chaque ligne
        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            
            // Récupérer les colonnes (gérer les différentes variantes de noms)
            const fullName = row['NOM prénom'] || row['NOM Prénom'] || row['Nom'] || '';
            const birthdate = row['Né(e) le'] || row['Date de naissance'] || '';

            console.log(`Ligne ${i + 1}:`, { fullName, birthdate }); // DEBUG

            // Parser le nom
            const { lastName, firstName } = parseFullName(fullName);

            if (!lastName || !firstName) {
                errors.push(`Ligne ${i + 2}: Nom invalide "${fullName}"`);
                continue;
            }

            // Vérifier les doublons
            const key = `${lastName.toUpperCase()}_${firstName.toLowerCase()}`;
            if (existingSet.has(key)) {
                duplicates.push(`${lastName} ${firstName}`);
                continue;
            }

            // Parser la date de naissance
            const parsedBirthdate = parseBirthdate(birthdate);
            console.log(`Date parsée pour ${firstName} ${lastName}:`, parsedBirthdate); // DEBUG

            toImport.push({
                class_id: currentClassId,
                first_name: firstName,
                last_name: lastName,
                birthdate: parsedBirthdate
            });
        }

        // Insérer les nouveaux élèves
        let imported = 0;
        if (toImport.length > 0) {
            console.log('Données à importer:', toImport); // DEBUG
            
            const { data, error } = await supabase
                .from('students')
                .insert(toImport);

            if (error) {
                console.error('Erreur Supabase:', error); // DEBUG
                throw error;
            }
            
            console.log('Données insérées:', data); // DEBUG
            imported = toImport.length;
        }

        // Afficher le résultat
        showImportResult(imported, duplicates, errors);

        // Recharger la liste des élèves
        await loadStudents();

    } catch (error) {
        console.error('Erreur import CSV:', error);
        alert('Erreur lors de l\'import du CSV');
    }
}

/**
 * Affiche le résultat de l'import dans un modal
 * @param {number} imported - Nombre d'élèves importés
 * @param {Array} duplicates - Liste des doublons ignorés
 * @param {Array} errors - Liste des erreurs
 */
function showImportResult(imported, duplicates, errors) {
    let html = '<div class="import-summary">';
    
    // Statistiques
    html += `
        <div class="import-stat">
            <span class="import-stat-label">✅ Élèves importés</span>
            <span class="import-stat-value success">${imported}</span>
        </div>
    `;
    
    if (duplicates.length > 0) {
        html += `
            <div class="import-stat">
                <span class="import-stat-label">⚠️ Doublons ignorés</span>
                <span class="import-stat-value warning">${duplicates.length}</span>
            </div>
        `;
    }
    
    if (errors.length > 0) {
        html += `
            <div class="import-stat">
                <span class="import-stat-label">❌ Erreurs</span>
                <span class="import-stat-value error">${errors.length}</span>
            </div>
        `;
    }
    
    html += '</div>';
    
    // Détails des doublons
    if (duplicates.length > 0) {
        html += '<h4 style="margin-top: 20px; color: #f39c12;">Doublons ignorés :</h4>';
        html += '<div class="duplicate-list">';
        duplicates.slice(0, 10).forEach(name => {
            html += `<div class="duplicate-item">• ${name}</div>`;
        });
        if (duplicates.length > 10) {
            html += `<div class="duplicate-item">... et ${duplicates.length - 10} autre(s)</div>`;
        }
        html += '</div>';
    }
    
    // Détails des erreurs
    if (errors.length > 0) {
        html += '<h4 style="margin-top: 20px; color: #e74c3c;">Erreurs :</h4>';
        html += '<div class="duplicate-list">';
        errors.forEach(error => {
            html += `<div class="duplicate-item">• ${error}</div>`;
        });
        html += '</div>';
    }
    
    document.getElementById('importResultContent').innerHTML = html;
    
    const modal = document.getElementById('importResultModal');
    modal.classList.remove('hidden');
    modal.classList.add('active');
}

/**
 * Ferme le modal de résultat d'import
 */
function closeImportResultModal() {
    const modal = document.getElementById('importResultModal');
    modal.classList.remove('active');
    modal.classList.add('hidden');
}

// ==================== ÉVÉNEMENTS ====================
/**
 * Initialise les événements de la page
 */
document.addEventListener('DOMContentLoaded', function() {
    // Attendre que le header soit chargé
    setTimeout(async () => {
        // Charger la classe et les élèves
        await loadClassInfo();
        await loadStudents();

        // Bouton ajouter
        const addBtn = document.getElementById('addStudentBtn');
        if (addBtn) addBtn.addEventListener('click', openAddModal);

        // Bouton import CSV
        const importBtn = document.getElementById('importCsvBtn');
        if (importBtn) importBtn.addEventListener('click', openCsvImport);

        // Input file CSV
        const csvInput = document.getElementById('csvFileInput');
        if (csvInput) csvInput.addEventListener('change', handleCsvFile);

        // Boutons de tri
        const sortLastNameBtn = document.getElementById('sortLastNameBtn');
        if (sortLastNameBtn) sortLastNameBtn.addEventListener('click', toggleSortLastName);

        const sortFirstNameBtn = document.getElementById('sortFirstNameBtn');
        if (sortFirstNameBtn) sortFirstNameBtn.addEventListener('click', toggleSortFirstName);

        // Filtres par groupe
        const filterRadios = document.querySelectorAll('input[name="groupFilter"]');
        filterRadios.forEach(radio => {
            radio.addEventListener('change', handleFilterChange);
        });

        // Bouton masquer photos
        const togglePhotosBtn = document.getElementById('togglePhotosBtn');
        if (togglePhotosBtn) togglePhotosBtn.addEventListener('click', togglePhotos);

        // Modal élève - Fermeture
        const closeModal = document.getElementById('closeModal');
        if (closeModal) closeModal.addEventListener('click', closeStudentModal);

        const cancelBtn = document.getElementById('cancelBtn');
        if (cancelBtn) cancelBtn.addEventListener('click', closeStudentModal);

        // Modal élève - Sauvegarde
        const saveBtn = document.getElementById('saveStudentBtn');
        if (saveBtn) saveBtn.addEventListener('click', saveStudent);

        // Touche Entrée pour sauvegarder
        const lastNameInput = document.getElementById('studentLastName');
        if (lastNameInput) {
            lastNameInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') saveStudent();
            });
        }

        // Modal suppression - Fermeture
        const closeDeleteModalBtn = document.getElementById('closeDeleteModal');
        if (closeDeleteModalBtn) closeDeleteModalBtn.addEventListener('click', closeDeleteModal);

        const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
        if (cancelDeleteBtn) cancelDeleteBtn.addEventListener('click', closeDeleteModal);

        // Modal suppression - Confirmation
        const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
        if (confirmDeleteBtn) confirmDeleteBtn.addEventListener('click', deleteStudent);

        // Modal résultat import - Fermeture
        const closeImportResultModalBtn = document.getElementById('closeImportResultModal');
        if (closeImportResultModalBtn) closeImportResultModalBtn.addEventListener('click', closeImportResultModal);

        const closeImportBtn = document.getElementById('closeImportBtn');
        if (closeImportBtn) closeImportBtn.addEventListener('click', closeImportResultModal);

        // Fermer les modals en cliquant en dehors
        const studentModal = document.getElementById('studentModal');
        const deleteModal = document.getElementById('deleteModal');
        const importResultModal = document.getElementById('importResultModal');

        if (studentModal) {
            studentModal.addEventListener('click', function(e) {
                if (e.target === studentModal) closeStudentModal();
            });
        }

        if (deleteModal) {
            deleteModal.addEventListener('click', function(e) {
                if (e.target === deleteModal) closeDeleteModal();
            });
        }

        if (importResultModal) {
            importResultModal.addEventListener('click', function(e) {
                if (e.target === importResultModal) closeImportResultModal();
            });
        }

        console.log('✓ Page Trombinoscope initialisée');
    }, 100);
});