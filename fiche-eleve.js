/**
 * FICHE-ELEVE.js
 * Gestion de la fiche élève individuelle
 * 
 * Ce fichier contient :
 * - Chargement des données de l'élève
 * - Gestion de la photo
 * - Modification des informations
 * - Suppression de l'élève
 */

// ==================== VARIABLES GLOBALES ====================
let currentStudent = null;
let currentClassId = null;

// ==================== INITIALISATION ====================
/**
 * Récupère les paramètres de l'URL
 * @returns {Object} {studentId, classId}
 */
function getUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);
    return {
        studentId: parseInt(urlParams.get('student_id')),
        classId: parseInt(urlParams.get('class_id'))
    };
}

/**
 * Charge les données de l'élève
 */
async function loadStudentData() {
    const { studentId, classId } = getUrlParams();
    
    if (!studentId || !classId) {
        alert('Paramètres manquants');
        window.history.back();
        return;
    }
    
    currentClassId = classId;
    
    try {
        const { data, error } = await supabase
            .from('students')
            .select('*')
            .eq('id', studentId)
            .single();
        
        if (error) throw error;
        
        currentStudent = data;
        displayStudentData();
        
    } catch (error) {
        console.error('Erreur chargement élève:', error);
        alert('Erreur lors du chargement de l\'élève');
        window.history.back();
    }
}

/**
 * Affiche les données de l'élève dans le formulaire
 */
function displayStudentData() {
    if (!currentStudent) return;
    
    // Photo ou avatar
    const photoEl = document.getElementById('studentPhoto');
    const avatarEl = document.getElementById('studentAvatarLarge');
    
    if (currentStudent.photo_url) {
        photoEl.style.backgroundImage = `url('${currentStudent.photo_url}')`;
        photoEl.style.backgroundSize = 'cover';
        photoEl.style.backgroundPosition = 'center';
        avatarEl.style.display = 'none';
    } else {
        const initials = (currentStudent.first_name.charAt(0) + currentStudent.last_name.charAt(0)).toUpperCase();
        avatarEl.textContent = initials;
        avatarEl.style.display = 'flex';
    }
    
    // Informations
    document.getElementById('studentFirstName').value = currentStudent.first_name || '';
    document.getElementById('studentLastName').value = currentStudent.last_name || '';
    document.getElementById('studentBirthdate').value = currentStudent.birthdate || '';
    
    // Groupes AP
    document.getElementById('ap1Checkbox').checked = currentStudent.ap1 || false;
    document.getElementById('ap2Checkbox').checked = currentStudent.ap2 || false;
    
    // Notes (Markdown)
    const notesPreview = document.getElementById('notesPreview');
    if (currentStudent.notes) {
        const textWithBreaks = currentStudent.notes.replace(/\n/g, '  \n');
        notesPreview.innerHTML = marked.parse(textWithBreaks);
    } else {
        notesPreview.innerHTML = '';
    }
}

// ==================== GESTION DES NOTES ====================
/**
 * Ouvre l'éditeur pour ajouter une nouvelle note
 */
function openNoteEditor() {
    const preview = document.getElementById('notesPreview');
    const editor = document.getElementById('notesEditor');
    const textarea = document.getElementById('notesTextarea');
    const newNoteBtn = document.getElementById('newNoteBtn');
    const saveNotesBtn = document.getElementById('saveNotesBtn');
    const cancelNotesBtn = document.getElementById('cancelNotesBtn');
    
    // Masquer la preview et le bouton nouvelle note, afficher l'éditeur et les boutons d'action
    preview.classList.add('hidden');
    newNoteBtn.classList.add('hidden');
    editor.classList.remove('hidden');
    saveNotesBtn.classList.remove('hidden');
    cancelNotesBtn.classList.remove('hidden');
    
    // Obtenir la date du jour au format JJ/MM/AAAA
    const today = new Date();
    const dateStr = today.toLocaleDateString('fr-FR');
    
    // Préparer le contenu avec la nouvelle date en haut
    const currentNotes = currentStudent.notes || '';
    const newNoteHeader = `## ${dateStr}\n\n`;
    
    // Placer la nouvelle note en haut, les anciennes en dessous
    if (currentNotes.trim()) {
        textarea.value = newNoteHeader + currentNotes;
    } else {
        textarea.value = newNoteHeader;
    }
    
    // Placer le curseur après la date (position = longueur du header)
    textarea.focus();
    textarea.setSelectionRange(newNoteHeader.length, newNoteHeader.length);
}

/**
 * Annule l'édition et retourne en mode lecture
 */
