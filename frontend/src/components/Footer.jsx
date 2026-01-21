import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Instagram, Mail, Phone, MapPin } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  // Função para abrir WhatsApp
  const openWhatsApp = () => {
    window.open('https://wa.me/5567998288883', '_blank');
  };

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="container mx-auto px-4 py-6 md:py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
          {/* Logo e Descrição */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-3 md:mb-4">
              <div className="bg-red-600 text-white p-1.5 md:p-2 rounded-lg">
                <span className="font-bold text-sm md:text-xl">iL</span>
              </div>
              <span className="text-white font-bold text-base md:text-xl">ImovLocal</span>
            </Link>
            <p className="text-xs md:text-sm text-gray-400 mb-3 md:mb-4">
              A melhor plataforma para encontrar seu imóvel ideal em Mato Grosso do Sul.
            </p>
            <div className="flex gap-3 md:gap-4">
              <a 
                href="https://www.facebook.com/share/1A42i6CAL4/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-gray-800 p-1.5 md:p-2 rounded-full hover:bg-blue-600 transition-colors"
                aria-label="Facebook"
              >
                <Facebook size={16} className="md:w-5 md:h-5" />
              </a>
              <a 
                href="https://www.instagram.com/imovlocal" 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-gray-800 p-1.5 md:p-2 rounded-full hover:bg-pink-600 transition-colors"
                aria-label="Instagram"
              >
                <Instagram size={16} className="md:w-5 md:h-5" />
              </a>
            </div>
          </div>

          {/* Links Rápidos */}
          <div>
            <h3 className="text-white font-bold text-sm md:text-lg mb-3 md:mb-4">Links</h3>
            <ul className="space-y-1 md:space-y-2 text-xs md:text-sm">
              <li><Link to="/" className="hover:text-red-400 transition-colors">Início</Link></li>
              <li><Link to="/busca-detalhada" className="hover:text-red-400 transition-colors">Buscar Imóveis</Link></li>
              <li><Link to="/destaques" className="hover:text-red-400 transition-colors">Destaques</Link></li>
              <li><Link to="/lancamentos" className="hover:text-red-400 transition-colors">Lançamentos</Link></li>
              <li><Link to="/planos" className="hover:text-red-400 transition-colors">Planos</Link></li>
            </ul>
          </div>

          {/* Tipos de Imóveis */}
          <div>
            <h3 className="text-white font-bold text-sm md:text-lg mb-3 md:mb-4">Imóveis</h3>
            <ul className="space-y-1 md:space-y-2 text-xs md:text-sm">
              <li><Link to="/busca-detalhada?purpose=VENDA" className="hover:text-red-400 transition-colors">Comprar</Link></li>
              <li><Link to="/busca-detalhada?purpose=ALUGUEL" className="hover:text-red-400 transition-colors">Alugar</Link></li>
              <li><Link to="/busca-detalhada?purpose=TEMPORADA" className="hover:text-red-400 transition-colors">Temporada</Link></li>
              <li><Link to="/anunciar" className="hover:text-red-400 transition-colors">Anunciar</Link></li>
            </ul>
          </div>

          {/* Contato */}
          <div>
            <h3 className="text-white font-bold text-sm md:text-lg mb-3 md:mb-4">Contato</h3>
            <ul className="space-y-1 md:space-y-2 text-xs md:text-sm">
              <li className="flex items-center gap-2">
                <MapPin size={14} className="flex-shrink-0" />
                <span>Campo Grande, MS</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone size={14} className="flex-shrink-0" />
                <button 
                  onClick={openWhatsApp}
                  className="hover:text-green-400 transition-colors flex items-center gap-1"
                >
                  (67) 98288-8883
                </button>
              </li>
              <li className="flex items-center gap-2">
                <Mail size={14} className="flex-shrink-0" />
                <a href="mailto:imovlocaladm@gmail.com" className="hover:text-red-400 transition-colors">imovlocaladm@gmail.com</a>
              </li>
            </ul>
            {/* Botão WhatsApp */}
            <button 
              onClick={openWhatsApp}
              className="mt-3 bg-green-600 hover:bg-green-700 text-white text-xs md:text-sm px-3 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z"/>
              </svg>
              WhatsApp
            </button>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-gray-800 mt-6 md:mt-8 pt-4 md:pt-6 text-center text-xs md:text-sm">
          <p>&copy; {currentYear} ImovLocal. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
