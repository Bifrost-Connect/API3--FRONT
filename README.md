## SIVA Front-end - Sistema Integrado de Viaturas e Atendimentos ##

Interface web para registro de informações de viaturas e de serviços realizados em São José dos Campos, pela empresa IPEM-SP.

## Visão Geral

Interface web desenvolvida para a gestão operacional da frota. O foco principal é a rastreabilidade: desde a saída da viatura no pátio até o seu retorno, controlando quilometragem, níveis de combustível e estado de conservação.

## Estrutura do Projeto

Organização das pastas focada em modularização e facilidade de manutenção:

- **`/src/components`**: Componentes de interface (Tabelas, Modais de Cadastro, Inputs).
- **`/src/services`**: Integração com a API (Conexão com bancos Oracle SQL / MySQL).
- **`/src/pages`**: Telas principais (Gestão de Frota, Registro de Viagens, Dashboard).
- **`/src/assets`**: Identidade visual, logos do IPEM e ícones do sistema.
- **`/src/utils`**: Funções auxiliares (Validação de Placas, Formatação de KM e Datas).

## Funcionalidades do Sistema

- **Controle de Viaturas**: Cadastro técnico completo (Modelo, Ano, Renavam, Placa).
- **Check-out / Check-in**: Fluxo de saída e entrada de veículos com registro de condutor.
- **Alertas de Manutenção**: Notificações automáticas baseadas no hodômetro (troca de óleo, pneus).
- **Histórico de Movimentação**: Log detalhado de quem usou qual veículo e para qual destino.
- **Gestão de Condutores**: Controle de permissões e vínculo de motoristas.

## Tecnologias Utilizadas

| Camada | Tecnologia | Função |
| :--- | :--- | :--- |
| **Frontend** | React.js | Biblioteca principal de interface |
| **Linguagem** | JavaScript (JS) | Lógica de programação |
| **Estilização** | Tailwind CSS | Design responsivo e moderno |
| **Banco de Dados** | Oracle / MySQL | Armazenamento de dados transacionais |
| **Padronização** | Husky + Commitlint | Organização de mensagens de commit |

📊 Painel de Controle (Dashboard)
Estatísticas de Uso: Gráficos de consumo de combustível e eficiência da frota.

Histórico de Condutores: Rastreabilidade total de multas e ocorrências por motorista.