function cancelNoteEdit() {
    const preview = document.getElementById('notesPreview');
    const editor = document.getElementById('notesEditor');
    const newNoteBtn = document.getElementById('newNoteBtn');
    const saveNotesBtn = document.getElementById('saveNotesBtn');
    const cancelNotesBtn = document.getElementById('cancelNotesBtn');
    
    // Masquer l'éditeur et les boutons d'action, afficher la preview et le bouton nouvelle note
    editor.classList.add('hidden');
    saveNotesBtn.classList.add('hidden');
    cancelNotesBtn.classList.add('hidden');
    preview.classList.remove('hidden');
    newNoteBtn.classList.remove('hidden');
}

/**
 * Sauvegarde les notes
 */
async function saveNotes() {
    const textarea = document.getElementById('notesTextarea');
    const notes = textarea.value;
    
    try {
        const { error } = await supabase
            .from('students')
            .update({ notes: notes })
            .eq('id', currentStudent.id);
        
        if (error) throw error;
        
        currentStudent.notes = notes;
        
        // Retour en mode lecture
        cancelNoteEdit();
        displayStudentData();
        
        alert('✅ Notes enregistrées !');
        
    } catch (error) {
        console.error('Erreur sauvegarde notes:', error);
        alert('Erreur lors de l\'enregistrement des notes');
    }
}

// ==================== GESTION DE LA PHOTO ====================
/**
 * Ouvre le sélecteur de fichier pour changer la photo
 */
function changePhoto() {
    document.getElementById('photoFileInput').click();
}

/**
 * Gère le changement de photo
 */
async function handlePhotoChange(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Vérifications
    if (file.size > 5 * 1024 * 1024) {
        alert('La photo est trop grande (max 5 MB)');
        return;
    }
    
    if (!file.type.startsWith('image/')) {
        alert('Veuillez sélectionner une image');
        return;
    }
    
    await uploadPhoto(file);
    event.target.value = '';
}

/**
 * Upload une photo vers Supabase Storage
 * @param {File} file - Fichier image
 */
async function uploadPhoto(file) {
    try {
        console.log('Upload de la photo');
        
        const fileExt = file.name.split('.').pop();
        const fileName = `student_${currentStudent.id}_${Date.now()}.${fileExt}`;
        
        // Supprimer l'ancienne photo si elle existe
        if (currentStudent.photo_url) {
            await deletePhotoFile(currentStudent.photo_url);
        }
        
        // Upload vers Supabase Storage
        const { data, error } = await supabase.storage
            .from('student-photos')
            .upload(fileName, file, {
                cacheControl: '3600',
                upsert: false
            });
        
        if (error) throw error;
        
        // Obtenir l'URL signée (valide 1 an)
        const { data: urlData, error: urlError } = await supabase.storage
            .from('student-photos')
            .createSignedUrl(fileName, 31536000);
        
        if (urlError) throw urlError;
        
        // Mettre à jour la base de données
        const { error: updateError } = await supabase
            .from('students')
            .update({ photo_url: urlData.signedUrl })
            .eq('id', currentStudent.id);
        
        if (updateError) throw updateError;
        
        currentStudent.photo_url = urlData.signedUrl;
        displayStudentData();
        
        console.log('Photo uploadée avec succès');
        
    } catch (error) {
        console.error('Erreur upload photo:', error);
        alert('Erreur lors de l\'upload de la photo');
    }
}

/**
 * Supprime la photo de l'élève
 */
async function deletePhoto() {
    if (!currentStudent.photo_url) return;
    if (!confirm('Supprimer la photo ?')) return;
    
    try {
        // Supprimer le fichier du storage
        await deletePhotoFile(currentStudent.photo_url);
        
        // Mettre à jour la base de données
        const { error } = await supabase
            .from('students')
            .update({ photo_url: null })
            .eq('id', currentStudent.id);
        
        if (error) throw error;
        
        currentStudent.photo_url = null;
        displayStudentData();
        
        console.log('Photo supprimée');
        
    } catch (error) {
        console.error('Erreur suppression photo:', error);
        alert('Erreur lors de la suppression de la photo');
    }
}

/**
 * Supprime un fichier du storage
 * @param {string} photoUrl - URL de la photo
 */
async function deletePhotoFile(photoUrl) {
    try {
        const urlParts = photoUrl.split('/');
        const fileName = urlParts[urlParts.length - 1].split('?')[0];
        
        const { error } = await supabase.storage
            .from('student-photos')
            .remove([fileName]);
        
        if (error) {
            console.warn('Erreur suppression fichier:', error);
        }
    } catch (error) {
        console.warn('Erreur suppression fichier:', error);
    }
}

// ==================== SAUVEGARDE ====================
/**
 * Enregistre les modifications de l'élève
 */
