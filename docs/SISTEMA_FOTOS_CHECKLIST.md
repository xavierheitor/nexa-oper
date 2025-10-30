# Sistema de Fotos de Checklist - Arquitetura

## 📸 Visão Geral

O sistema possui **DUAS tabelas de fotos** que trabalham em conjunto para gerenciar o fluxo completo desde o upload até a vinculação com pendências:

### 1. MobilePhoto (Tabela de Upload)
**Função**: Recebe fotos do app mobile
**Endpoint**: `POST /api/mobile/uploads/photos`
**Fluxo**: Upload → Armazenamento → Processamento

### 2. ChecklistRespostaFoto (Tabela de Sincronização)
**Função**: Armazena fotos vinculadas a pendências
**Sincronização**: Automática via `MobilePhotoUploadService`
**Fluxo**: Processamento → Vinculação → Consulta

---

## 🔄 Fluxo Completo

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. APP MOBILE ENVIA FOTO                                        │
│    POST /api/mobile/uploads/photos                              │
│    - file: binary                                               │
│    - turnoId: 123                                               │
│    - tipo: "checklistReprova"                                   │
│    - checklistUuid: "550e8400-..."                              │
│    - checklistPerguntaId: 456                                   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. MOBILEPHOTO SERViCE - Upload e Validação                     │
│    • Valida arquivo (tamanho, tipo MIME)                       │
│    • Calcula checksum SHA-256                                  │
│    • Verifica duplicatas                                       │
│    • Salva arquivo no disco                                    │
│    • Cria registro em MobilePhoto                              │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. PROCESSAMENTO PENDÊNCIA                                      │
│    MobilePhotoUploadService.processarFotoPendenciaComUuid()     │
│    • Busca ChecklistPreenchido por UUID                         │
│    • Busca ChecklistResposta por perguntaId                     │
│    • Busca ou cria ChecklistPendencia                           │
│    • Cria ChecklistRespostaFoto vinculada                       │
│    • Atualiza ChecklistResposta.aguardandoFoto                  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. VINCULAÇÃO COMPLETA                                          │
│    MobilePhoto → ChecklistRespostaFoto                          │
│    • Foto armazenada em duas tabelas                            │
│    • Metadados preservados                                      │
│    • Sincronização automática                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📊 Estrutura das Tabelas

### MobilePhoto (Upload Inicial)
```typescript
{
  id: Int,
  turnoId: Int,
  tipo: String,                    // "checklistReprova", "assinatura"
  checklistUuid: String?,          // UUID do checklist
  checklistPerguntaId: Int?,       // ID da pergunta
  fileName: String,
  mimeType: String,
  fileSize: Int,
  checksum: String,                // SHA-256 (idempotência)
  storagePath: String,
  url: String,
  capturedAt: DateTime,
  // Auditoria...
}
```

### ChecklistRespostaFoto (Sincronização)
```typescript
{
  id: Int,
  checklistRespostaId: Int,        // FK para ChecklistResposta
  checklistPendenciaId: Int?,      // FK para ChecklistPendencia
  caminhoArquivo: String,
  urlPublica: String,
  tamanhoBytes: BigInt,
  mimeType: String,
  sincronizadoEm: DateTime,
  metadados: Json,                 // Infos da MobilePhoto original
  // Auditoria...
}
```

---

## 🎯 Decisões de Arquitetura

### Por que DUAS tabelas?

#### ✅ Vantagens da Abordagem Dual

1. **Separar Responsabilidades**
   - `MobilePhoto`: Recebimento de uploads (transient)
   - `ChecklistRespostaFoto`: Dados estruturados (persistent)

2. **Idempotência Garantida**
   - `MobilePhoto` usa `checksum` (SHA-256)
   - Evita duplicar uploads no sistema
   - Permite retry seguro

3. **Flexibilidade de Busca**
   - Consultas por `turnoId + UUID + perguntaId` (MobilePhoto)
   - Consultas por relacionamento estruturado (ChecklistRespostaFoto)

4. **Auditoria Completa**
   - Rastreia upload original
   - Rastreia sincronização
   - Metadados JSON preservam histórico

#### ⚠️ Alternativas Consideradas (e descartadas)

**Opção 1: Apenas MobilePhoto**
```typescript
// ❌ Problemas:
// - Perde relações estruturadas com pendências
// - Buscas complexas por join
// - Sem histórico de sincronização
```

