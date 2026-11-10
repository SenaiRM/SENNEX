💊 SENNEX

Aplicativo de gerenciamento de medicamentos e saúde pessoal, desenvolvido com React + Vite.


📱 Funcionalidades


Autenticação — cadastro, login e recuperação de senha
Dashboard — resumo diário com total de medicamentos, doses tomadas e pendentes
Medicamentos — cadastro, edição e exclusão com dias da semana e dosagem
Registro de Doses — confirmação de medicamentos tomados com histórico por dia
Preferências Médicas — restrições alimentares, alergias e condições médicas
Notificações — histórico de alertas e confirmações de doses
Meu Perfil — edição de dados pessoais e troca de senha
Minha Ficha (PDF) — exportação dos dados do paciente em PDF

🗃 Estrutura do Projeto

src/
├── app/
│   ├── components/
│   │   ├── auth/          # Login, Cadastro, Recuperação de senha
│   │   ├── dashboard/     # Tela principal com resumo do dia
│   │   ├── medications/   # Gerenciamento de medicamentos
│   │   ├── notifications/ # Histórico de notificações
│   │   ├── pdf/           # Geração de ficha em PDF
│   │   ├── preferences/   # Preferências médicas
│   │   ├── profile/       # Perfil do usuário
│   │   ├── layout/        # Sidebar e layout geral
│   │   └── ui/            # Componentes reutilizáveis (Card, Button, Input...)
│   └── context/
│       └── AuthContext.tsx
└── main.tsx


📄 Licença

Este projeto foi desenvolvido para uso pessoal e educacional.

[Sennex-RafaelC-EduardaN-WellyssonG-KauanP-GabrielA.docx](https://github.com/user-attachments/files/28813859/Sennex-RafaelC-EduardaN-WellyssonG-KauanP-GabrielA.docx)
