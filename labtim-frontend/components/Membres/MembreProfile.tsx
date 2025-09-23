'use client';

import React from 'react';
import Image from 'next/image';
import { Inter } from 'next/font/google';
import { ExternalLink, Info, Mail, Phone, GraduationCap, Target, Lightbulb, MapPin, Calendar } from 'lucide-react';
import { User } from '@/types/index';

const inter = Inter({ subsets: ['latin'] });

interface MembreProfileProps {
  member: User;
}

const avatarPlaceholder = '/images/avatar-placeholder.png';

const MembreProfile = ({ member }: MembreProfileProps) => {
  if (!member) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-6 bg-gray-200 rounded-full flex items-center justify-center">
            <Info className="w-8 h-8 text-gray-500" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Membre introuvable</h2>
          <p className="text-gray-600">Aucune information disponible pour ce profil.</p>
        </div>
      </div>
    );
  }

  const memberImage = member.image || avatarPlaceholder;

  return (
    <div className={`min-h-screen bg-white ${inter.className}`}>
      
      {/* Header Section */}
      <div className="w-full border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            
            {/* Profile Image */}
            <div className="mb-8">
              <img
                src={memberImage}
                alt={member.name || 'Member'}
                className="w-32 h-32 sm:w-64 sm:h-64 object-cover rounded-full mx-auto shadow-lg border-4 border-white"
              />
            </div>
            
            {/* Name */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              {member.name || 'Nom Inconnu'}
            </h1>
            
            <div className="w-20 h-0.5 bg-gray-300 mx-auto mb-8"></div>
            
            {/* ORCID */}
            {member.orcid && (
              <div className="mb-8">
                <a
                  href={`https://orcid.org/${member.orcid}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200 font-medium border border-gray-200 shadow-sm"
                >
                  <Image src="/images/orcid_logo.png" alt="ORCID Logo" width={20} height={20}/>
                  ORCID Profile
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            )}
            
            {/* Contact Information */}
            {(member.phone || member.email) && (
              <div className="flex flex-col sm:flex-row items-center justify-center gap-8 pt-8 border-t border-gray-200">
                {member.email && (
                  <a
                    href={`mailto:${member.email}`}
                    className="flex items-center gap-3 text-gray-600 hover:text-gray-900 transition-colors duration-200"
                  >
                    <Mail className="w-5 h-5" />
                    <span className="font-medium text-lg">{member.email}</span>
                  </a>
                )}
                {member.phone && (
                  <div className="flex items-center gap-3 text-gray-600">
                    <Phone className="w-5 h-5" />
                    <span className="font-medium text-lg">{member.phone}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content Sections */}
      <div className="w-full">
        
        {/* Biography Section */}
        {member.biography && (
          <section className="w-full py-8">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center gap-4 mb-8">
                <Info className="w-7 h-7 text-gray-600" />
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Biographie</h2>
              </div>
              <div className="prose prose-lg max-w-none">
                <p className="text-gray-700 text-lg leading-relaxed">{member.biography}</p>
              </div>
            </div>
          </section>
        )}

        {/* Expertises Section */}
        {member.expertises && member.expertises.length > 0 && (
          <section className="w-full py-8">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center gap-4 mb-8">
                <Lightbulb className="w-7 h-7 text-gray-600" />
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Domaines d'Expertise</h2>
              </div>
              <div className="space-y-4">
                {member.expertises.map((expertise, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-gray-800 text-lg leading-relaxed">{expertise}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Research Interests Section */}
        {member.researchInterests && member.researchInterests.length > 0 && (
          <section className="w-full py-8">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center gap-4 mb-8">
                <Target className="w-7 h-7 text-gray-600" />
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Intérêts de Recherche</h2>
              </div>
              <div className="space-y-4">
                {member.researchInterests.map((interest, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-gray-800 text-lg leading-relaxed">{interest}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Education Section */}
        {Array.isArray(member.universityEducation) &&
          member.universityEducation.filter(
            edu => edu && (edu.degree || edu.institution || edu.year)
          ).length > 0 && (
            <section className="w-full py-8">
              <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center gap-4 mb-8">
                  <GraduationCap className="w-7 h-7 text-gray-600" />
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Formation Universitaire</h2>
                </div>
                <div className="space-y-8">
                  {member.universityEducation.filter(
                    edu => edu && (edu.degree || edu.institution || edu.year)
                  ).map((edu, index, arr) => (
                    <div key={index} className="relative">
                      <div className="flex items-start gap-6">
                        <div className="flex-shrink-0 mt-2">
                          <div className="w-4 h-4 bg-gray-400 rounded-full"></div>
                          {index < arr.length - 1 && (
                            <div className="w-0.5 h-20 bg-gray-200 ml-1.5 mt-4"></div>
                          )}
                        </div>
                        <div className="flex-1 pb-8">
                          <h3 className="font-bold text-xl sm:text-2xl text-gray-900 mb-3">{edu.degree}</h3>
                          <div className="flex items-center gap-2 text-gray-600 mb-4">
                            <MapPin className="w-5 h-5" />
                            <span className="font-medium text-lg">{edu.institution}</span>
                          </div>
                          <div className="inline-flex items-center gap-2 bg-white text-gray-700 px-4 py-2 rounded-lg font-medium border border-gray-200">
                            <Calendar className="w-4 h-4" />
                            {edu.year}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
        )}
      </div>
    </div>
  );
};

export default MembreProfile;
