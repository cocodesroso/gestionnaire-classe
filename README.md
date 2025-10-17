# 🎓 Gestionnaire de Classes

Application web de gestion de classes et d'élèves pour enseignants.

## ✨ Fonctionnalités

- 🔐 **Authentification sécurisée** avec 2FA (authentification à deux facteurs)
- 📚 **Gestion des classes** (création, modification, suppression)
- 👥 **Trombinoscope** avec photos ou avatars colorés
- 📝 **Fiches élèves** individuelles avec notes en Markdown
- 🔍 **Recherche instantanée** d'élèves dans toutes les classes
- 📥 **Import CSV** pour ajouter plusieurs élèves en une fois
- 👁️ **Masquage des photos** (mode RGPD)
- 🏷️ **Groupes AP1/AP2** pour organiser les élèves

## 🛠️ Technologies

- **Frontend** : HTML5, CSS3, JavaScript (Vanilla)
- **Backend** : [Supabase](https://supabase.com) (PostgreSQL, Auth, Storage)
- **Sécurité** : Row Level Security (RLS), 2FA obligatoire

## 🚀 Installation

### Prérequis
- Un compte Supabase (gratuit)
- Un serveur web local ou GitHub Pages

### Étapes

1. **Cloner le projet**
```bash
git clone https://github.com/votre-username/gestionnaire-classes.git
cd gestionnaire-classes
```

2. **Configurer Supabase**

Créez un projet sur [Supabase](https://supabase.com) et créez ces tables :

**Table `classes` :**
```sql
CREATE TABLE classes (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Table `students` :**
```sql
CREATE TABLE students (
  id BIGSERIAL PRIMARY KEY,
  class_id BIGINT REFERENCES classes(id) ON DELETE CASCADE,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  birthdate DATE,
  photo_url TEXT,
  notes TEXT,
  ap1 BOOLEAN DEFAULT FALSE,
  ap2 BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

3. **Activer Row Level Security (RLS)**

Pour chaque table (`classes` et `students`), créez ces 4 politiques :

```sql
-- SELECT
CREATE POLICY "Enable read for authenticated users only"
ON public.students FOR SELECT
TO authenticated
USING (true);

-- INSERT
CREATE POLICY "Enable insert for authenticated users only"
ON public.students FOR INSERT
TO authenticated
WITH CHECK (true);

-- UPDATE
CREATE POLICY "Enable update for authenticated users only"
ON public.students FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- DELETE
CREATE POLICY "Enable delete for authenticated users only"
ON public.students FOR DELETE
TO authenticated
USING (true);
```

4. **Créer un bucket Storage pour les photos**

Dans Supabase → Storage → Create bucket :
- Nom : `student-photos`
- Public : ❌ Non (privé)

5. **Configurer les identifiants**

Modifiez `js/config-js.js` avec vos identifiants Supabase :
```javascript
const SUPABASE_URL = 'https://votre-projet.supabase.co';
const SUPABASE_ANON_KEY = 'votre-cle-publique';
```

6. **Lancer l'application**

Ouvrez simplement `index-html.html` dans votre navigateur, ou utilisez un serveur local :

```bash
# Python
python -m http.server 8000

# PHP
php -S localhost:8000

# Node.js
npx http-server
```

Accédez à `http://localhost:8000`

## 📖 Utilisation

1. **Créer un compte** : Première connexion → configuration du 2FA
2. **Ajouter une classe** : Bouton "+ Nouvelle classe"
3. **Ajouter des élèves** : Manuellement ou via import CSV
4. **Gérer les élèves** : Cliquez sur une carte pour ouvrir la fiche complète

## 📄 Structure du projet

```
gestionnaire-classes/
├── index-html.html          # Page d'accueil / Calendrier
├── login-html.html          # Page de connexion
├── classes-html.html        # Gestion des classes
├── trombinoscope-html.html  # Liste des élèves
├── fiche-eleve-html.html    # Fiche individuelle
├── css/                     # Styles
├── js/                      # Scripts
└── components/              # Composants réutilisables
```

## 🔐 Sécurité

- ✅ Authentification à deux facteurs (2FA) obligatoire
- ✅ Row Level Security (RLS) activé sur toutes les tables
- ✅ Aucune donnée accessible sans authentification
- ✅ Photos stockées de manière sécurisée sur Supabase Storage

## 📝 License

MIT License - Libre d'utilisation

## 👤 Auteur

Votre nom - [GitHub](https://github.com/votre-username)

---

⭐ **N'oubliez pas de mettre une étoile si ce projet vous est utile !**