async function saveStudent() {
    const firstName = document.getElementById('studentFirstName').value.trim();
    const lastName = document.getElementById('studentLastName').value.trim();
    const birthdate = document.getElementById('studentBirthdate').value || null;
    const ap1 = document.getElementById('ap1Checkbox').checked;
    const ap2 = document.getElementById('ap2Checkbox').checked;
    
    if (!firstName || !lastName) {
        alert('Le prénom et le nom sont obligatoires');
        return;
    }
    
    try {
        const { error } = await supabase
            .from('students')
            .update({
                first_name: firstName,
                last_name: lastName,
                birthdate: birthdate,
                ap1: ap1,
                ap2: ap2
            })
            .eq('id', currentStudent.id);
        
        if (error) throw error;
        
        alert('✅ Enregistré !');
        
        // Mettre à jour les données locales
        currentStudent.first_name = firstName;
        currentStudent.last_name = lastName;
        currentStudent.birthdate = birthdate;
        currentStudent.ap1 = ap1;
        currentStudent.ap2 = ap2;
        
    } catch (error) {
        console.error('Erreur sauvegarde:', error);
        alert('Erreur lors de l\'enregistrement');
    }
}

// ==================== SUPPRESSION ====================
/**
 * Ouvre le modal de confirmation de suppression
 */
function confirmDelete() {
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
}

/**
 * Supprime l'élève
 */
async function deleteStudent() {
    try {
        // Supprimer la photo si elle existe
        if (currentStudent.photo_url) {
            await deletePhotoFile(currentStudent.photo_url);
        }
        
        // Supprimer l'élève de la base
        const { error } = await supabase
            .from('students')
            .delete()
            .eq('id', currentStudent.id);
        
        if (error) throw error;
        
        alert('✅ Élève supprimé');
        
        // Retour au trombinoscope
        window.location.href = `trombinoscope.html?class_id=${currentClassId}`;
        
    } catch (error) {
        console.error('Erreur suppression élève:', error);
        alert('Erreur lors de la suppression');
    }
}

// ==================== ÉVÉNEMENTS ====================
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(async () => {
        // Charger les données
        await loadStudentData();
        
        // Bouton retour
        const backBtn = document.getElementById('backBtn');
        if (backBtn) {
            backBtn.addEventListener('click', function() {
                window.location.href = `trombinoscope.html?class_id=${currentClassId}`;
            });
        }
        
        // Bouton changer photo
        const changePhotoBtn = document.getElementById('changePhotoBtn');
        if (changePhotoBtn) changePhotoBtn.addEventListener('click', changePhoto);
        
        // Input photo
        const photoInput = document.getElementById('photoFileInput');
        if (photoInput) photoInput.addEventListener('change', handlePhotoChange);
        
        // Bouton supprimer photo
        const deletePhotoBtn = document.getElementById('deletePhotoBtn');
        if (deletePhotoBtn) deletePhotoBtn.addEventListener('click', deletePhoto);
        
        // Bouton enregistrer
        const saveBtn = document.getElementById('saveBtn');
        if (saveBtn) saveBtn.addEventListener('click', saveStudent);
        
        // Bouton supprimer élève
        const deleteStudentBtn = document.getElementById('deleteStudentBtn');
        if (deleteStudentBtn) deleteStudentBtn.addEventListener('click', confirmDelete);
        
        // Gestion des notes
        const newNoteBtn = document.getElementById('newNoteBtn');
        if (newNoteBtn) newNoteBtn.addEventListener('click', openNoteEditor);
        
        const saveNotesBtn = document.getElementById('saveNotesBtn');
        if (saveNotesBtn) saveNotesBtn.addEventListener('click', saveNotes);
        
        const cancelNotesBtn = document.getElementById('cancelNotesBtn');
        if (cancelNotesBtn) cancelNotesBtn.addEventListener('click', cancelNoteEdit);
        
        // Gestion exclusive des checkboxes AP1 et AP2
        const ap1Checkbox = document.getElementById('ap1Checkbox');
        const ap2Checkbox = document.getElementById('ap2Checkbox');
        
        if (ap1Checkbox) {
            ap1Checkbox.addEventListener('change', function() {
                if (this.checked) {
                    ap2Checkbox.checked = false;
                }
            });
        }
        
        if (ap2Checkbox) {
            ap2Checkbox.addEventListener('change', function() {
                if (this.checked) {
                    ap1Checkbox.checked = false;
                }
            });
        }
        
        // Modal suppression
        const closeDeleteModalBtn = document.getElementById('closeDeleteModal');
        if (closeDeleteModalBtn) closeDeleteModalBtn.addEventListener('click', closeDeleteModal);
        
        const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
        if (cancelDeleteBtn) cancelDeleteBtn.addEventListener('click', closeDeleteModal);
        
        const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
        if (confirmDeleteBtn) confirmDeleteBtn.addEventListener('click', deleteStudent);
        
        // Fermer modal en cliquant en dehors
        const deleteModal = document.getElementById('deleteModal');
        if (deleteModal) {
            deleteModal.addEventListener('click', function(e) {
                if (e.target === deleteModal) closeDeleteModal();
            });
        }
        
        console.log('✓ Fiche élève initialisée');
    }, 100);
});