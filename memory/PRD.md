# ImovLocal - Product Requirements Document

## Problema Original
Portal imobiliário para o estado de Mato Grosso do Sul (Brasil), permitindo que particulares, corretores e imobiliárias anunciem imóveis para venda, aluguel e temporada.

## Personas
- **Particulares:** Pessoas físicas querendo anunciar 1 imóvel
- **Corretores:** Profissionais com CRECI querendo anunciar até 50 imóveis
- **Imobiliárias:** Empresas querendo anunciar até 150 imóveis
- **Administradores:** Gerenciam usuários, pagamentos e conteúdo

## Requisitos Core

### Sistema de Usuários
- Registro com validação de email em tempo real
- Tipos: particular, corretor, imobiliária, admin, admin_senior
- Status: pending (novo), active (pagou), paused, inactive
- Novos usuários ficam com status `pending` até pagamento aprovado

### Sistema de Pagamentos PIX
- Planos: Particular Trimestral (R$47,90), Corretor Trimestral (R$197,90), Imobiliária Anual (R$497,90)
- Fluxo: Selecionar plano → Gerar PIX → Enviar comprovante → Admin aprova → Conta ativada
- Limites de anúncios por plano: Particular (1), Corretor (50), Imobiliária (150)

### Sistema de Imóveis
- CRUD completo de propriedades
- Até 20 fotos por anúncio
- Filtros por cidade, tipo, preço, finalidade
- Cidade via dropdown (API IBGE por estado)

### Sistema de Notificações
- Notificação para admin apenas quando pagamento é realizado (comprovante enviado)
- Notificação para usuário quando pagamento aprovado/rejeitado
- Notificação de plano expirando/expirado

---

## O Que Foi Implementado

### 22/01/2025
- [x] Importação do projeto do GitHub
- [x] Correção do fluxo de registro (status pending)
- [x] Re-implementação completa do sistema PIX
- [x] Páginas: Planos, Checkout, AdminPagamentos
- [x] Limites de anúncios por plano
- [x] Validação de email em tempo real (domínio DNS)
- [x] Dropdown de cidades via API IBGE
- [x] Máscara de moeda brasileira nos formulários
- [x] Limpeza do banco de dados
- [x] Criação do admin de produção (imovlocaladm@gmail.com)
- [x] SEO básico (meta tags)
- [x] Footer com informações corretas de contato
- [x] Remoção de notificação de novos cadastros (apenas pagamento)
- [x] Logo completa no rodapé
- [x] Mensagem de isenção de responsabilidade no rodapé
- [x] Bug fix: IPTU não exibe valor falso quando não cadastrado
- [x] **Sistema de Expiração Automática (APScheduler)** - verifica diariamente às 6:00 AM
- [x] **SECRET_KEY segura** - chave forte de 64 bytes gerada
- [x] Bug fix: Ano de Construção não exibe valor falso (2020) quando não cadastrado
- [x] Bug fix: Campos do imóvel só exibem quando realmente cadastrados
- [x] Correção de nomenclatura de perfis (Corretor/Imobiliária/Particular)
- [x] SEO completo atualizado (título, description, Open Graph, Twitter Cards)

---

## Backlog Priorizado

### P0 - Crítico
- [x] ~~**Sistema de Expiração Automática:** Implementar APScheduler para verificar planos vencidos diariamente~~ ✅
- [x] ~~**Segurança:** Alterar SECRET_KEY padrão para chave forte~~ ✅
- [x] ~~**Migração Cloudinary:** Migrar todas as imagens locais para Cloudinary~~ ✅ (03/02/2025)
- [x] ~~**CORS:** Configurar para restringir ao domínio de produção~~ ✅ (03/02/2025)

### P1 - Importante
- [x] ~~**Sistema de Recuperação de Senha:** Via código de 6 dígitos por email~~ ✅
- [ ] **Teste E2E Completo:** Fluxo registro → pagamento → aprovação → anúncio
- [x] ~~**Emails Transacionais:** Templates prontos para boas-vindas, pagamento aprovado, plano expirando~~ ✅ (03/02/2025)

### P2 - Melhorias
- [x] ~~**SEO Avançado:** Sitemap dinâmico, Schema.org JSON-LD~~ ✅ (03/02/2025)
- [x] ~~**Refatoração:** Criar notification_routes.py dedicado~~ ✅ (03/02/2025)
- [x] ~~**Compressão de Imagens:** Otimização automática no Cloudinary (thumbnails, resize)~~ ✅ (03/02/2025)

---

## Credenciais de Produção

**Admin Master:**
- Email: imovlocaladm@gmail.com
- Senha: 96113045Ro@

**Banco de Dados:** test_database (MongoDB)

---

## Arquitetura

```
/app/
├── backend/         # FastAPI
│   ├── routes/      
│   │   ├── auth_routes.py
│   │   ├── property_routes.py
│   │   ├── payment_routes.py
│   │   ├── visit_routes.py
│   │   ├── banner_routes.py
│   │   ├── notification_routes.py  # NOVO - Refatorado
│   │   ├── seo_routes.py           # NOVO - SEO dinâmico
│   │   ├── cloudinary_routes.py
│   │   └── password_routes.py
│   ├── utils/       # email_validator.py
│   ├── middlewares/ # admin_middleware.py
│   ├── database.py
│   ├── models.py
│   ├── scheduler.py # APScheduler para expiração de planos
│   ├── server.py    # Inclui script de startup para admin
│   └── migrate_to_cloudinary.py  # Script de migração (já executado)
├── frontend/        # React + Tailwind
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── context/
│   └── public/
└── uploads/         # DEPRECATED - agora usa Cloudinary
```

## Integrações
- **Cloudinary:** Armazenamento permanente de imagens (cloud_name: dwlvgs9a3)
- **Resend:** Envio de emails para recuperação de senha
- **API IBGE Cidades:** Para dropdown de cidades por estado
- **dnspython:** Validação de domínio de email
- **APScheduler:** Jobs em background (expiração de planos)

---

## Changelog

### 03/02/2025 - Melhorias P0 e P2
- [x] **CORS para produção** - Restrito a: imovlocal.com.br, www.imovlocal.com.br, localhost:3000
- [x] **SEO Avançado:**
  - Sitemap dinâmico em `/api/seo/sitemap.xml` (atualiza automaticamente com novos imóveis)
  - Schema.org JSON-LD nas páginas de imóveis (RealEstateListing)
  - Robots.txt atualizado
- [x] **Compressão de Imagens:**
  - Upload com `quality: auto:good` e limite de 1920px de largura
  - Thumbnails gerados automaticamente (400x300, 800x600)
- [x] **Refatoração:**
  - Criado `notification_routes.py` com funções centralizadas
  - Templates de email para: boas-vindas, pagamento aprovado, plano expirando
- [x] **Migração Cloudinary** - Todas as 27 imagens migradas com sucesso
