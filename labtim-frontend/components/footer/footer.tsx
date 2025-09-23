import React from "react";

import {
  FaFacebookF,
  FaLinkedinIn,
  FaXTwitter,
  FaYoutube,
} from "react-icons/fa6";

const Footer: React.FC = () => {
  return (
    <footer className="bg-white text-gray-800 border-t">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid grid-cols-1 md:grid-cols-5 gap-8">
        {/* Logo & Offices */}
        <div className="md:col-span-2 space-y-4">
          {/* LABTIM Logo - Assuming this is part of the image and needs to be added */}
          <div className="mb-4">
            <img
              src="/images/labtim.png" // Path to your LABTIM logo image
              alt="LABTIM Logo"
              className="h-16" // Adjust size as needed to match the image
            />
          </div>
          <div className="space-y-2 text-sm text-gray-600">
            <p>Laboratoire de Biophysique , Faculté de Médecine de Monastir,</p>
            <p>Avenue Avicenne, 5019 Monastir Tunisie</p>
          </div>
          <div className="space-y-1 text-sm">
            <p>📞 +216 73 462 200</p>
            <p>📞 +216 73 460 737</p>
            <p>✉️ medhedi.bedoui@fmm.rnu.tn</p>
          </div>
        </div>

        {/* AI Services / Recherche */}
        <div>
          <h4 className="font-semibold mb-2 text-gray-700">Actualités</h4> {/* Changed title */}
          <ul className="space-y-1 text-sm text-gray-600">
            <li>
              <a href="/actualites?category=Formation" className="hover:underline">
              Formations
              </a>
            </li>
            <li>
              <a href="/actualites?category=Conférence" className="hover:underline">
              Conférences
              </a>
            </li>
            <li>
              <a href="/actualites?category=Laboratoire" className="hover:underline">
              Laboratoire
              </a>
            </li>
          </ul>
        </div>

        {/* Industry / Liens Rapides */}
        <div>
          <h4 className="font-semibold mb-2 text-gray-700">Liens Rapides</h4>
          <ul className="space-y-1 text-sm text-gray-600">
            <li>
              <a href="/publications" className="hover:underline">
              Publications
              </a>
            </li>
            <li>
              <a href="/theses" className="hover:underline">
              Thèses et HDR
              </a>
            </li>
            <li>
              <a href="/masters-stages" className="hover:underline">
              Masters et stages ingénieurs
              </a>
            </li>
          </ul>
        </div>

        {/* About / A Propos */}
        <div>
          <h4 className="font-semibold mb-2 text-gray-700">A Propos</h4>
          <ul className="space-y-1 text-sm text-gray-600">
            <li>
              <a href="/presentation" className="hover:underline">
              Présentation
              </a>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom */}
      <div className="border-t mt-4">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col md:flex-row justify-between items-center text-sm text-gray-500">
          <p>Copyright © {new Date().getFullYear()} by LABTIM</p>
          <div className="flex space-x-4 mt-2 md:mt-0">
            <a href="#" aria-label="Facebook"><FaFacebookF /></a>
            <a href="#" aria-label="LinkedIn"><FaLinkedinIn /></a>
            <a href="#" aria-label="X Twitter"><FaXTwitter /></a>
            <a href="#" aria-label="Youtube"><FaYoutube /></a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;