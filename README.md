# 🏔️ OrgaTrail Pro — Direction de Course & Roadbook Officiel Ultra-Trail

**OrgaTrail Pro** est une application web monopage (SPA) 100% côté client, conçue pour les directeurs de course, coordinateurs sécurité et organisateurs d'épreuves de trail et d'ultra-trail (type UTMB, Grand Raid de La Réunion, Tor des Géants, Diagonale des Fous, etc.).

Elle fonctionne entièrement dans le navigateur sans aucun backend, sans base de données, et peut être hébergée gratuitement sur **GitHub Pages**.

---

## 🌟 Fonctionnalités Principales

### 1. 📥 Importation & Calibration des Données
- **Tracé GPX 3D :**
  - Import par glisser-déposer.
  - Calcul précis de la distance 3D par formule de Haversine intégrant l'altitude $\Delta z$.
  - Lissage altimétrique intelligent (moyenne mobile glissante sur fenêtre de 50 m) pour éliminer les artefacts barométriques/GPS et calculer fidèlement le D+ et D-.
- **Fichier des Ravitaillements (Excel / CSV) :**
  - Support des formats `.xlsx`, `.xls` et `.csv` via SheetJS.
  - Détection automatique et tolérante des colonnes (`Nom`, `Distance km`, `Temps d'arrêt`, `Type de poste`, `Accès`, `Réseau/Radio`, `Médical`, `Dortoir`).
  - **Snapping automatique au GPX :** calage immédiat de chaque poste sur le point de trace GPS le plus proche pour une altitude et un kilométrage rigoureusement exacts.
- **Jeu de démonstration Grand Raid inclus :**
  - Chargement instantané en 1 clic d'un ultra-trail complet (165.2 km, 10 200m D+, 19 ravitaillements réels avec logistique complète).

---

### 2. 🧮 Moteur Physiologique de Minetti & Calibration Inverse
- **Modèle de coût énergétique de Minetti (2002) :**
  $$C_r(p) = 155.4 p^5 - 30.4 p^4 - 43.3 p^3 + 46.3 p^2 + 19.5 p + 3.6$$
  où $p = \Delta z / \Delta d$ représente la pente décimale de chaque micro-segment (20 à 50 m).
- **Dérive d'allure (Fatigue différentielle) :**
  - Modélisation de l'épuisement progressif : dérive faible pour la tête de course (~15%), dérive accentuée pour la queue de peloton / serre-files (~40%).
- **Facteur nuit :**
  - Ralentissement dynamique configurable (défaut : 8%) appliqué automatiquement lorsque les coureurs traversent la fenêtre nocturne (19h00 – 06h00).
- **Calibration Inverse (Target Pacing) :**
  - Algorithme de dichotomie itérative résolvant la vitesse de référence $V_0$ pour caler les temps totaux à la minute près sur les temps cibles saisis (ex: 23h30 pour le 1er coureur, 66h00 pour la barrière finale).

---

### 3. 🛡️ Poste de Commandement & Grille Horaire de Sécurité
- **Carte Interactive Leaflet :**
  - Tracé de course haute visibilité.
  - Bornes interactives numérotées `#1` à `#19` différenciant les ravitaillements simples, les points d'eau et les Bases Vie.
  - Infobulles complètes avec horaires de passage 1er et barrière, accessibilité véhicule et couverture radio.
- **Profil Altimétrique Haute Définition :**
  - Rendu Canvas 2D avec piquetage vertical des postes et détection au survol (curseur synchronisé).
- **Tableau de Sécurité Éditable en Ligne :**
  - Heures d'arrivée et de départ estimées, allures, vitesses inter-postes.
  - **Ajustement manuel d'une barrière :** clic direct sur une barrière horaire pour forcer une heure limite manuelle, avec badge visuel et bouton de réinitialisation vers le modèle Minetti.
  - **Export Excel PC Sécurité (.xlsx) :** génération instantanée de la feuille de calcul officielle pour transmission aux services de secours (SDIS, SAMU, PGHM, Croix-Rouge).

---

