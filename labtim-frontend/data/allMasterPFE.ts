// data/allMasterSIs.ts

// Define the type for a Master/PFE item
export interface MasterPFE {
  id: string;
  title: string;
  author: string;
  year: number;
  summary: string;
  type: 'Master' | 'PFE'; // New: Type of Master/PFE
  etablissement: string; // New: Establishment name
  specialite: string; // New: Specialty
  encadrant: string; // New: Supervisor name
  membres: string[]; // New: Array of committee members
}

export const allMasterPFEs: MasterPFE[] = [
  {
    id: '1',
    title: 'Conception et implémentation d\'un système de surveillance à base d\'IoT pour la qualité de l\'air',
    author: 'Ahmed Gharbi',
    year: 2024,
    summary: 'Ce projet de fin d\'études (PFE) se concentre sur le développement d\'un réseau de capteurs intelligents connectés pour mesurer et analyser en temps réel la qualité de l\'air dans des environnements urbains, contribuant ainsi à la santé publique.',
    type: 'PFE',
    etablissement: 'École Nationale d\'Ingénieurs de Sfax (ENIS)',
    specialite: 'Génie Électronique et IoT',
    encadrant: 'Dr. Fatma Bouzid',
    membres: ['Prof. Ali Sassi', 'M. Sami Trabelsi'],
  },
  {
    id: '2',
    title: 'Application de l\'apprentissage profond pour la détection des anomalies dans les radiographies pulmonaires',
    author: 'Sarrah Jaber',
    year: 2023,
    summary: 'Mémoire de Master explorant l\'utilisation de réseaux neuronaux convolutifs (CNN) pour automatiser et améliorer la précision du diagnostic des maladies pulmonaires (ex: pneumonie, tuberculose) à partir d\'images radiographiques, réduisant la charge de travail des radiologues.',
    type: 'Master',
    etablissement: 'Faculté des Sciences de Tunis',
    specialite: 'Informatique et Intelligence Artificielle',
    encadrant: 'Prof. Mohamed Ben Ali',
    membres: ['Dr. Nadia Saidi', 'Dr. Ramzi Khalfaoui'],
  },
  {
    id: '3',
    title: 'Développement d\'un prototype de bras robotique pour l\'assistance chirurgicale mini-invasive',
    author: 'Youssef Said',
    year: 2024,
    summary: 'PFE visant à concevoir un bras robotique compact et précis pour assister les chirurgiens lors d\'opérations complexes, améliorant la dextérité et minimisant l\'invasivité pour le patient.',
    type: 'PFE',
    etablissement: 'Institut Supérieur des Études Technologiques de Sousse',
    specialite: 'Génie Mécanique et Robotique',
    encadrant: 'Dr. Hichem Ben Hmida',
    membres: ['Prof. Leïla Gharbi', 'M. Karim Jemal'],
  },
  {
    id: '4',
    title: 'Étude comparative des techniques de fusion d\'images multimodales en neuro-imagerie',
    author: 'Amira Chahed',
    year: 2022,
    summary: 'Ce Master compare différentes approches algorithmiques pour fusionner des images IRM et TEP du cerveau, afin d\'obtenir une vue plus complète et informative pour le diagnostic et la planification thérapeutique des maladies neurologiques.',
    type: 'Master',
    etablissement: 'École Nationale d\'Ingénieurs de Tunis (ENIT)',
    specialite: 'Traitement d\'Images et Signal',
    encadrant: 'Prof. Sami Mejri',
    membres: ['Dr. Amina Ben Hassen', 'Dr. Fethi Ayari'],
  },
  {
    id: '5',
    title: 'Implémentation d\'un système de reconnaissance faciale basé sur le Deep Learning pour la sécurité',
    author: 'Omar Belhaj',
    year: 2023,
    summary: 'PFE axé sur la construction d\'un système robuste de reconnaissance faciale, utilisant des architectures de Deep Learning pour des applications de sécurité et d\'authentification dans divers contextes.',
    type: 'PFE',
    etablissement: 'Institut Supérieur d\'Informatique de Tunis (ISI)',
    specialite: 'Sécurité Informatique et IA',
    encadrant: 'Dr. Rania Bouhlel',
    membres: ['Prof. Zouhair Kallel', 'M. Nizar Dhaouadi'],
  },
  {
    id: '6',
    title: 'Analyse des données massives de santé pour l\'identification des facteurs de risque de maladies chroniques',
    author: 'Nour Mbarek',
    year: 2024,
    summary: 'Master de recherche visant à exploiter les Big Data issues des dossiers médicaux électroniques pour découvrir des corrélations et des facteurs de risque cachés pour des maladies comme le diabète et les maladies cardiovasculaires, en vue de stratégies de prévention personnalisées.',
    type: 'Master',
    etablissement: 'Université Centrale (privée)',
    specialite: 'Science des Données en Santé',
    encadrant: 'Prof. Souhir Ben Said',
    membres: ['Dr. Hassen Jemai', 'Dr. Nadia Khouja'],
  },
];
