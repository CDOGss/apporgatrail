const XLSX = require('xlsx')
const fs = require('fs')

const rows = [
  { 'N°': 1, 'Nom du Ravitaillement': 'Saint-Pierre (Départ Plage)', 'Distance (km)': 0.0, 'Type de Poste': 'DEPART', 'Pause 1er (min)': 0, 'Pause Dern. (min)': 0, 'Accès Véhicule': 'ROUTE', 'Couverture Réseau': 'GSM', 'Médical': 'Oui', 'Dortoir': 'Non' },
  { 'N°': 2, 'Nom du Ravitaillement': 'Domaine Vidot', 'Distance (km)': 14.8, 'Type de Poste': 'EAU', 'Pause 1er (min)': 2, 'Pause Dern. (min)': 12, 'Accès Véhicule': 'ROUTE', 'Couverture Réseau': 'GSM', 'Médical': 'Non', 'Dortoir': 'Non' },
  { 'N°': 3, 'Nom du Ravitaillement': 'Notre-Dame de la Paix', 'Distance (km)': 26.5, 'Type de Poste': 'COMPLET', 'Pause 1er (min)': 4, 'Pause Dern. (min)': 20, 'Accès Véhicule': 'ROUTE', 'Couverture Réseau': 'GSM', 'Médical': 'Oui', 'Dortoir': 'Non' },
  { 'N°': 4, 'Nom du Ravitaillement': 'Nez de Bœuf', 'Distance (km)': 41.2, 'Type de Poste': 'COMPLET', 'Pause 1er (min)': 3, 'Pause Dern. (min)': 25, 'Accès Véhicule': '4X4', 'Couverture Réseau': 'RADIO_VHF', 'Médical': 'Oui', 'Dortoir': 'Non' },
  { 'N°': 5, 'Nom du Ravitaillement': 'Mare à Boue (Base Vie 1)', 'Distance (km)': 52.6, 'Type de Poste': 'BASE_VIE', 'Pause 1er (min)': 8, 'Pause Dern. (min)': 45, 'Accès Véhicule': 'ROUTE', 'Couverture Réseau': 'GSM', 'Médical': 'Oui', 'Dortoir': 'Oui' },
  { 'N°': 6, 'Nom du Ravitaillement': 'Coteau Kerveguen', 'Distance (km)': 64.0, 'Type de Poste': 'EAU', 'Pause 1er (min)': 2, 'Pause Dern. (min)': 15, 'Accès Véhicule': 'PIETON', 'Couverture Réseau': 'RADIO_VHF', 'Médical': 'Non', 'Dortoir': 'Non' },
  { 'N°': 7, 'Nom du Ravitaillement': 'Cilaos Stade (Base Vie 2)', 'Distance (km)': 72.8, 'Type de Poste': 'BASE_VIE', 'Pause 1er (min)': 12, 'Pause Dern. (min)': 55, 'Accès Véhicule': 'ROUTE', 'Couverture Réseau': 'GSM', 'Médical': 'Oui', 'Dortoir': 'Oui' },
  { 'N°': 8, 'Nom du Ravitaillement': 'Col du Taïbit', 'Distance (km)': 82.3, 'Type de Poste': 'EAU', 'Pause 1er (min)': 2, 'Pause Dern. (min)': 15, 'Accès Véhicule': 'PIETON', 'Couverture Réseau': 'ZONE_BLANCHE', 'Médical': 'Non', 'Dortoir': 'Non' },
  { 'N°': 9, 'Nom du Ravitaillement': 'Marla (Cirque de Mafate)', 'Distance (km)': 86.7, 'Type de Poste': 'COMPLET', 'Pause 1er (min)': 5, 'Pause Dern. (min)': 30, 'Accès Véhicule': 'HELICO', 'Couverture Réseau': 'SATELLITE', 'Médical': 'Oui', 'Dortoir': 'Non' },
  { 'N°': 10, 'Nom du Ravitaillement': 'Plaine des Merles', 'Distance (km)': 95.1, 'Type de Poste': 'COMPLET', 'Pause 1er (min)': 3, 'Pause Dern. (min)': 20, 'Accès Véhicule': '4X4', 'Couverture Réseau': 'RADIO_VHF', 'Médical': 'Non', 'Dortoir': 'Non' },
  { 'N°': 11, 'Nom du Ravitaillement': 'Sentier Scout', 'Distance (km)': 104.5, 'Type de Poste': 'EAU', 'Pause 1er (min)': 2, 'Pause Dern. (min)': 15, 'Accès Véhicule': 'PIETON', 'Couverture Réseau': 'RADIO_VHF', 'Médical': 'Non', 'Dortoir': 'Non' },
  { 'N°': 12, 'Nom du Ravitaillement': 'Aurère (Ilet Mafate)', 'Distance (km)': 113.8, 'Type de Poste': 'COMPLET', 'Pause 1er (min)': 4, 'Pause Dern. (min)': 25, 'Accès Véhicule': 'HELICO', 'Couverture Réseau': 'SATELLITE', 'Médical': 'Oui', 'Dortoir': 'Non' },
  { 'N°': 13, 'Nom du Ravitaillement': 'Deux-Bras (Base Vie 3)', 'Distance (km)': 125.0, 'Type de Poste': 'BASE_VIE', 'Pause 1er (min)': 10, 'Pause Dern. (min)': 45, 'Accès Véhicule': '4X4', 'Couverture Réseau': 'GSM', 'Médical': 'Oui', 'Dortoir': 'Oui' },
  { 'N°': 14, 'Nom du Ravitaillement': "Dos d'Âne", 'Distance (km)': 131.8, 'Type de Poste': 'COMPLET', 'Pause 1er (min)': 4, 'Pause Dern. (min)': 25, 'Accès Véhicule': 'ROUTE', 'Couverture Réseau': 'GSM', 'Médical': 'Oui', 'Dortoir': 'Non' },
  { 'N°': 15, 'Nom du Ravitaillement': 'Halte-Là', 'Distance (km)': 140.4, 'Type de Poste': 'EAU', 'Pause 1er (min)': 2, 'Pause Dern. (min)': 15, 'Accès Véhicule': 'ROUTE', 'Couverture Réseau': 'GSM', 'Médical': 'Non', 'Dortoir': 'Non' },
  { 'N°': 16, 'Nom du Ravitaillement': 'La Possession (École)', 'Distance (km)': 147.2, 'Type de Poste': 'COMPLET', 'Pause 1er (min)': 4, 'Pause Dern. (min)': 25, 'Accès Véhicule': 'ROUTE', 'Couverture Réseau': 'GSM', 'Médical': 'Oui', 'Dortoir': 'Non' },
  { 'N°': 17, 'Nom du Ravitaillement': 'Grande Chaloupe', 'Distance (km)': 154.8, 'Type de Poste': 'COMPLET', 'Pause 1er (min)': 4, 'Pause Dern. (min)': 20, 'Accès Véhicule': 'ROUTE', 'Couverture Réseau': 'GSM', 'Médical': 'Oui', 'Dortoir': 'Non' },
  { 'N°': 18, 'Nom du Ravitaillement': 'Colorado', 'Distance (km)': 160.9, 'Type de Poste': 'EAU', 'Pause 1er (min)': 3, 'Pause Dern. (min)': 18, 'Accès Véhicule': 'ROUTE', 'Couverture Réseau': 'GSM', 'Médical': 'Non', 'Dortoir': 'Non' },
  { 'N°': 19, 'Nom du Ravitaillement': 'Stade La Redoute (Arrivée)', 'Distance (km)': 165.2, 'Type de Poste': 'ARRIVEE', 'Pause 1er (min)': 0, 'Pause Dern. (min)': 0, 'Accès Véhicule': 'ROUTE', 'Couverture Réseau': 'GSM', 'Médical': 'Oui', 'Dortoir': 'Oui' }
]

