// components/Membres/MembresList.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Inter } from 'next/font/google';
import { ChevronDown, Search } from 'lucide-react';
import Link from 'next/link';
import { getAllUsers } from '@/services/dashboardApi'; // Import the API service
import { User } from '@/types/index'; // Import the User type

const inter = Inter({ subsets: ['latin'] });

const avatarPlaceholder = '/images/avatar-placeholder.png';

const MembresList: React.FC = () => {
  const [members, setMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true); // Manage internal loading state
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilterDropdown, setActiveFilterDropdown] = useState<string | null>(null); // No default open

  const [selectedOccupation, setSelectedOccupation] = useState<string | null>(null);
  const [selectedResearchInterest, setSelectedResearchInterest] = useState<string | null>(null);

  // Fetch members on component mount
  useEffect(() => {
    const fetchMembers = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await getAllUsers(''); // Call the API with empty token for public access
        if (response.success && Array.isArray(response.data)) {
          setMembers(response.data);
        } else {
          setError(response.message || 'Failed to fetch members.');
          setMembers([]);
        }
      } catch (err: any) {
        console.error('Error fetching members:', err);
        setError(err.message || 'An unexpected error occurred while fetching members.');
        setMembers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, []); // Empty dependency array means it runs once on mount

  // Memoize unique options to prevent re-calculation on every render
  const occupationOptions = useMemo(() => {
    const occupations = new Set<string>();
    members.forEach(m => {
      if (m.position) { // Use 'position' field for occupation
        occupations.add(m.position);
      }
    });
    return Array.from(occupations).sort();
  }, [members]);

  const researchInterestsOptions = useMemo(() => {
    const interests = new Set<string>();
    members.forEach(m => {
      // Ensure m.researchInterests is an array before flatMapping
      if (Array.isArray(m.researchInterests)) {
        m.researchInterests.forEach(interest => interests.add(interest));
      }
    });
    return Array.from(interests).sort();
  }, [members]);

  // Filter members based on search term and selected filters
  const filteredMembers = useMemo(() => {
    return members.filter(member => {
      const matchesSearch = member.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            member.position?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (Array.isArray(member.expertises) && member.expertises.some(e => e.toLowerCase().includes(searchTerm.toLowerCase()))) ||
                            (Array.isArray(member.researchInterests) && member.researchInterests.some(ri => ri.toLowerCase().includes(searchTerm.toLowerCase())));
      
      const matchesOccupation = selectedOccupation ? member.position === selectedOccupation : true;

      const matchesResearchInterest = selectedResearchInterest
        ? Array.isArray(member.researchInterests) && member.researchInterests.includes(selectedResearchInterest)
        : true;

      return matchesSearch && matchesOccupation && matchesResearchInterest;
    });
  }, [members, searchTerm, selectedOccupation, selectedResearchInterest]);

  const totalPages = Math.ceil(filteredMembers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentMembers = filteredMembers.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const paginationNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);

  const toggleFilterDropdown = (dropdownName: string) => {
    setActiveFilterDropdown(activeFilterDropdown === dropdownName ? null : dropdownName);
  };

  if (loading) {
    return (
      <section className={`py-16 bg-white ${inter.className} flex justify-center items-center min-h-[50vh]`}>
        <div className="text-center text-gray-600 text-lg">Chargement des membres...</div>
      </section>
    );
  }

  if (error) {
    return (
      <section className={`py-16 bg-white ${inter.className} flex justify-center items-center min-h-[50vh]`}>
        <div className="text-center text-red-600 text-lg">Erreur: {error}</div>
      </section>
    );
  }

  return (
    <section className={`py-16 bg-white ${inter.className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">Membres</h2>

        {/* Search Bar */}
        <div className="mb-12 flex items-center justify-between border-b border-gray-200 pb-8">
          <div className="relative flex-grow max-w-lg">
            <input
              type="text"
              placeholder="Trouver un membre, une expertise"
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800 placeholder-gray-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Panel: Filters */}
          <div className="w-full lg:w-1/4 bg-white p-6 rounded-lg border border-gray-200 shadow-sm lg:sticky lg:top-20 lg:self-start">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">FILTRER PAR</h3>
            
            {/* Research Interests Filter */}
            <div className="mb-4">
              <button
                onClick={() => toggleFilterDropdown('researchInterests')}
                className="w-full flex justify-between items-center text-gray-700 hover:text-blue-600 font-medium py-2 border-b border-gray-200 focus:outline-none"
              >
                Intérêts de recherche
                <ChevronDown className={`h-5 w-5 transition-transform duration-200 ${activeFilterDropdown === 'researchInterests' ? 'rotate-180' : 'rotate-0'}`} />
              </button>
              {activeFilterDropdown === 'researchInterests' && (
                <div className="mt-2 space-y-2 text-sm">
                  {researchInterestsOptions.map(interest => (
                    <label key={interest} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="researchInterest"
                        value={interest}
                        checked={selectedResearchInterest === interest}
                        onChange={() => {
                          setSelectedResearchInterest(interest);
                          setCurrentPage(1); // Reset to first page on filter change
                        }}
                        className="form-radio text-blue-600 h-4 w-4"
                      />
                      <span>{interest}</span>
                    </label>
                  ))}
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="researchInterest"
                      value=""
                      checked={selectedResearchInterest === null}
                      onChange={() => {
                        setSelectedResearchInterest(null);
                        setCurrentPage(1); // Reset to first page on filter change
                      }}
                      className="form-radio text-blue-600 h-4 w-4"
                    />
                    <span>Tous les intérêts</span>
                  </label>
                </div>
              )}
            </div>

            {/* Occupation (Position) Filter */}
            <div className="mb-6">
              <button
                onClick={() => toggleFilterDropdown('occupation')}
                className="w-full flex justify-between items-center text-gray-700 hover:text-blue-600 font-medium py-2 border-b border-gray-200 focus:outline-none"
              >
                Occupation
                <ChevronDown className={`h-5 w-5 transition-transform duration-200 ${activeFilterDropdown === 'occupation' ? 'rotate-180' : 'rotate-0'}`} />
              </button>
              {activeFilterDropdown === 'occupation' && (
                <div className="mt-2 space-y-2 text-sm">
                  {occupationOptions.map(occupation => (
                    <label key={occupation} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="occupation"
                        value={occupation}
                        checked={selectedOccupation === occupation}
                        onChange={() => {
                          setSelectedOccupation(occupation);
                          setCurrentPage(1); // Reset to first page on filter change
                        }}
                        className="form-radio text-blue-600 h-4 w-4"
                      />
                      <span>{occupation}</span>
                    </label>
                  ))}
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="occupation"
                      value=""
                      checked={selectedOccupation === null}
                      onChange={() => {
                        setSelectedOccupation(null);
                        setCurrentPage(1); // Reset to first page on filter change
                      }}
                      className="form-radio text-blue-600 h-4 w-4"
                    />
                    <span>Toutes les occupations</span>
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* Right Panel: Members Grid */}
          <div className="w-full lg:w-3/4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {currentMembers.length > 0 ? (
                currentMembers.map((member) => (
                  <Link
                    key={member.id}
                    href={`/membres/${member.id}`}
                    className="group block bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden transform transition-transform duration-300 hover:scale-[1.02] hover:shadow-lg"
                  >
                    <div className="w-full h-48 md:h-60 relative overflow-hidden">
                      <img
                        src={member.image || avatarPlaceholder}
                        alt={member.name || 'Member'}
                        className="w-full h-full object-cover object-center transform transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                    <div className="p-4 text-center">
                      <h4 className="text-lg font-semibold text-gray-900 leading-tight mb-1 group-hover:text-blue-600 transition-colors duration-200">
                        {member.name}
                      </h4>
                      <p className="text-gray-600 text-sm">{member.position}</p>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="lg:col-span-3 text-center text-gray-600 text-lg py-12">
                  Aucun membre ne correspond à votre recherche.
                </div>
              )}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center space-x-2 mt-12">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  &larr; Précédent
                </button>
                {paginationNumbers.map((page) => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-4 py-2 border rounded-lg ${
                      currentPage === page
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                    } transition-colors duration-200`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  Suivant &rarr;
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default MembresList;
