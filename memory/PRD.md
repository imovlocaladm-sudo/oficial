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

---

## Backlog Priorizado

### P0 - Crítico
- [ ] **Sistema de Expiração Automática:** Implementar APScheduler para verificar planos vencidos diariamente
- [ ] **Segurança:** Alterar SECRET_KEY padrão para chave forte
- [ ] **CORS:** Configurar para restringir ao domínio de produção

### P1 - Importante
- [ ] **Teste E2E Completo:** Fluxo registro → pagamento → aprovação → anúncio
- [ ] **Emails Transacionais:** Integrar Resend para notificações por email

### P2 - Melhorias
- [ ] **SEO Avançado:** sitemap.xml, dados estruturados Schema.org
- [ ] **Refatoração:** Mover notificações de visit_routes.py para notification_routes.py

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
│   ├── routes/      # auth, properties, payments, visits, notifications
│   ├── utils/       # email_validator.py
│   ├── middlewares/ # admin_middleware.py
│   ├── database.py
│   ├── models.py
│   └── server.py
├── frontend/        # React + Tailwind
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── context/
│   └── public/
└── uploads/         # Fotos de imóveis e comprovantes
```

## Integrações
- **API IBGE Cidades:** Para dropdown de cidades por estado
- **dnspython:** Validação de domínio de email