const ws = XLSX.utils.json_to_sheet(rows)
ws['!cols'] = [
  { wch: 6 },
  { wch: 32 },
  { wch: 15 },
  { wch: 15 },
  { wch: 16 },
  { wch: 18 },
  { wch: 16 },
  { wch: 20 },
  { wch: 10 },
  { wch: 10 }
]

const wb = XLSX.utils.book_new()
XLSX.utils.book_append_sheet(wb, ws, 'Ravitaillements')

// 1. Write to project root
XLSX.writeFile(wb, './OrgaTrail_Modele_Ravitaillements.xlsx')
console.log('Fichier cree : ./OrgaTrail_Modele_Ravitaillements.xlsx')

// 2. Ensure public folder exists and write there for direct browser static link
if (!fs.existsSync('./public')) {
  fs.mkdirSync('./public')
}
XLSX.writeFile(wb, './public/OrgaTrail_Modele_Ravitaillements.xlsx')
console.log('Fichier cree : ./public/OrgaTrail_Modele_Ravitaillements.xlsx')

// 3. Write CSV with UTF-8 BOM
const headers = ['N°', 'Nom du Ravitaillement', 'Distance (km)', 'Type de Poste', 'Pause 1er (min)', 'Pause Dern. (min)', 'Accès Véhicule', 'Couverture Réseau', 'Médical', 'Dortoir']
const csvLines = rows.map(r => [
  r['N°'],
  '"' + r['Nom du Ravitaillement'].replace(/"/g, '""') + '"',
  r['Distance (km)'],
  r['Type de Poste'],
  r['Pause 1er (min)'],
  r['Pause Dern. (min)'],
  r['Accès Véhicule'],
  r['Couverture Réseau'],
  r['Médical'],
  r['Dortoir']
].join(';'))

const csvContent = '\uFEFF' + [headers.join(';'), ...csvLines].join('\r\n')
fs.writeFileSync('./OrgaTrail_Modele_Ravitaillements.csv', csvContent, 'utf8')
fs.writeFileSync('./public/OrgaTrail_Modele_Ravitaillements.csv', csvContent, 'utf8')
console.log('Fichiers CSV crees a la racine et dans /public')
