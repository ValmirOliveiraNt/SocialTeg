# Dashboards e telemetria

As visões de cliente e administrador compartilham o componente `AnalyticsDashboard` e a API autenticada `GET /api/analytics?days=7|30|90&business_id=...`.

## Definições

- **Acesso**: registro de abertura da página de uma tag ativa com destino ativo. Não representa pessoa única, clique externo, avaliação publicada, conversão ou venda.
- **Período**: 7, 30 ou 90 dias de calendário, incluindo o dia atual, em America/Sao_Paulo (UTC−03). A comparação anterior termina no mesmo horário de corte, deslocado pelo número de dias selecionados.
- **Tags com movimento**: tags distintas com acesso no período, independentemente do status atual. Tags ativas e pendentes representam o estado atual do cadastro.
- **Receita**: soma do valor de pedidos criados no período, cujo pagamento atualmente está aprovado, excluindo pedidos cancelados. Não é receita recorrente, conciliação bancária nem receita pela data de liquidação. Ticket médio usa esses mesmos pedidos.
- **Origem**: NFC e QR são identificados pelo parâmetro explícito `src`. Um link sem esse parâmetro é origem não identificada. A atribuição identifica o link, não prova o uso físico do chip; links podem ser compartilhados.
- **Região**: informação aproximada da rede fornecida pelo Cloudflare, quando disponível. Nunca se preenche uma cidade ou país presumido.
- **Destino**: destino principal configurado na tag no momento do acesso. Não indica qual ação foi clicada em uma página com vários botões.

## Compatibilidade e precisão

Agregações são calculadas no D1 sobre todos os registros do período. A tabela recente mostra até 20 acessos e o ranking mostra até 10 tags; esses limites não reduzem os totais. O histórico individual legado continua limitado a 500 registros e exige sessão, com filtro obrigatório de proprietário para clientes.

Eventos novos incluem versão 2 no JSON já armazenado em `tag_scans.ip_hash`, usado pelo código anterior para metadados. O nome legado da coluna foi preservado para não exigir migração; nenhum endereço IP ou identificador persistente de visitante é coletado por esta alteração. Um UUID por abertura evita duplicação de requisições do mesmo evento. Recarregar a página constitui nova abertura.

Registros sem versão 2, inclusive clientes com frontend antigo em cache, são apresentados como **Legado / não verificado**. Não é possível recuperar retroativamente a origem que o sistema anterior presumiu como NFC. Tags NFC gravadas anteriormente sem `?src=nfc` precisam ser regravadas para ter origem identificada. Novas gravações usam esse parâmetro; os QR codes já utilizam `?src=qr`.

O painel atualiza a cada 60 segundos enquanto a aba está visível e permite atualização manual. Falhas são mostradas explicitamente. Não há promessa de entrega garantida da telemetria: bloqueio de rede ou encerramento do navegador ainda podem impedir um registro, embora as requisições usem `keepalive`.

## Segurança e publicação

A nova API e a leitura de scans validam sessão, expiração, status da conta e escopo no servidor. O administrador acessa agregações globais; o cliente acessa somente suas próprias tags. O filtro de estabelecimento afeta a telemetria; os indicadores financeiros e a base de clientes administrativos permanecem globais e são identificados assim na interface.

Publicar o frontend e as funções Cloudflare Pages juntos. Não há nova tabela, serviço ou variável de ambiente. O ambiente precisa das tabelas D1 já utilizadas pela aplicação, inclusive `sessions`. O código não executa migrações nem altera dados históricos. Outras APIs preexistentes não foram auditadas integralmente neste trabalho.

## Validação

Com Node.js 24 e as dependências instaladas: `npm run test:analytics`, `npm run typecheck` e `npm run build`.

Os testes executam os handlers reais contra SQLite em memória, cobrindo mais de 500 eventos, limites de data e ano, isolamento entre contas, filtros, ausência de dados, origem legada, receita, autenticação, deduplicação e detecção de navegador.
