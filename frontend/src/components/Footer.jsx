import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Instagram, Mail, Phone, MapPin, MessageCircle } from 'lucide-react';

const Footer = () => {
  // Links das redes sociais
  const socialLinks = {
    facebook: "https://www.facebook.com/share/1DwRJv17bF/",
    instagram: "https://www.instagram.com/imovlocal?utm_source=qr&igsh=MXNzcjQ3cnFlaGdnaQ==",
    whatsapp: "https://wa.me/5567982288883?text=Olá! Vim pelo site ImovLocal e gostaria de mais informações.",
    email: "mailto:imovlocaladm@gmail.com"
  };

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 mb-8">
          {/* Institucional */}
          <div>
            <h3 className="text-white font-bold text-sm md:text-lg mb-3 md:mb-4">Institucional</h3>
            <ul className="space-y-1 md:space-y-2 text-xs md:text-sm">
              <li><Link to="/" className="hover:text-red-400 transition-colors">Página inicial</Link></li>
              <li><Link to="/cadastro" className="hover:text-red-400 transition-colors">Cadastre-se</Link></li>
              <li><Link to="/login" className="hover:text-red-400 transition-colors">Área administrativa</Link></li>
              <li><Link to="/planos" className="hover:text-red-400 transition-colors">Planos e Preços</Link></li>
            </ul>
          </div>

          {/* Imóveis */}
          <div>
            <h3 className="text-white font-bold text-sm md:text-lg mb-3 md:mb-4">Imóveis</h3>
            <ul className="space-y-1 md:space-y-2 text-xs md:text-sm">
              <li><Link to="/destaques" className="hover:text-red-400 transition-colors">Destaques</Link></li>
              <li><Link to="/lancamentos" className="hover:text-red-400 transition-colors">Lançamentos</Link></li>
              <li><Link to="/busca-detalhada" className="hover:text-red-400 transition-colors">Busca detalhada</Link></li>
              <li><Link to="/solicitar" className="hover:text-red-400 transition-colors">Solicite um imóvel</Link></li>
            </ul>
          </div>

          {/* Anuncie */}
          <div>
            <h3 className="text-white font-bold text-sm md:text-lg mb-3 md:mb-4">Anuncie</h3>
            <ul className="space-y-1 md:space-y-2 text-xs md:text-sm">
              <li><Link to="/anunciar" className="hover:text-red-400 transition-colors">Anunciar imóveis</Link></li>
              <li><Link to="/busca-mapa" className="hover:text-red-400 transition-colors">Buscar no mapa</Link></li>
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
                <a href="tel:+5567982288883" className="hover:text-red-400 transition-colors">
                  (67) 98228-8883
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Mail size={14} className="flex-shrink-0" />
                <a href={socialLinks.email} className="hover:text-red-400 transition-colors">
                  imovlocaladm@gmail.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Social Media */}
        <div className="border-t border-gray-700 pt-6 md:pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-center md:text-left">
              <h4 className="text-white font-semibold mb-3 text-sm md:text-base">Acompanhe o ImovLocal</h4>
              <div className="flex gap-4 justify-center md:justify-start">
                <a 
                  href={socialLinks.facebook}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-blue-500 transition-colors p-2 bg-gray-800 rounded-full hover:bg-gray-700"
                  title="Facebook"
                >
                  <Facebook size={20} className="md:w-6 md:h-6" />
                </a>
                <a 
                  href={socialLinks.instagram}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-pink-500 transition-colors p-2 bg-gray-800 rounded-full hover:bg-gray-700"
                  title="Instagram"
                >
                  <Instagram size={20} className="md:w-6 md:h-6" />
                </a>
                <a 
                  href={socialLinks.whatsapp}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-green-500 transition-colors p-2 bg-gray-800 rounded-full hover:bg-gray-700"
                  title="WhatsApp"
                >
                  <MessageCircle size={20} className="md:w-6 md:h-6" />
                </a>
                <a 
                  href={socialLinks.email}
                  className="hover:text-red-400 transition-colors p-2 bg-gray-800 rounded-full hover:bg-gray-700"
                  title="Email"
                >
                  <Mail size={20} className="md:w-6 md:h-6" />
                </a>
              </div>
            </div>

            <div className="text-center md:text-right">
              <div className="flex items-center justify-center md:justify-end">
                <img 
                  src="/assets/images/logo/icone-footer.png" 
                  alt="ImovLocal"
                  className="h-12 w-12 md:h-16 md:w-16 hover:scale-110 transition-transform duration-300"
                  data-testid="logo-footer"
                />
              </div>
              <p className="text-xs md:text-sm text-gray-400 mt-2">Seu imóvel aqui</p>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-gray-700 mt-6 md:mt-8 pt-4 md:pt-6 text-center">
          <p className="text-xs md:text-sm text-gray-400">
            © 2025 IMOVLOCAL - Seu imóvel aqui - Todos os direitos reservados
          </p>
          {/* Mensagem Legal - Responsabilidade dos Anunciantes */}
          <p className="text-xs text-gray-500 mt-3 max-w-4xl mx-auto leading-relaxed">
            As informações dos imóveis anunciados neste portal são de inteira responsabilidade dos anunciantes. 
            O ImovLocal não se responsabiliza pela veracidade das informações, valores, disponibilidade ou 
            condições dos imóveis anunciados. Recomendamos que os interessados verifiquem todas as informações 
            diretamente com os anunciantes antes de qualquer negociação.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
