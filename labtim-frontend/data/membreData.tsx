// data/membersData.ts

// Make sure your Publication and Member types match those in MemberProfile.tsx if you use them here
interface Publication {
    title: string;
    authors: string;
    journal: string;
    doi: string;
}

interface Member {
    name: string;
    image: string;
    title: string;
    email: string;
    phone: string;
    biography: string;
    researchInterests: string[];
    publications: Publication[];
    researchCenters: { name: string; address: string; link: string }[];
}


export const kokouAdjaileData: Member = {
  name: 'Kokou Adjaile',
  image: '/images/kokou-adjaile-profile.jpg', // Ensure you have this image in your public directory
  title: 'Professeur agrégé',
  email: 'kokou.adjaile@inrs.ca',
  phone: '418 654-2510',
  biography: `Kokou Adjallé a précédemment travaillé comme agent de recherche pour la Chaire de recherche industrielle en environnement et biotechnologie (CRIEB) à l’Institut d’Innovations en Écomatériaux, Écoproduits et Écoénergies (I2E3) à base de biomasse (ex Centre de recherche sur les matériaux lignocellulosiques – CRML) de l’Université du Québec à Trois-Rivières (UQTR). Il a aussi été chargé de cours à l’UQTR, chargé de projet chez Innofibre (Centre collégial de transfert technologique – CCTT à Trois-Rivières). Il est actuellement professeur associé à l’Université de Sherbrooke et conseiller scientifique externe pour la Ville de Victoriaville.`, // cite: image_6dea4e.png
  researchInterests: [ // cite: image_6dea50.jpg
    'Valorisation des résidus lignocellulosiques (agricoles et forestiers) dans un concept de bioraffinage en biocarburants (bioéthanol, biodiesel, biométhane, etc.), et matériaux biosourcés (colles, résines et mousse d’isolation thermique/acoustique) à base de lignine et de tanins.'
  ],
  publications: [ // cite: image_6dea4e.png
    {
      authors: 'Brodeur, Daphné, Deschamps, Marie-Hélène, Vandenberg, Grant W., Barnabé, Simon, Gómez, D., Déry, M. A., Vaneeckhaute, Céline et Adjallé, Kokou (2024).',
      title: 'Integration of pretreated crop residues to improve the valorization of biogas digestate by the Black Soldier Fly (Hermetia illucens L; Diptera: Stratiomyidae) larvae. Waste and Biomass Valorization, 15 (5): 2671-2685.',
      journal: 'Waste and Biomass Valorization, 15 (5): 2671-2685.',
      doi: '10.1007/s12649-023-02340-z'
    },
    {
      authors: 'Konan, Delon, Ndao, Adama, Koffi, Ekoun, Ekoun, Said, Robert, Matthieu, Rodrigue, Denis et Adjallé, Kokou (2024).',
      title: 'Biodecomposition with Phanerochaete chrysosporium: A review. AIMS Microbiology, 10 (4): 1068-1101.',
      journal: 'AIMS Microbiology, 10 (4): 1068-1101.',
      doi: '10.3934/microbiol.2024046'
    },
    {
        authors: 'Konan, Delon, Rodrigue, Denis, Koffi, Ekoun, Ekoun, Said, Ndao, Adama et Adjallé, Kokou (2024).',
        title: 'Combination of technologies for biomass pretreatment: A focus on extrusion. Waste and Biomass Valorization, 15 (8): 4519-4540.',
        journal: 'Waste and Biomass Valorization, 15 (8): 4519-4540.',
        doi: '10.1007/s12649-024-02472-w'
    },
    {
        authors: 'Bermani, Ghita, Ndao, Adama, Konan, Delon, Brassard, Patrick, Le Roux, Étienne, Godbout, Stéphane et Adjallé, Kokou (2023).',
        title: 'Valorisation of cranberry residues through pyrolysis and membrane filtration for the production of value-added agricultural products. Énergies, 16 (23) : Art. 7774.',
        journal: 'Énergies, 16 (23) : Art. 7774.',
        doi: '10.3390/en16237774'
    },
    {
        authors: 'Eslami, Zahra, Elkoun, Said, Robert, Matthieu et Adjallé, Kokou (2023).',
        title: 'A review of the effect of plasticizers on the physical and mechanical properties of alginate-based films. Molecules, 28 (18) : 6637.',
        journal: 'Molecules, 28 (18) : 6637.',
        doi: '10.3390/molecules28186637'
    },
    {
        authors: 'Ndao, Adama et Adjallé, Kokou (2023).',
        title: 'Overview of the biotransformation of limonene and α-pinene from wood and citrus residues by microorganisms. Waste, 1 (4) : 841–859.',
        journal: 'Waste, 1 (4) : 841–859.',
        doi: '10.3390/waste1040049'
    },
    {
        authors: 'Konan D, Koffi E, Ndao A, Peterson EC, Rodrigue D et Adjallé K (2022).',
        title: 'An overview of extrusion as a pretreatment method of lignocellulosic biomass. Énergies, 15(9) : 3002.',
        journal: 'Énergies, 15(9) : 3002.',
        doi: '10.3390/en15093002'
    },
  ],
  researchCenters: [ // cite: image_6dea50.jpg
    {
      name: 'Centre Eau Terre Environnement',
      address: '490, rue de la Couronne\nQuébec (Québec) G1K 9A9\nCanada',
      link: 'https://www.inrs.ca/centre/eau-terre-environnement/' // Example link, adjust as needed
    }
  ]
};

// You can add more member data here as needed
// export const otherMemberData: Member = { ... };