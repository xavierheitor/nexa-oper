PAGINACAO NAO ESTA FUNCIONANDO OK

IMPLEMENTAR FILTRO DE BASE ATUAL

FILTRO TEXTUAL DE ELETRICISTAS PRA ALOCAR NO ASSISTENTE DA ESCALA NO SLOTS DA TELA PERIODOS DA ESCALA,
APARECER A QUANTIDADE DE DIAS QUE TEMOS EM ESCALA,
E NAO A QUANTIDADE DE SLOTS,
POR QUE SLOTS APARECE 93,
MAS FIZEMOS ESVALAS PRA 1 MES SO TRAVAR DISMISS DO MODAL,
ENQUANTO ESTIVER PROCESSANDO,
OU SE POSSIVEL CONTINUAR PROCESSANDO VERIFICAR ALTERACOES DOS ELETRICISTAS DA ESCALA ANTES DE PUBLICAR,
POSSO QUERER REMOVER,
OU REALOCAR UM ELETRICISTAS


🟡 CATEGORIA 2: DOCUMENTAÇÃO INCONSISTENTE (MÉDIA PRIORIDADE)
Problema: Apenas alguns arquivos têm documentação JSDoc completa no header.
1.  Adicionar header de documentação em escala-equipe-periodo/page.tsx
Atualmente tem documentação básica
Expandir seguindo padrão de apr-modelo/page.tsx
1.  Adicionar header de documentação em equipe/page.tsx
Arquivo sem documentação header
Adicionar seção de FUNCIONALIDADES, COMPONENTES UTILIZADOS, etc
1.  Adicionar header de documentação em veiculo/page.tsx
Arquivo sem documentação header
Documentar funcionalidades de transferência de base
1.  Adicionar header de documentação em eletricista/page.tsx
Arquivo sem documentação header
Documentar funcionalidades de transferência e cadastro em lote
1.  Adicionar header de documentação em cargo/page.tsx
Arquivo sem documentação header
Seguir padrão estabelecido
1.  Adicionar header de documentação em contrato/page.tsx
Arquivo sem documentação header
Documentar funcionalidade básica de CRUD
1.  Adicionar header de documentação em base/page.tsx
Arquivo sem documentação header
Seguir padrão estabelecido
1.  Adicionar header de documentação em tipo-veiculo/page.tsx
Arquivo sem documentação header
Seguir padrão estabelecido
1.  Adicionar header de documentação em tipo-equipe/page.tsx
Arquivo sem documentação header
Seguir padrão estabelecido
1.  Adicionar header de documentação em supervisor/page.tsx
Arquivo sem documentação header
Seguir padrão estabelecido
1.  Adicionar documentação JSDoc em cargo/form.tsx
Atualmente sem documentação
Seguir padrão de apr-pergunta/form.tsx com JSDoc completo
1.  Adicionar documentação JSDoc em base/form.tsx
Seguir padrão de documentação completa
1.  Adicionar documentação JSDoc em veiculo/form.tsx
Seguir padrão de documentação completa
1.  Adicionar documentação JSDoc em equipe/form.tsx
Seguir padrão de documentação completa
1.  Adicionar documentação JSDoc em supervisor/form.tsx
Seguir padrão de documentação completa
🟢 CATEGORIA 3: FILTROS DE TABELA INCONSISTENTES (BAIXA PRIORIDADE)
Problema: Algumas colunas usam filtros de texto quando deveriam usar filtros de select.
1.  Revisar filtros na página contrato/page.tsx
Verificar se há campos relacionados que deveriam usar select
1.  Revisar filtros na página base/page.tsx
Adicionar filtros de select quando aplicável
1.  Revisar filtros na página cargo/page.tsx
Adicionar filtros quando aplicável
1.  Revisar filtros na página tipo-escala/page.tsx
Padronizar filtros de campos relacionados
1.  Revisar filtros na página supervisor/page.tsx
Adicionar filtros de contrato se aplicável
🔵 CATEGORIA 4: ESTRUTURA DE ARQUIVOS (BAIXA PRIORIDADE)
Problema: Services e Repositories de escala estão em subpasta, mas outros não.
1.  Avaliar criação de subpastas para organização
Considerar mover services relacionados para subpastas temáticas
Ex: services/cadastro/, services/escala/, services/checklist/, services/apr/
ATENÇÃO: Isso afetaria imports em toda aplicação
1.  Padronizar nomenclatura de ações em lote
createEletricistasLote vs createVeiculosLote vs createEquipesLote
Verificar consistência de plural
🟣 CATEGORIA 5: TRATAMENTO DE ERROS (BAIXA PRIORIDADE)
Problema: Algumas páginas usam <p style={{ color: 'red' }}> enquanto outras usam componentes do Ant Design.
1.  Padronizar tratamento de erro em veiculo/page.tsx
Substituir <p style={{ color: 'red' }}> por <Alert type="error">
1.  Padronizar tratamento de erro em eletricista/page.tsx
Substituir <p style={{ color: 'red' }}> por <Alert type="error">
1.  Padronizar tratamento de erro em base/page.tsx
Substituir <p style={{ color: 'red' }}> por <Alert type="error">
1.  Padronizar tratamento de erro em equipe/page.tsx
Verificar e padronizar
1.  Padronizar tratamento de erro em contrato/page.tsx
Verificar e padronizar
🟠 CATEGORIA 6: COMENTÁRIOS E CÓDIGO DUPLICADO (BAIXA PRIORIDADE)
1.  Remover comentários duplicados em equipe/page.tsx
2.  Revisar comentários excessivos em páginas com muita documentação inline
Algumas páginas têm comentários explicativos em CADA linha
Avaliar se todos são necessários ou se podem ser simplificados
📊 RESUMO ESTATÍSTICO
Total de tarefas: 44
Alta prioridade (message): 15 tarefas
Média prioridade (docs): 15 tarefas
Baixa prioridade (outros): 14 tarefas
🎯 RECOMENDAÇÃO DE EXECUÇÃO
Fase 1 (Crítico): Tarefas 1-15 (corrigir uso de message)
Fase 2 (Importante): Tarefas 16-30 (documentação)
Fase 3 (Melhorias): Tarefas 31-44 (refinamentos)
Me diga quais tarefas você quer que eu execute! Pode ser por número individual (ex: "execute 1, 3, 5") ou por categoria/faixa (ex: "execute todas da categoria 1" ou "execute tarefas 1-15").
