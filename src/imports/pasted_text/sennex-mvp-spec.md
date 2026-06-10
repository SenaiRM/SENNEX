Crie um MVP (Produto Mínimo Viável) de um sistema web/app responsivo chamado **SENNEX**, focado em gerenciamento de usuários, medicamentos e notificações de saúde. O sistema deve possuir interface moderna, intuitiva, minimalista e responsiva para dispositivos móveis e desktop.

O objetivo do MVP é validar as funcionalidades principais do sistema com foco em:

* Cadastro e gerenciamento de usuários.
* Recuperação de senha.
* Gerenciamento de medicamentos.
* Controle de preferências.
* Notificações de medicação.
* Geração de ficha em PDF.

O projeto deve priorizar simplicidade, usabilidade e clareza visual, evitando funcionalidades excessivamente complexas.

---

## DIRETRIZES DO MVP

O MVP deve conter apenas funcionalidades essenciais para validação do produto.

Priorizar:

* Interface limpa e intuitiva.
* Fluxos simples.
* Navegação rápida.
* Estrutura organizada.
* Componentes reutilizáveis.

Não criar:

* Integrações reais com APIs externas.
* Sistema complexo de autenticação.
* Banco de dados real obrigatório.
* Funcionalidades fora do escopo descrito.

Pode utilizar:

* Dados mockados/simulados.
* Armazenamento local.
* Simulação de notificações.
* Simulação de geração de PDF.

---

## REQUISITOS NÃO FUNCIONAIS OBRIGATÓRIOS

O sistema deve:

* Possuir interface intuitiva.
* Utilizar botões grandes e fáceis de tocar.
* Ser compatível com Android, iOS e desktop.
* Demonstrar proteção de dados do usuário.
* Simular autenticação segura.
* Ser totalmente responsivo.
* Ter aparência moderna e profissional.
* Funcionar de forma contínua durante uso da aplicação.
* Priorizar acessibilidade e legibilidade.

---

## ESTILO VISUAL

Criar um design inspirado em aplicativos modernos de saúde:

* Tons claros e suaves.
* Cards organizados.
* Bordas arredondadas.
* Ícones modernos.
* Navegação simples.
* Layout clean.
* Componentes minimalistas.
* Feedback visual de sucesso e erro.
* Animações suaves e discretas.

---

## TELAS DO MVP

---

2. LOGIN E AUTENTICAÇÃO
   Criar:

* Tela de Login.
* Tela de Cadastro.
* Tela de Recuperação de Senha.
* Tela de Redefinição de Senha.

Regras obrigatórias:

* Validar e-mail.
* Validar senha mínima de 8 caracteres.
* Validar campos obrigatórios.
* Impedir e-mails duplicados.
* Exibir mensagens de erro e sucesso.

Mensagens obrigatórias:

* “Usuário cadastrado com sucesso”
* “Preencha todos os campos obrigatórios”
* “O e-mail informado já está cadastrado”
* “A senha deve conter no mínimo 8 caracteres”
* “Instruções para recuperação de senha enviadas para o e-mail informado”
* “E-mail não encontrado”
* “Senha redefinida com sucesso”

---

3. DASHBOARD PRINCIPAL
   Após login, criar dashboard simples contendo:

* Saudação ao usuário.
* Próximos medicamentos.
* Resumo rápido.
* Cards de informações.
* Área de notificações recentes.

Não é necessário implementar gráficos complexos.

---

4. GERENCIAMENTO DE USUÁRIOS
   Criar tela para:

* Cadastrar usuário.
* Editar usuário.
* Visualizar usuários.
* Ativar/Inativar usuário.
* Pesquisar por nome ou e-mail.

A listagem deve exibir:

* Nome.
* Perfil.
* Status.

Mensagens obrigatórias:

* “Usuário atualizado com sucesso”
* “Usuário inativado com sucesso”
* “Usuário ativado com sucesso”
* “Nenhum usuário encontrado”

Adicionar confirmação antes de inativar usuários.

---

5. FICHA DO USUÁRIO
   Criar sistema simples de ficha contendo:

* Nome.
* Sobrenome.
* E-mail.

Funcionalidades:

* Criar ficha automaticamente após cadastro.
* Visualizar ficha.
* Editar ficha.
* Excluir ficha.

Mensagens:

* “Ficha não encontrada”
* “Dados atualizados com sucesso”

---

6. PREFERÊNCIAS
   Criar tela de preferências contendo:

* Configurações básicas.
* Preferências de notificações.
* Botão para restaurar padrão.

Mensagens:

* “Preferências atualizadas com sucesso”
* “Preferências restauradas para o padrão”

---

7. MEDICAMENTOS
   Criar módulo simples para:

* Cadastrar medicamento.
* Visualizar medicamentos.
* Editar medicamento.
* Excluir medicamento.

Cada medicamento deve conter:

* Nome.
* Dosagem.
* Tipo.
* Horário.

Mensagens:

* “Medicamento atualizado com sucesso”
* “Preencha todos os campos obrigatórios”

Utilizar cards simples e organizados.

---

8. NOTIFICAÇÕES
   Criar sistema simples de notificações:

* Alertas de horário.
* Medicamento em atraso.
* Confirmação de medicamento tomado.

Mensagem obrigatória:

* “Medicamento em atraso”

As notificações podem ser simuladas visualmente.

---

9. GERAÇÃO DE PDF
   Criar funcionalidade básica para:

* Gerar ficha do paciente em PDF.
* Permitir download do arquivo.
* Exibir prévia simples.

O PDF deve conter:

* Dados do usuário.
* Medicamentos.
* Preferências.
* Histórico básico.

Mensagem obrigatória:

* “Não há dados para gerar o PDF”

---

## TECNOLOGIAS SUGERIDAS

Utilizar tecnologias modernas para MVP:

* React, Next.js ou Vue.
* Tailwind CSS ou CSS moderno.
* Componentização.
* Dados simulados/localStorage.
* Estrutura preparada para futura API.

---

## IMPORTANTE

A IA deve gerar:

* Interface fiel aos requisitos funcionais.
* Fluxos básicos funcionando.
* Estrutura organizada e limpa.
* Navegação funcional entre telas.
* Responsividade mobile e desktop.
* Código simples e escalável.
* MVP enxuto, funcional e apresentável.
* Apenas funcionalidades essenciais para validação do produto.