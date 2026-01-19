import React from 'react';
import { MessageCircle } from 'lucide-react';
import { Button } from './ui/button';

/**
 * WhatsAppButton Component
 * 
 * Duas variantes:
 * - "icon": Apenas ícone (para cards)
 * - "full": Botão completo com texto (para página de detalhes)
 */
const WhatsAppButton = ({ 
  property, 
  ownerPhone, 
  variant = "full", 
  className = "" 
}) => {
  // Formata o número de telefone para o WhatsApp (remove caracteres especiais)
  const formatPhoneForWhatsApp = (phone) => {
    if (!phone) return null;
    // Remove tudo exceto números
    let cleaned = phone.replace(/\D/g, '');
    // Adiciona código do Brasil se não tiver
    if (cleaned.length === 11 || cleaned.length === 10) {
      cleaned = '55' + cleaned;
    }
    return cleaned;
  };

  // Gera a mensagem pré-formatada
  const generateMessage = () => {
    const purposeText = property.purpose === 'VENDA' ? 'comprar' : 'alugar';
    const code = property.id ? property.id.substring(0, 8) : '000000';
    
    const message = `Olá! 🏠

Vim pelo site ImovLocal e tenho interesse em ${purposeText} o seguinte imóvel:

📍 ${property.title}
📌 ${property.neighborhood} - ${property.city}/${property.state}
💰 R$ ${property.price?.toLocaleString('pt-BR')}
🔑 Código: #${code}

Gostaria de mais informações e, se possível, agendar uma visita.`;

    return encodeURIComponent(message);
  };

  // Abre o WhatsApp
  const handleWhatsAppClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const phone = formatPhoneForWhatsApp(ownerPhone || property.owner_phone);
    
    if (!phone) {
      alert('Número de WhatsApp não disponível para este anunciante.');
      return;
    }
    
    const message = generateMessage();
    const whatsappUrl = `https://wa.me/${phone}?text=${message}`;
    
    window.open(whatsappUrl, '_blank');
  };

  // Variante apenas ícone (para cards)
  if (variant === "icon") {
    return (
      <button
        onClick={handleWhatsAppClick}
        className={`p-2 rounded-full bg-green-500 hover:bg-green-600 text-white transition-all hover:scale-110 shadow-lg ${className}`}
        title="Contato via WhatsApp"
        data-testid="whatsapp-icon-button"
      >
        <MessageCircle size={18} fill="white" />
      </button>
    );
  }

  // Variante mini (ícone pequeno ao lado do preço)
  if (variant === "mini") {
    return (
      <button
        onClick={handleWhatsAppClick}
        className={`inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-500 hover:bg-green-600 text-white transition-all hover:scale-110 ${className}`}
        title="Contato via WhatsApp"
        data-testid="whatsapp-mini-button"
      >
        <MessageCircle size={16} fill="white" />
      </button>
    );
  }

  // Variante completa (para página de detalhes)
  return (
    <Button
      onClick={handleWhatsAppClick}
      className={`w-full bg-green-500 hover:bg-green-600 text-white font-semibold flex items-center justify-center gap-2 ${className}`}
      data-testid="whatsapp-full-button"
    >
      <MessageCircle size={20} fill="white" />
      Chamar no WhatsApp
    </Button>
  );
};

export default WhatsAppButton;
