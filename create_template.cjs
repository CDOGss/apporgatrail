const XLSX = require('xlsx')
const fs = require('fs')

// Ultra Terrestre 2027 Official Aid Stations (24 stations, Champ de foire removed)
const rows = [
  { 'N°': 1, 'Nom du Ravitaillement': 'Stade de Basse Vallée (DÉPART)', 'Distance (km)': 0, 'Barrière Horaire': '', 'Type de Poste': 'DEPART', 'Pause 1er (min)': 0, 'Pause Dern. (min)': 0, 'Accès Véhicule': 'ROUTE', 'Couverture Réseau': 'GSM', 'Médical': 'Oui', 'Dortoir': 'Non' },
  { 'N°': 2, 'Nom du Ravitaillement': 'Camphrier', 'Distance (km)': 10.447, 'Barrière Horaire': '', 'Type de Poste': 'COMPLET', 'Pause 1er (min)': 2, 'Pause Dern. (min)': 12, 'Accès Véhicule': 'ROUTE', 'Couverture Réseau': 'GSM', 'Médical': 'Non', 'Dortoir': 'Non' },
  { 'N°': 3, 'Nom du Ravitaillement': 'Foc foc', 'Distance (km)': 25.021, 'Barrière Horaire': '', 'Type de Poste': 'COMPLET', 'Pause 1er (min)': 4, 'Pause Dern. (min)': 20, 'Accès Véhicule': 'ROUTE', 'Couverture Réseau': 'ZONE_BLANCHE', 'Médical': 'Oui', 'Dortoir': 'Non' },
  { 'N°': 4, 'Nom du Ravitaillement': 'Parking nez de boeuf', 'Distance (km)': 40.526, 'Barrière Horaire': '', 'Type de Poste': 'COMPLET', 'Pause 1er (min)': 3, 'Pause Dern. (min)': 25, 'Accès Véhicule': 'ROUTE', 'Couverture Réseau': 'GSM', 'Médical': 'Oui', 'Dortoir': 'Non' },
  { 'N°': 5, 'Nom du Ravitaillement': 'Horloge', 'Distance (km)': 54.474, 'Barrière Horaire': '', 'Type de Poste': 'COMPLET', 'Pause 1er (min)': 2, 'Pause Dern. (min)': 15, 'Accès Véhicule': 'ROUTE', 'Couverture Réseau': 'GSM', 'Médical': 'Non', 'Dortoir': 'Non' },
  { 'N°': 6, 'Nom du Ravitaillement': 'Gd bassin', 'Distance (km)': 58.672, 'Barrière Horaire': '', 'Type de Poste': 'COMPLET', 'Pause 1er (min)': 2, 'Pause Dern. (min)': 45, 'Accès Véhicule': 'HELICO', 'Couverture Réseau': 'GSM', 'Médical': 'Oui', 'Dortoir': 'Oui' },
  { 'N°': 7, 'Nom du Ravitaillement': 'Mare a boue', 'Distance (km)': 66.135, 'Barrière Horaire': '', 'Type de Poste': 'COMPLET', 'Pause 1er (min)': 2, 'Pause Dern. (min)': 15, 'Accès Véhicule': 'PIETON', 'Couverture Réseau': 'ZONE_BLANCHE', 'Médical': 'Non', 'Dortoir': 'Non' },
  { 'N°': 8, 'Nom du Ravitaillement': 'Parking marsoin', 'Distance (km)': 74.686, 'Barrière Horaire': '', 'Type de Poste': 'COMPLET', 'Pause 1er (min)': 5, 'Pause Dern. (min)': 30, 'Accès Véhicule': 'INTERDIT', 'Couverture Réseau': 'GSM', 'Médical': 'Oui', 'Dortoir': 'Non' },
  { 'N°': 9, 'Nom du Ravitaillement': 'Hell bourg', 'Distance (km)': 87.522, 'Barrière Horaire': '', 'Type de Poste': 'BASE_VIE', 'Pause 1er (min)': 3, 'Pause Dern. (min)': 20, 'Accès Véhicule': 'ROUTE', 'Couverture Réseau': 'GSM', 'Médical': 'Non', 'Dortoir': 'Non' },
  { 'N°': 10, 'Nom du Ravitaillement': 'Gite dufour 1', 'Distance (km)': 95.166, 'Barrière Horaire': '', 'Type de Poste': 'EAU', 'Pause 1er (min)': 2, 'Pause Dern. (min)': 10, 'Accès Véhicule': 'HELICO', 'Couverture Réseau': 'GSM', 'Médical': 'Non', 'Dortoir': 'Non' },
  { 'N°': 11, 'Nom du Ravitaillement': 'Sommet piton', 'Distance (km)': 98.214, 'Barrière Horaire': '', 'Type de Poste': 'EAU', 'Pause 1er (min)': 1, 'Pause Dern. (min)': 5, 'Accès Véhicule': 'HELICO', 'Couverture Réseau': 'GSM', 'Médical': 'Oui', 'Dortoir': 'Non' },
  { 'N°': 12, 'Nom du Ravitaillement': 'Gite dufour 2', 'Distance (km)': 101.27, 'Barrière Horaire': '', 'Type de Poste': 'EAU', 'Pause 1er (min)': 2, 'Pause Dern. (min)': 10, 'Accès Véhicule': 'HELICO', 'Couverture Réseau': 'GSM', 'Médical': 'Oui', 'Dortoir': 'Oui' },
  { 'N°': 13, 'Nom du Ravitaillement': 'Cilaos', 'Distance (km)': 110.811, 'Barrière Horaire': '', 'Type de Poste': 'BASE_VIE', 'Pause 1er (min)': 12, 'Pause Dern. (min)': 45, 'Accès Véhicule': 'ROUTE', 'Couverture Réseau': 'GSM', 'Médical': 'Oui', 'Dortoir': 'Non' },
  { 'N°': 14, 'Nom du Ravitaillement': 'Pied taibit', 'Distance (km)': 117.97, 'Barrière Horaire': '', 'Type de Poste': 'COMPLET', 'Pause 1er (min)': 2, 'Pause Dern. (min)': 15, 'Accès Véhicule': 'ROUTE', 'Couverture Réseau': 'GSM', 'Médical': 'Non', 'Dortoir': 'Non' },
  { 'N°': 15, 'Nom du Ravitaillement': 'Marla', 'Distance (km)': 124.134, 'Barrière Horaire': '', 'Type de Poste': 'COMPLET', 'Pause 1er (min)': 4, 'Pause Dern. (min)': 25, 'Accès Véhicule': 'HELICO', 'Couverture Réseau': 'GSM', 'Médical': 'Oui', 'Dortoir': 'Non' },
  { 'N°': 16, 'Nom du Ravitaillement': 'La nouvelle', 'Distance (km)': 130.827, 'Barrière Horaire': '', 'Type de Poste': 'COMPLET', 'Pause 1er (min)': 4, 'Pause Dern. (min)': 20, 'Accès Véhicule': 'HELICO', 'Couverture Réseau': 'GSM', 'Médical': 'Oui', 'Dortoir': 'Non' },
  { 'N°': 17, 'Nom du Ravitaillement': 'Roche plate', 'Distance (km)': 140.049, 'Barrière Horaire': '', 'Type de Poste': 'COMPLET', 'Pause 1er (min)': 3, 'Pause Dern. (min)': 18, 'Accès Véhicule': 'HELICO', 'Couverture Réseau': 'GSM', 'Médical': 'Non', 'Dortoir': 'Non' },
  { 'N°': 18, 'Nom du Ravitaillement': 'Maido', 'Distance (km)': 147.476, 'Barrière Horaire': '', 'Type de Poste': 'COMPLET', 'Pause 1er (min)': 0, 'Pause Dern. (min)': 25, 'Accès Véhicule': 'PIETON', 'Couverture Réseau': 'ZONE_BLANCHE', 'Médical': 'Oui', 'Dortoir': 'Oui' },
  { 'N°': 19, 'Nom du Ravitaillement': 'Tamarin', 'Distance (km)': 162.201, 'Barrière Horaire': '', 'Type de Poste': 'COMPLET', 'Pause 1er (min)': 2, 'Pause Dern. (min)': 5, 'Accès Véhicule': 'PIETON', 'Couverture Réseau': 'GSM', 'Médical': 'Oui', 'Dortoir': 'Oui' },
  { 'N°': 20, 'Nom du Ravitaillement': 'Piton oranger', 'Distance (km)': 172.308, 'Barrière Horaire': '', 'Type de Poste': 'COMPLET', 'Pause 1er (min)': 2, 'Pause Dern. (min)': 15, 'Accès Véhicule': 'PIETON', 'Couverture Réseau': 'GSM', 'Médical': 'Oui', 'Dortoir': 'Oui' },
  { 'N°': 21, 'Nom du Ravitaillement': 'Halte la', 'Distance (km)': 189.71, 'Barrière Horaire': '', 'Type de Poste': 'BASE_VIE', 'Pause 1er (min)': 10, 'Pause Dern. (min)': 55, 'Accès Véhicule': 'PIETON', 'Couverture Réseau': 'GSM', 'Médical': 'Non', 'Dortoir': 'Non' },
  { 'N°': 22, 'Nom du Ravitaillement': 'Cap noir', 'Distance (km)': 197.898, 'Barrière Horaire': '', 'Type de Poste': 'COMPLET', 'Pause 1er (min)': 3, 'Pause Dern. (min)': 10, 'Accès Véhicule': 'ROUTE', 'Couverture Réseau': 'GSM', 'Médical': 'Oui', 'Dortoir': 'Oui' },
  { 'N°': 23, 'Nom du Ravitaillement': 'Colorado', 'Distance (km)': 213.424, 'Barrière Horaire': '', 'Type de Poste': 'COMPLET', 'Pause 1er (min)': 3, 'Pause Dern. (min)': 15, 'Accès Véhicule': 'ROUTE', 'Couverture Réseau': 'GSM', 'Médical': 'Oui', 'Dortoir': 'Oui' },
  { 'N°': 24, 'Nom du Ravitaillement': 'La Redoute - Saint-Denis (ARRIVÉE)', 'Distance (km)': 220.341, 'Barrière Horaire': '', 'Type de Poste': 'COMPLET', 'Pause 1er (min)': 0, 'Pause Dern. (min)': 0, 'Accès Véhicule': 'ROUTE', 'Couverture Réseau': 'GSM', 'Médical': 'Non', 'Dortoir': 'Non' },
]