**Opção 2: Apenas ChecklistRespostaFoto**
```typescript
// ❌ Problemas:
// - Upload não tem estrutura para pendências ainda
// - Perde idempotência do checksum
// - Mais complexo processar múltiplas fontes de upload
```

**Opção 3: MobilePhoto + Referência direta**
```typescript
// ❌ Problemas:
// - FK quebra quando MobilePhoto é deletado
// - Não preserva metadados da sincronização
// - Perde auditoria completa
```

---

## 🔍 Processamento de Pendências

### Processamento Automático

```typescript
// MobilePhotoUploadService.processarFotoPendenciaComUuid()

// 1. Buscar ChecklistPreenchido por UUID
const checklistPreenchido = await prisma.checklistPreenchido.findFirst({
  where: { uuid: checklistUuid, turnoId }
});

// 2. Buscar ChecklistResposta por perguntaId
const resposta = await prisma.checklistResposta.findFirst({
  where: {
    checklistPreenchidoId: checklistPreenchido.id,
    perguntaId: perguntaId
  }
});

// 3. Buscar ou criar ChecklistPendencia
const pendencia = await prisma.checklistPendencia.findFirst({
  where: { checklistRespostaId: resposta.id }
}) || await criarPendencia();

// 4. Criar ChecklistRespostaFoto vinculada
const checklistRespostaFoto = await prisma.checklistRespostaFoto.create({
  data: {
    checklistRespostaId: resposta.id,
    checklistPendenciaId: pendencia.id,
    caminhoArquivo: mobilePhoto.storagePath,
    urlPublica: mobilePhoto.url,
    metadados: {
      mobilePhotoId: mobilePhoto.id,
      tipo: mobilePhoto.tipo,
      turnoId,
      checklistUuid,
      perguntaId
    }
  }
});

// 5. Atualizar ChecklistResposta
await prisma.checklistResposta.update({
  where: { id: resposta.id },
  data: {
    fotosSincronizadas: { increment: 1 },
    aguardandoFoto: false
  }
});
```

---

## 📖 Consultas Principais

### Frontend: Buscar Fotos de Checklist
```typescript
// Busca diretamente em MobilePhoto (mais simples)
const fotos = await prisma.mobilePhoto.findMany({
  where: {
    turnoId: 123,
    checklistUuid: "550e8400-...",
    checklistPerguntaId: 456,
    tipo: { in: ['checklistReprova', 'assinatura'] },
    deletedAt: null
  }
});
```

### Backend: Buscar Fotos de Pendência
```typescript
// Busca estruturada em ChecklistRespostaFoto
const fotosPendencia = await prisma.checklistRespostaFoto.findMany({
  where: { checklistPendenciaId: 789 },
  include: { checklistResposta: true }
});
```

---

## 🛠️ Manutenção

### Limpeza de MobilePhoto

```typescript
// Exemplo: Deletar MobilePhotos antigas (> 90 dias) sem sincronização
await prisma.mobilePhoto.deleteMany({
  where: {
    createdAt: { lt: ninetyDaysAgo },
    // Sem ChecklistRespostaFoto vinculada
    NOT: {
      metadados: { path: ['mobilePhotoId'] }
    }
  }
});
```

### Migração de MobilePhoto para ChecklistRespostaFoto

```typescript
// Job periódico para sincronizar fotos antigas
const mobilePhotos = await prisma.mobilePhoto.findMany({
  where: {
    tipo: { in: ['checklistReprova', 'assinatura'] },
    // Sem sincronização ainda
  }
});

for (const photo of mobilePhotos) {
  await processarFotoPendenciaComUuid(
    photo.id,
    photo.turnoId,
    photo.checklistUuid,
    photo.checklistPerguntaId
  );
}
```

---

## 📋 Resumo

| Aspecto | MobilePhoto | ChecklistRespostaFoto |
|---------|-------------|----------------------|
| **Origem** | Upload do app | Sincronização automática |
| **Idempotência** | checksum (SHA-256) | Relacionamentos FK |
| **Busca** | Por UUID + perguntaId | Por relacionamentos |
| **Função** | Recebimento | Vinculação estruturada |
| **Auditoria** | Upload original | Sincronização completa |
| **Metadados** | Campos diretos | JSON preservado |

---

## 🎯 Conclusão

O sistema dual garante:
- ✅ Idempotência no upload
- ✅ Estruturação para consultas
- ✅ Auditoria completa
- ✅ Flexibilidade de busca
- ✅ Preservação de metadados

**Ambas as tabelas são essenciais** para o funcionamento correto do sistema de fotos de checklist.