### 4. 📑 Générateur de Roadbook Officiel (Type UTMB)
- **Page de Garde & Synthèse Générale :**
  - Fiche d'identité de l'épreuve (Distance, D+, D-, Heure de départ, Limite).
  - Profil altimétrique global annoté.
  - Grille complète récapitulative des postes.
- **Découpage Automatique en Tranches de ~30 km :**
  - Segmente le parcours par tranches d'environ 30 km en s'arrêtant **strictement sur un ravitaillement réel existant**.
- **Fiches Détaillées de Section (1 page par tranche) :**
  - Mini-profil altimétrique zoomé avec points hauts, points bas et pentes maximales.
  - Tableau des postes intermédiaires (distances relatives, dénivelés partiels, temps 1er et barrière).
  - Encadré logistique par poste : accessibilité (Route, 4x4, Hélico, Sentier), couverture télécoms (GSM, Radio VHF, Satellite), services (repas chaud, lit/dortoir, assistance médicale).
- **Moteur d'Impression & Export PDF A4 :**
  - Feuille de style `@media print` calibrée en A4 paysage/portrait haute définition avec saut de page propre (`page-break`) par section.

---

## 🚀 Démarrage Rapide

### Prérequis
- [Node.js](https://nodejs.org/) (version 18 ou supérieure)
- npm

### Installation
```bash
# Cloner le dépôt ou naviguer dans le dossier
git clone <url-du-repo>
cd apporgatrail

# Installer les dépendances
npm install

# Démarrer le serveur de développement
npm run dev
```
L'application est immédiatement accessible sur `http://localhost:5173/`.

### Construction pour la production
```bash
npm run build
```
Les fichiers statiques prêts pour le déploiement sont générés dans le dossier `dist/`.

---

## 🌐 Déploiement Gratuit sur GitHub Pages

Ce projet est 100% configuré pour GitHub Pages :
1. Poussez le code sur votre dépôt GitHub (branche `main`).
2. Dans les paramètres de votre dépôt GitHub (`Settings` > `Pages`) :
   - Sous **Source**, sélectionnez **GitHub Actions**.
3. Le workflow automatique `.github/workflows/deploy.yml` compile et publie automatiquement votre application à chaque `git push` !

---

## 📂 Formats de Fichiers Recommandés

### Format GPX
- Tout fichier standard `.gpx` contenant des balises `<trkpt lat="..." lon="..."> <ele>...</ele> </trkpt>`.

### Format Excel / CSV des Ravitaillements
Votre fichier Excel (`.xlsx`, `.xls` ou `.csv`) peut contenir directement ces colonnes (un bouton permet également de télécharger ce modèle directement depuis l'application) :
| N° | Nom du Ravitaillement | Distance (km) | Type de Poste | Pause 1er (min) | Pause Dern. (min) | Accès Véhicule | Couverture Réseau | Médical | Dortoir |
|---|---|---|---|---|---|---|---|---|---|
| 1 | Saint-Pierre (Départ Plage) | 0.0 | DEPART | 0 | 0 | ROUTE | GSM | Oui | Non |
| 2 | Domaine Vidot | 14.8 | EAU | 2 | 12 | ROUTE | GSM | Non | Non |
| 3 | Cilaos Stade (Base Vie 2) | 72.8 | BASE_VIE | 12 | 55 | ROUTE | GSM | Oui | Oui |
| 4 | Marla (Cirque de Mafate) | 86.7 | COMPLET | 5 | 30 | HELICO | SATELLITE | Oui | Non |

*Note : Si la colonne `Actions` est présente (par exemple après un copier-coller du tableau), elle est automatiquement ignorée sans provoquer d'erreur.*

---

## 🛠️ Stack Technique
- **Framework :** React 19 + TypeScript + Vite
- **Styles :** Tailwind CSS v4 + Lucide Icons + Google Fonts
- **Cartographie :** Leaflet.js + OpenStreetMap (tuiles CartoDB Voyager)
- **Calcul Altimétrique & Pacing :** Canvas 2D natif + Modèle de Minetti
- **Traitement de Données :** SheetJS (`xlsx`) + XML DOMParser
- **Animations & Polish :** canvas-confetti

---

## 📄 Licence
Projet open-source développé pour la communauté des directeurs de course et passionnés d'ultra-trail.