const ws = XLSX.utils.json_to_sheet(rows)
ws['!cols'] = [
  { wch: 6 },
  { wch: 34 },
  { wch: 15 },
  { wch: 18 },
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

// 2. Ensure public folder exists and write there for direct browser static link
if (!fs.existsSync('./public')) {
  fs.mkdirSync('./public')
}
if (!fs.existsSync('./public/files')) {
  fs.mkdirSync('./public/files', { recursive: true })
}
if (!fs.existsSync('./files')) {
  fs.mkdirSync('./files', { recursive: true })
}
XLSX.writeFile(wb, './files/OrgaTrail_Modele_Ravitaillements.xlsx')
XLSX.writeFile(wb, './public/OrgaTrail_Modele_Ravitaillements.xlsx')
XLSX.writeFile(wb, './public/files/OrgaTrail_Modele_Ravitaillements.xlsx')

// 3. Write CSV with UTF-8 BOM
const headers = ['N°', 'Nom du Ravitaillement', 'Distance (km)', 'Barrière Horaire', 'Type de Poste', 'Pause 1er (min)', 'Pause Dern. (min)', 'Accès Véhicule', 'Couverture Réseau', 'Médical', 'Dortoir']
const csvLines = rows.map(r => [
  r['N°'],
  '"' + r['Nom du Ravitaillement'].replace(/"/g, '""') + '"',
  r['Distance (km)'],
  '"' + (r['Barrière Horaire'] || '').replace(/"/g, '""') + '"',
  r['Type de Poste'],
  r['Pause 1er (min)'],
  r['Pause Dern. (min)'],
  r['Accès Véhicule'],
  r['Couverture Réseau'],
  r['Médical'],
  r['Dortoir']
].join(';'))

const csvContent = '\uFEFF' + [headers.join(';'), ...csvLines].join('\r\n')
fs.writeFileSync('./files/OrgaTrail_Modele_Ravitaillements.csv', csvContent, 'utf8')
fs.writeFileSync('./OrgaTrail_Modele_Ravitaillements.csv', csvContent, 'utf8')
fs.writeFileSync('./public/OrgaTrail_Modele_Ravitaillements.csv', csvContent, 'utf8')
fs.writeFileSync('./public/files/OrgaTrail_Modele_Ravitaillements.csv', csvContent, 'utf8')

console.log('Tous les fichiers Excel et CSV (24 postes) ont été créés et synchronisés.')
