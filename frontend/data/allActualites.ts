// data/allActualites.ts

export const allActualites = [
  {
    id: 'actu1',
    title: 'Conférence Annuelle sur les Avancées en Imagerie Médicale',
    image: 'https://images.pexels.com/photos/5926388/pexels-photo-5926388.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1', // Working image from internet
    date: '2025-05-15',
    category: 'Conférence',
    shortDescription: 'Découvrez les dernières innovations en imagerie médicale lors de notre conférence annuelle, réunissant experts et chercheurs du monde entier.',
    fullContent: [
      { type: 'paragraph', text: 'La conférence annuelle sur les avancées en imagerie médicale, tenue au centre de congrès de Monastir, a été un franc succès. Plus de 300 participants, incluant des radiologues, des ingénieurs biomédicaux et des chercheurs, ont assisté à des présentations de pointe sur des sujets tels que l\'IA en diagnostic, l\'imagerie moléculaire et les nouvelles modalités d\'IRM.' },
      { type: 'paragraph', text: 'Des démonstrations en direct de technologies émergentes ont également eu lieu, offrant une occasion unique d\'interagir avec les développeurs et de découvrir les outils qui façonneront l\'avenir de la médecine.' },
      { type: 'image', src: 'https://images.pexels.com/photos/3861966/pexels-photo-3861966.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1', alt: 'Participants à la conférence' }, // Working image from internet
      { type: 'paragraph', text: 'Un panel de discussion sur l\'éthique de l\'IA en imagerie a conclu l\'événement, soulignant l\'importance d\'une approche responsable dans l\'intégration de ces technologies.' },
    ],
  },
  {
    id: 'actu2',
    title: 'Formation Intensive en Traitement du Signal pour l\'Imagerie Biomédicale',
    image: 'https://images.pexels.com/photos/3771089/pexels-photo-3771089.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1', // Working image from internet
    date: '2025-04-22',
    category: 'Formation',
    shortDescription: 'Participez à notre formation pratique pour maîtriser les techniques avancées de traitement du signal appliquées à l\'imagerie biomédicale.',
    fullContent: [
      { type: 'paragraph', text: 'Notre formation intensive de trois jours a permis aux ingénieurs et aux doctorants d\'acquérir des compétences pratiques en traitement du signal. Les ateliers couvraient des thèmes variés, allant de la réduction du bruit dans les images IRM à l\'analyse des données EEG complexes.' },
      { type: 'paragraph', text: 'Les participants ont salué la qualité des formateurs et la pertinence des exercices pratiques, qui les ont directement aidés dans leurs projets de recherche en cours.' },
      { type: 'list', items: ['Théorie du filtrage et de la déconvolution', 'Application aux images IRM et échographiques', 'Utilisation de logiciels spécialisés (MATLAB, Python)'] },
    ],
  },
  {
    id: 'actu3',
    title: 'Inauguration du Nouveau Laboratoire de Bio-impression 3D',
    image: 'https://images.pexels.com/photos/5926394/pexels-photo-5926394.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1', // Working image from internet
    date: '2025-03-10',
    category: 'Laboratoire', // Changed from 'SHC' to 'Laboratoire'
    shortDescription: 'Notre laboratoire est fier d\'annoncer l\'ouverture de son nouveau centre dédié à la bio-impression 3D pour la médecine régénérative.',
    fullContent: [
      { type: 'paragraph', text: 'Le laboratoire de Biophysique a récemment inauguré son tout nouveau pôle de bio-impression 3D, une avancée majeure pour nos capacités de recherche en médecine régénérative. Ce laboratoire de pointe est équipé des dernières technologies permettant de fabriquer des tissus vivants et des organes complexes à partir de cellules et de biomatériaux.' },
      { type: 'paragraph', text: 'Cette initiative vise à accélérer la recherche sur les thérapies cellulaires et la création d\'organes pour la transplantation, offrant de nouvelles solutions pour les patients atteints de maladies chroniques ou de traumatismes graves.' },
      { type: 'quote', text: '« Cette plateforme représente un pas de géant dans notre quête de solutions innovantes pour la santé humaine. »', author: 'Prof. Mohamed Ben Ali, Directeur du Laboratoire' },
      { type: 'paragraph', text: 'Des projets de recherche sont déjà en cours, notamment sur la régénération du cartilage et la création de modèles hépatiques pour le criblage de médicaments.' },
    ],
  },
  {
    id: 'actu4',
    title: 'Avancées en Nanomatériaux pour la Santé', // Changed title as 'Publication' category is removed
    image: 'https://images.pexels.com/photos/5450654/pexels-photo-5450654.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1', // Working image from internet
    date: '2025-02-01',
    category: 'Laboratoire', // Changed from 'Publication' to 'Laboratoire'
    shortDescription: 'Une équipe de notre laboratoire a réalisé une avancée révolutionnaire sur l\'utilisation de nanoparticules en médecine.',
    fullContent: [
      { type: 'paragraph', text: 'Les travaux de l\'équipe du Dr. Leila Mansour sur les nanoparticules intelligentes ont montré une nouvelle approche pour cibler spécifiquement les cellules malades, minimisant les effets secondaires sur les tissus sains.' },
      { type: 'paragraph', text: 'Les résultats prometteurs de cette étude ouvrent de nouvelles perspectives pour le traitement des maladies et l\'amélioration de la qualité de vie des patients.' },
      { type: 'link', text: 'En savoir plus sur nos projets de recherche', href: 'https://example.com/laboratoire-research' }, // Generic link
    ],
  },
  {
    id: 'actu5',
    title: 'Visite d\'une Délégation Internationale pour la Collaboration Scientifique',
    image: 'https://images.pexels.com/photos/3861972/pexels-photo-3861972.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1', // Working image from internet
    date: '2025-01-20',
    category: 'Laboratoire',
    shortDescription: 'Accueillir une délégation de chercheurs de l\'Université de Tokyo pour explorer des pistes de collaboration future en bio-ingénierie.',
    fullContent: [
      { type: 'paragraph', text: 'Le laboratoire a eu l\'honneur de recevoir une délégation de l\'Université de Tokyo, menée par le Professeur Sato, expert en robotique médicale. Les discussions ont porté sur des projets de recherche conjoints dans les domaines des systèmes d\'assistance chirurgicale et de l\'ingénierie tissulaire.' },
      { type: 'paragraph', text: 'Cette visite renforce nos liens internationaux et ouvre la voie à des collaborations fructueuses qui promettent des avancées significatives dans le domaine de la santé.' },
      { type: 'image', src: 'https://images.pexels.com/photos/3861976/pexels-photo-3861976.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1', alt: 'Visite de la délégation Japonaise' }, // Working image from internet
    ],
  },
  {
    id: 'actu6',
    title: 'Atelier Pratique sur la Cybersécurité des Dispositifs Médicaux',
    image: 'https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1', // Working image from internet
    date: '2024-11-05',
    category: 'Formation',
    shortDescription: 'Un atelier interactif pour sensibiliser aux risques de cybersécurité des dispositifs médicaux connectés et aux bonnes pratiques de protection.',
    fullContent: [
      { type: 'paragraph', text: 'Face à la digitalisation croissante des dispositifs médicaux, un atelier sur la cybersécurité a été organisé pour nos chercheurs et ingénieurs. L\'événement a mis en lumière les vulnérabilités potentielles et les mesures de protection essentielles pour garantir la sécurité des données patients et le bon fonctionnement des équipements.' },
      { type: 'list', items: ['Identification des menaces courantes', 'Principes de conception sécurisée', 'Réglementations et conformité'] },
      { type: 'paragraph', text: 'Les participants ont eu l\'occasion de travailler sur des études de cas réelles et d\'échanger avec des experts en cybersécurité du secteur de la santé.' },
    ],
  },
  {
    id: 'actu7',
    title: 'Lancement du Projet de Recherche sur les Bio-capteurs Intelligents',
    image: 'https://images.pexels.com/photos/4033148/pexels-photo-4033148.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1', // Working image from internet
    date: '2024-10-10',
    category: 'Laboratoire',
    shortDescription: 'Début d\'un nouveau projet ambitieux visant à développer des bio-capteurs ultra-sensibles pour le diagnostic rapide des maladies infectieuses.',
    fullContent: [
      { type: 'paragraph', text: 'Le laboratoire est fier d\'annoncer le lancement d\'un projet de recherche novateur sur les bio-capteurs intelligents. Ce projet, financé par le Ministère de l\'Enseignement Supérieur et de la Recherche Scientifique, vise à créer des dispositifs capables de détecter des biomarqueurs de maladies infectieuses avec une rapidité et une précision inégalées.' },
      { type: 'paragraph', text: 'Ces capteurs portables pourraient révolutionner le diagnostic sur le lieu de soin et la surveillance des épidémies, en particulier dans les zones à ressources limitées.' },
      { type: 'image', src: 'https://images.pexels.com/photos/5926362/pexels-photo-5926362.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1', alt: 'Bio-capteurs intelligents' }, // Working image from internet
    ],
  },
  {
    id: 'actu8',
    title: 'Participation au Salon International de la Santé et du Numérique',
    image: 'https://images.pexels.com/photos/260689/pexels-photo-260689.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1', // Working image from internet
    date: '2024-09-18',
    category: 'Conférence',
    shortDescription: 'Notre laboratoire a présenté ses innovations lors du plus grand salon international dédié à la santé et au numérique à Paris.',
    fullContent: [
      { type: 'paragraph', text: 'Une délégation de nos chercheurs et ingénieurs a représenté le laboratoire au Salon International de la Santé et du Numérique (HealthTech Expo) à Paris. Nous avons eu l\'occasion de présenter nos derniers prototypes en matière de dispositifs médicaux connectés et de solutions d\'IA pour le diagnostic.' },
      { type: 'paragraph', text: 'L\'événement a été une excellente plateforme pour nouer des partenariats industriels et académiques, et pour positionner le laboratoire comme un acteur clé dans l\'écosystème de la santé numérique.' },
      { type: 'link', text: 'En savoir plus sur HealthTech Expo', href: 'https://example.com/healthtech-expo' },
    ],
  },
  {
    id: 'actu9',
    title: 'Recrutement de Doctorants et Post-doctorants pour l\'Année 2025',
    image: 'https://images.pexels.com/photos/3861958/pexels-photo-3861958.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1', // Working image from internet
    date: '2024-08-01',
    category: 'Laboratoire',
    shortDescription: 'Le laboratoire ouvre ses candidatures pour des postes de doctorants et post-doctorants dans divers domaines de la biophysique.',
    fullContent: [
      { type: 'paragraph', text: 'Dans le cadre de son expansion et de ses nouveaux projets de recherche, le Laboratoire de Biophysique lance une campagne de recrutement pour l\'année universitaire 2025. Nous recherchons des profils dynamiques et passionnés par la recherche, désireux de contribuer à des avancées scientifiques majeures.' },
      { type: 'list', items: ['Thèses en imagerie médicale et IA', 'Post-doctorats en nanotechnologies pour la santé', 'Projets en bio-ingénierie et modélisation'] },
      { type: 'paragraph', text: 'Les candidats intéressés sont invités à consulter les fiches de poste détaillées sur notre site web et à soumettre leur candidature avant le 30 septembre.' },
    ],
  },
  {
    id: 'actu10',
    title: 'Séminaire sur les Défis de la Recherche Translationnelle',
    image: 'https://images.pexels.com/photos/3861972/pexels-photo-3861972.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1', // Working image from internet
    date: '2024-07-15',
    category: 'Laboratoire',
    shortDescription: 'Un séminaire axé sur les défis et les opportunités de la recherche translationnelle, du laboratoire au chevet du patient.',
    fullContent: [
      { type: 'paragraph', text: 'Le laboratoire a organisé un séminaire enrichissant sur la recherche translationnelle, soulignant l\'importance de combler le fossé entre la découverte fondamentale et l\'application clinique. Des cliniciens, des chercheurs et des représentants de l\'industrie ont partagé leurs expériences et les meilleures pratiques pour accélérer le transfert des innovations en santé.' },
      { type: 'paragraph', text: 'Les discussions ont porté sur les modèles de collaboration efficaces, les obstacles réglementaires et les stratégies de financement pour les projets translationnels.' },
      { type: 'image', src: 'https://images.pexels.com/photos/5926394/pexels-photo-5926394.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1', alt: 'Séminaire sur la recherche translationnelle' }, // Working image from internet
    ],
  },
];
