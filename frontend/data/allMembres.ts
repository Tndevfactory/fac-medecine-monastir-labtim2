// data/allMembers.ts

// Change interface name from 'member' to 'Member' (capital 'M')
export interface Member {
  id: number;
  name: string;
  title: string;
  image: string;
  hasStudentResearch: boolean;
  status: string;
  researchCenter: string;
  trainingOffer: string;
  researchSector: string;
  // Add the missing properties as indicated by the error
  email?: string; // Made optional for now, adjust based on your data
  phone?: string; // Made optional
  biography?: string; // Made optional
  researchInterests?: string[]; // Array of strings, optional
  publications?: string[]; // Array of strings, optional
  education?: string[]; // Array of strings, optional
}

const avatarPlaceholder = '/images/avatar-placeholder.png';

export const allMembers: Member[] = [
  {
    id: 1,
    name: 'Kokou Adjaile',
    title: 'Biotechnologies environnementales',
    image: avatarPlaceholder,
    hasStudentResearch: false,
    status: 'Adjoint, agrégé, titulaire',
    researchCenter: 'Centre A',
    trainingOffer: 'Formation 1',
    researchSector: 'Environnement',
    // Add sample data for new fields
    email: 'kokou.adjaile@example.com',
    phone: '+1234567890',
    biography: 'Professeur spécialisé en biotechnologies environnementales avec une expertise en dépollution des sols et des eaux.',
    researchInterests: ['Bioremediation', 'Water Treatment', 'Environmental Microbiology'],
    publications: ['Paper on Bioremediation 2023', 'Journal of Environmental Science 2022'],
    education: ['Ph.D. Environmental Engineering', 'M.Sc. Biotechnology']
  },
  {
    id: 2,
    name: 'Sofiene Aiffes',
    title: 'Communications sans fil',
    image: avatarPlaceholder,
    hasStudentResearch: false,
    status: 'Honoraire',
    researchCenter: 'Centre B',
    trainingOffer: 'Formation 2',
    researchSector: 'Télécommunications',
    email: 'sofiene.aiffes@example.com',
    phone: '+1987654321',
    biography: 'Expert en communications sans fil, notamment 5G et IoT.',
    researchInterests: ['5G Networks', 'IoT', 'Wireless Security'],
    publications: ['Wireless Communication Trends 2024', 'IoT Security Review 2023'],
    education: ['Ph.D. Telecommunications', 'M.Eng. Electronics']
  },
  {
    id: 3,
    name: 'Ahmed Ben Salah',
    title: 'Intelligence Artificielle',
    image: avatarPlaceholder,
    hasStudentResearch: true,
    status: 'Adjoint',
    researchCenter: 'Centre C',
    trainingOffer: 'Formation 3',
    researchSector: 'Informatique',
    email: 'ahmed.bensalah@example.com',
    phone: '+1122334455',
    biography: 'Spécialiste de l\'apprentissage automatique et de la vision par ordinateur.',
    researchInterests: ['Machine Learning', 'Computer Vision', 'Deep Learning'],
    publications: ['AI Applications in Health 2023', 'Advanced Machine Learning 2022'],
    education: ['Ph.D. Computer Science', 'M.Sc. Artificial Intelligence']
  },
  {
    id: 4,
    name: 'Fatma Zahra',
    title: 'Énergies Renouvelables',
    image: avatarPlaceholder,
    hasStudentResearch: false,
    status: 'Titulaire',
    researchCenter: 'Centre A',
    trainingOffer: 'Formation 1',
    researchSector: 'Énergie',
    email: 'fatma.zahra@example.com',
    phone: '+1555666777',
    biography: 'Recherches sur les systèmes photovoltaïques et l\'efficacité énergétique.',
    researchInterests: ['Solar Energy', 'Energy Efficiency', 'Sustainable Systems'],
    publications: ['Solar Panel Innovations 2024', 'Green Energy Solutions 2023'],
    education: ['Ph.D. Renewable Energy', 'M.Sc. Electrical Engineering']
  },
  {
    id: 5,
    name: 'Youssef Mansour',
    title: 'Physique des Matériaux',
    image: avatarPlaceholder,
    hasStudentResearch: true,
    status: 'Agrégé',
    researchCenter: 'Centre B',
    trainingOffer: 'Formation 2',
    researchSector: 'Matériaux',
    email: 'youssef.mansour@example.com',
    phone: '+1444333222',
    biography: 'Travaux sur les nanomatériaux et leurs applications.',
    researchInterests: ['Nanomaterials', 'Solid State Physics', 'Material Characterization'],
    publications: ['Advances in Nanomaterials 2023', 'Material Science Journal 2022'],
    education: ['Ph.D. Materials Physics', 'M.Sc. Applied Physics']
  },
  {
    id: 6,
    name: 'Nadia El Fassi',
    title: 'Chimie Organique',
    image: avatarPlaceholder,
    hasStudentResearch: false,
    status: 'Adjoint',
    researchCenter: 'Centre C',
    trainingOffer: 'Formation 3',
    researchSector: 'Chimie',
    email: 'nadia.elfassi@example.com',
    phone: '+1777888999',
    biography: 'Synthèse de composés organiques et chimie médicinale.',
    researchInterests: ['Organic Synthesis', 'Medicinal Chemistry', 'Catalysis'],
    publications: ['New Organic Compounds 2024', 'Pharmaceutical Chemistry 2023'],
    education: ['Ph.D. Organic Chemistry', 'M.Sc. Chemistry']
  },
  {
    id: 7,
    name: 'Omar Said',
    title: 'Génie Civil',
    image: avatarPlaceholder,
    hasStudentResearch: false,
    status: 'Titulaire',
    researchCenter: 'Centre A',
    trainingOffer: 'Formation 1',
    researchSector: 'Construction',
    email: 'omar.said@example.com',
    phone: '+1231231234',
    biography: 'Spécialisé dans la conception et l\'analyse des structures.',
    researchInterests: ['Structural Engineering', 'Concrete Technology', 'Seismic Design'],
    publications: ['Modern Civil Engineering 2023', 'Concrete Structures Handbook 2022'],
    education: ['Ph.D. Civil Engineering', 'M.Eng. Structural Engineering']
  },
  {
    id: 8,
    name: 'Laila Karim',
    title: 'Biologie Marine',
    image: avatarPlaceholder,
    hasStudentResearch: true,
    status: 'Honoraire',
    researchCenter: 'Centre B',
    trainingOffer: 'Formation 2',
    researchSector: 'Biologie',
    email: 'laila.karim@example.com',
    phone: '+1456456456',
    biography: 'Recherches sur les écosystèmes marins et la biodiversité.',
    researchInterests: ['Marine Ecology', 'Biodiversity', 'Oceanography'],
    publications: ['Marine Ecosystems of the Mediterranean 2024', 'Coastal Conservation 2023'],
    education: ['Ph.D. Marine Biology', 'M.Sc. Environmental Science']
  },
  {
    id: 9,
    name: 'Mounir Abid',
    title: 'Robotique et Automatisation',
    image: avatarPlaceholder,
    hasStudentResearch: false,
    status: 'Agrégé',
    researchCenter: 'Centre C',
    trainingOffer: 'Formation 3',
    researchSector: 'Robotique',
    email: 'mounir.abid@example.com',
    phone: '+1789789789',
    biography: 'Développeur de systèmes robotiques avancés pour l\'industrie.',
    researchInterests: ['Robotics', 'Automation', 'Control Systems'],
    publications: ['Industrial Robotics Handbook 2023', 'Autonomous Systems 2022'],
    education: ['Ph.D. Robotics', 'M.Eng. Mechatronics']
  },
  {
    id: 10,
    name: 'Samira Belhaj',
    title: 'Nanotechnologies',
    image: avatarPlaceholder,
    hasStudentResearch: false,
    status: 'Adjoint',
    researchCenter: 'Centre A',
    trainingOffer: 'Formation 1',
    researchSector: 'Nanotechnologies',
    email: 'samira.belhaj@example.com',
    phone: '+1999888777',
    biography: 'Recherches sur l\'application des nanotechnologies en médecine.',
    researchInterests: ['Nanomedicine', 'Drug Delivery', 'Bio-nanotechnology'],
    publications: ['Nanotechnology in Healthcare 2024', 'Advances in Nanomaterials 2023'],
    education: ['Ph.D. Nanotechnology', 'M.Sc. Materials Science']
  },
];