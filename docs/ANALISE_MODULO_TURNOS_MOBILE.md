# 📋 Análise Completa do Módulo de Abertura de Turnos e Upload Mobile

## 📖 Visão Geral

Este documento analisa completamente como a API Nexa Opera processa:

1. **Abertura de turnos** via app mobile
2. **Upload de fotos/assinaturas**
3. **Upload de localizações**
4. **Processamento de pendências**

---

## 🚀 1. PROCESSO DE ABERTURA DE TURNO

### 1.1 Fluxo Geral

```bash
App Mobile → TurnoMobileController → TurnoService → ChecklistPreenchidoService → Resposta
```

### 1.2 Endpoint Principal

- **URL:** `POST /api/turno/abrir`
- **Controller:** `TurnoMobileController.abrirTurnoMobile()`
- **Autenticação:** JWT Bearer Token obrigatório

### 1.3 Payload Recebido (MobileAbrirTurnoDto)

```typescript
{
  "turno": {
    "idLocal": 123,           // ID local do turno (SQLite)
    "remoteId": null,         // Será preenchido pela API
    "veiculoId": 456,         // RemoteId do veículo
    "equipeId": 789,          // RemoteId da equipe
    "kmInicial": 1000,        // Quilometragem inicial
    "kmFinal": null,          // Quilometragem final (fechamento)
    "horaInicio": "2024-01-15T08:00:00Z", // Timestamp UTC
    "horaFim": null,          // Timestamp UTC (fechamento)
    "latitude": "-23.5505",   // Latitude da localização
    "longitude": "-46.6333",  // Longitude da localização
    "deviceId": "ABC123"      // ID único do dispositivo
  },
  "veiculo": {
    "idLocal": 1,
    "remoteId": 456,
    "placa": "ABC-1234",
    "tipoVeiculoId": 1,
    "sincronizado": true
  },
  "equipe": {
    "idLocal": 2,
    "remoteId": 789,
    "nome": "Equipe Alpha",
    "descricao": "Equipe de manutenção",
    "tipoEquipeId": 1,
    "sincronizado": true
  },
  "eletricistas": [
    {
      "remoteId": 101,        // ID remoto do eletricista
      "nome": "João Silva",
      "matricula": "12345",
      "motorista": true
    }
  ],
  "checklists": [
    {
      "uuid": "550e8400-e29b-41d4-a716-446655440000", // UUID único gerado pelo app
      "checklistModeloId": 1, // ID remoto do modelo de checklist
      "checklistNome": "Checklist Veicular",
      "latitude": -23.5505,
      "longitude": -46.6333,
      "dataPreenchimento": "2024-01-15T08:30:00Z",
      "eletricistaRemoteId": 101, // Para checklists EPI (opcional)
      "respostas": [
        {
          "perguntaId": 1,     // ID remoto da pergunta
          "opcaoRespostaId": 1, // ID remoto da opção escolhida
          "dataResposta": "2024-01-15T08:30:00Z"
        }
      ]
    }
  ]
}
```

### 1.4 Processamento no Controller

#### A) Validação e Fallback

```typescript
// TurnoMobileController.validateAndApplyEletricistaFallback()
// Aplica fallback automático para eletricistaRemoteId nos checklists
```

#### B) Conversão de DTO

```typescript
// TurnoMobileController.converterParaAbrirTurnoDto()
// Converte MobileAbrirTurnoDto → AbrirTurnoDto
const abrirDto = {
  veiculoId: mobileDto.turno.veiculoId,
  equipeId: mobileDto.turno.equipeId,
  dispositivo: mobileDto.turno.deviceId,
  dataInicio: parseMobileDate(mobileDto.turno.horaInicio).toISOString(),
  kmInicio: mobileDto.turno.kmInicial,
  eletricistas: mobileDto.eletricistas.map(elet => ({
    eletricistaId: elet.remoteId,
  })),
  checklists:
    mobileDto.checklists?.map(checklist => ({
      uuid: checklist.uuid || undefined, // ✅ UUID opcional
      checklistId: checklist.checklistModeloId,
      eletricistaId: checklist.eletricistaRemoteId || mobileDto.eletricistas[0].remoteId,
      dataPreenchimento: parseMobileDate(checklist.dataPreenchimento).toISOString(),
      latitude: checklist.latitude,
      longitude: checklist.longitude,
      respostas:
        checklist.respostas?.map(resposta => ({
          ...resposta,
          dataResposta: parseMobileDate(resposta.dataResposta).toISOString(),
        })) || [],
    })) || [],
};
```

### 1.5 Processamento no Service

#### A) Transação Principal

```typescript
// TurnoService.abrirTurno()
const resultado = await this.db.getPrisma().$transaction(async transaction => {
  // 1. Criar turno
  const turno = await transaction.turno.create({
    data: {
      dataSolicitacao: new Date(),
      dataInicio: parseMobileDate(abrirDto.dataInicio),
      veiculoId: abrirDto.veiculoId,
      equipeId: abrirDto.equipeId,
      dispositivo: abrirDto.dispositivo,
      kmInicio: abrirDto.kmInicio,
      ...auditData,
    },
  });

  // 2. Criar eletricistas do turno
  await transaction.turnoEletricista.createMany({
    data: abrirDto.eletricistas.map(eletricista => ({
      turnoId: turno.id,
      eletricistaId: eletricista.eletricistaId,
      ...auditData,
    })),
  });

  // 3. Salvar checklists básicos (DENTRO da transação)
  let checklistsBasicResult = null;
  if (abrirDto.checklists && abrirDto.checklists.length > 0) {
    checklistsBasicResult = await this.checklistPreenchidoService.salvarChecklistsDoTurno(
      turno.id,
      abrirDto.checklists,
      transaction
    );
  }

  return { turno, checklistsBasicResult };
});
```

#### B) Processamento Assíncrono (FORA da transação)

```typescript
// Processar pendências e fotos de forma assíncrona
const checklistsParaProcessar = resultado.checklistsBasicResult?.checklistsPreenchidos;
if (checklistsParaProcessar && checklistsParaProcessar.length > 0) {
  this.logger.log('Iniciando processamento assíncrono de pendências e fotos');
  this.checklistPreenchidoService
    .processarChecklistsAssincrono(checklistsParaProcessar)
    .then(resultadoAssincrono => {
      this.logger.log(
        `Processamento assíncrono concluído - Pendências: ${resultadoAssincrono.pendenciasGeradas}, Aguardando foto: ${resultadoAssincrono.respostasAguardandoFoto.length}`
      );
    })
    .catch(error => {
      this.logger.error('Erro no processamento assíncrono:', error);
    });
}
```

### 1.6 Salvamento de Checklists

#### A) ChecklistPreenchidoService.salvarChecklistsDoTurno()

```typescript
// Salva apenas dados básicos dentro da transação
for (const checklistData of checklists) {
  const checklistPreenchido = await prisma.checklistPreenchido.create({
    data: {
      uuid: checklistData.uuid || undefined, // ✅ UUID opcional
      turnoId,
      checklistId: checklistData.checklistId,
      eletricistaId: checklistData.eletricistaId,
      dataPreenchimento: parseMobileDate(checklistData.dataPreenchimento),
      latitude: checklistData.latitude,
      longitude: checklistData.longitude,
      createdAt: new Date(),
      createdBy: 'system',
    },
  });

  // Salvar respostas
  for (const respostaData of checklistData.respostas) {
    await prisma.checklistResposta.create({
      data: {
        checklistPreenchidoId: checklistPreenchido.id,
        perguntaId: respostaData.perguntaId,
        opcaoRespostaId: respostaData.opcaoRespostaId,
        dataResposta: parseMobileDate(respostaData.dataResposta),
        aguardandoFoto: false, // Será atualizado depois se necessário
        fotosSincronizadas: 0,
        createdAt: new Date(),
        createdBy: 'system',
      },
    });
  }
}
```

#### B) Processamento Assíncrono de Pendências

```typescript
// ChecklistPreenchidoService.processarChecklistsAssincrono()
async processarChecklistsAssincrono(checklistsPreenchidos: any[]) {
  const prisma = this.db.getPrisma();

  // 1. Processar pendências automáticas
  const pendenciasGeradas = await this.processarPendenciasAutomaticas();

  // 2. Marcar respostas aguardando foto
  const respostasAguardandoFoto = await this.marcarRespostasAguardandoFoto();

  return { pendenciasGeradas, respostasAguardandoFoto };
}
```

### 1.7 Resposta da API

```typescript
// Resposta enviada para o app
{
  "id": 12345,                    // ID remoto do turno criado
  "dataSolicitacao": "2024-01-15T08:00:00Z",
  "dataInicio": "2024-01-15T08:00:00Z",
  "veiculoId": 456,
  "equipeId": 789,
  "dispositivo": "ABC123",
  "kmInicio": 1000,
  "checklistsSalvos": 4,          // Quantidade de checklists salvos
  "processamentoAssincrono": "Em andamento" // Status do processamento assíncrono
}
```

---

## 📸 2. PROCESSO DE UPLOAD DE FOTOS/ASSINATURAS

### 2.1 Endpoint Principal

- **URL:** `POST /api/mobile/uploads/photos`
- **Controller:** `MobilePhotoUploadController.uploadPhoto()`
- **Content-Type:** `multipart/form-data`

### 2.2 Payload Recebido (PhotoUploadDto)

```typescript
{
  "file": "<arquivo binário>",                    // Arquivo da foto/assinatura
  "turnoId": 12345,                              // RemoteId do turno
  "tipo": "checklistReprova",                    // Tipo: "checklistReprova", "assinatura", "servico"
  "checklistUuid": "550e8400-e29b-41d4-a716-446655440000", // UUID do checklist (opcional)
  "checklistRespostaId": 654,                    // ID remoto da pergunta (opcional)
  "sequenciaAssinatura": 1,                      // Para assinaturas: 1 ou 2 (opcional)
  "servicoId": null                              // ID do serviço (opcional)
}
```

### 2.3 Processamento no Service

#### A) Validação e Verificação de Duplicidade

```typescript
// MobilePhotoUploadService.handleUpload()
if (!file) {
  throw new BadRequestException('Arquivo da foto é obrigatório');
}

this.validateFile(file); // Valida tamanho, tipo, etc.

const checksum = this.computeChecksum(file.buffer);

// Verificar duplicidade antes de escrever no disco
const existing = await this.db.getPrisma().mobilePhoto.findUnique({ where: { checksum } });

if (existing) {
  return {
    status: 'duplicate',
    url: existing.url,
    checksum: existing.checksum,
  };
}
```

#### B) Salvamento do Arquivo

```typescript
const extension = this.resolveExtension(file);
const relativePath = this.buildRelativePath(payload.turnoId, extension);
const absolutePath = join(MOBILE_PHOTO_UPLOAD_ROOT, ...relativePath.parts);

await this.ensureDirectory(dirname(absolutePath));
await writeFile(absolutePath, file.buffer);

const url = this.buildPublicUrl(relativePath.urlPath);
```

#### C) Salvamento no Banco (MobilePhoto)

```typescript
const mobilePhoto = await this.db.getPrisma().mobilePhoto.create({
  data: {
    turnoId: payload.turnoId,
    tipo: this.normalizePhotoType(payload.tipo),
    checklistUuid: payload.checklistUuid ?? null, // ✅ UUID opcional
    checklistRespostaId: payload.checklistRespostaId ?? null,
    sequenciaAssinatura: payload.sequenciaAssinatura ?? null,
    servicoId: payload.servicoId ?? null,
    fileName: relativePath.fileName,
    mimeType: file.mimetype,
    fileSize: file.size,
    checksum: checksum,
    storagePath: relativePath.fullPath,
    url: url,
    capturedAt: payload.capturedAt ? new Date(payload.capturedAt) : new Date(),
    createdAt: new Date(),
    createdBy: 'system',
  },
});
```

#### D) Processamento de Pendências (Se Aplicável)

```typescript
// Verificar se deve processar pendência
const shouldProcessPendencia =
  (payload.tipo === 'pendencia' || payload.tipo === 'checklistReprova') &&
  payload.checklistRespostaId;

if (shouldProcessPendencia) {
  if (payload.checklistUuid && payload.checklistUuid.trim() !== '') {
    // Usar UUID se disponível
    await this.processarFotoPendenciaComUuid(
      mobilePhoto.id,
      payload.turnoId,
      payload.checklistUuid,
      payload.checklistRespostaId!
    );
  } else {
    // Fallback: usar apenas perguntaId quando UUID não estiver disponível
    await this.processarFotoPendenciaSemUuid(
      mobilePhoto.id,
      payload.turnoId,
      payload.checklistRespostaId!
    );
  }
}
```

### 2.4 Processamento de Pendências com UUID

#### A) Busca por UUID

```typescript
// MobilePhotoUploadService.processarFotoPendenciaComUuid()
const checklistPreenchido = await this.db.getPrisma().checklistPreenchido.findUnique({
  where: {
    uuid: checklistUuid,
    turnoId: turnoId,
    deletedAt: null,
  },
});

if (!checklistPreenchido) {
  this.logger.error(`❌ Checklist não encontrado para UUID: ${checklistUuid}`);
  return;
}

// Buscar resposta específica
const resposta = await this.db.getPrisma().checklistResposta.findFirst({
  where: {
    checklistPreenchidoId: checklistPreenchido.id,
    perguntaId: perguntaId,
    deletedAt: null,
  },
});
```

#### B) Criação de Pendência e Vinculação da Foto

```typescript
// Buscar ou criar pendência
let pendencia = await this.db.getPrisma().checklistPendencia.findFirst({
  where: { checklistRespostaId: resposta.id },
});

if (!pendencia) {
  pendencia = await this.db.getPrisma().checklistPendencia.create({
    data: {
      checklistRespostaId: resposta.id,
      checklistPreenchidoId: checklistPreenchido.id,
      turnoId: turnoId,
      status: 'AGUARDANDO_TRATAMENTO',
      createdAt: new Date(),
      createdBy: 'system',
    },
  });
}

// Criar registro na tabela ChecklistRespostaFoto
const checklistRespostaFoto = await this.db.getPrisma().checklistRespostaFoto.create({
  data: {
    checklistRespostaId: resposta.id,
    checklistPendenciaId: pendencia.id,
    caminhoArquivo: mobilePhoto.storagePath,
    urlPublica: mobilePhoto.url,
    tamanhoBytes: BigInt(mobilePhoto.fileSize),
    mimeType: mobilePhoto.mimeType,
    sincronizadoEm: new Date(),
    metadados: {
      mobilePhotoId: mobilePhoto.id,
      tipo: mobilePhoto.tipo,
      capturedAt: mobilePhoto.capturedAt,
      turnoId,
      perguntaId,
      metodoVinculacao: 'uuid',
    },
    createdAt: new Date(),
    createdBy: 'system',
  },
});

// Atualizar contador de fotos sincronizadas
await this.db.getPrisma().checklistResposta.update({
  where: { id: resposta.id },
  data: {
    fotosSincronizadas: {
      increment: 1,
    },
  },
});
```

### 2.5 Processamento de Pendências sem UUID (Fallback)

```typescript
// MobilePhotoUploadService.processarFotoPendenciaSemUuid()
// Buscar todas as respostas do turno com a pergunta específica
const respostas = await this.db.getPrisma().checklistResposta.findMany({
  where: {
    perguntaId: perguntaId,
    checklistPreenchido: {
      turnoId: turnoId,
      deletedAt: null,
    },
    deletedAt: null,
  },
  include: {
    ChecklistPendencia: true,
  },
});

// Processar cada resposta encontrada
for (const resposta of respostas) {
  // Buscar ou criar pendência
  let pendencia = resposta.ChecklistPendencia;
  if (!pendencia) {
    pendencia = await this.db.getPrisma().checklistPendencia.create({
      data: {
        checklistRespostaId: resposta.id,
        checklistPreenchidoId: resposta.checklistPreenchidoId,
        turnoId: turnoId,
        status: 'AGUARDANDO_TRATAMENTO',
        createdAt: new Date(),
        createdBy: 'system',
      },
    });
  }

  // Criar registro na tabela ChecklistRespostaFoto
  const checklistRespostaFoto = await this.db.getPrisma().checklistRespostaFoto.create({
    data: {
      checklistRespostaId: resposta.id,
      checklistPendenciaId: pendencia.id,
      caminhoArquivo: mobilePhoto.storagePath,
      urlPublica: mobilePhoto.url,
      tamanhoBytes: BigInt(mobilePhoto.fileSize),
      mimeType: mobilePhoto.mimeType,
      sincronizadoEm: new Date(),
      metadados: {
        mobilePhotoId: mobilePhoto.id,
        tipo: mobilePhoto.tipo,
        capturedAt: mobilePhoto.capturedAt,
        turnoId,
        perguntaId,
        metodoVinculacao: 'sem-uuid-fallback',
      },
      createdAt: new Date(),
      createdBy: 'system',
    },
  });

  // Atualizar contador de fotos sincronizadas
  await this.db.getPrisma().checklistResposta.update({
    where: { id: resposta.id },
    data: {
      fotosSincronizadas: {
        increment: 1,
      },
    },
  });
}
```

### 2.6 Resposta da API

```typescript
{
  "status": "stored",                    // "stored", "duplicate"
  "url": "https://api.exemplo.com/fotos/abc123.jpg",
  "checksum": "sha256:abc123..."
}
```

---

## 📍 3. PROCESSO DE UPLOAD DE LOCALIZAÇÃO

### 3.1 Endpoint Principal

- **URL:** `POST /api/mobile/uploads/locations`
- **Controller:** `MobileLocationUploadController.uploadLocation()`
- **Content-Type:** `application/json`

### 3.2 Payload Recebido (LocationUploadDto)

```typescript
{
  "turnoId": 321,                    // ID local do turno no aplicativo
  "latitude": -19.12345,             // Latitude capturada pelo dispositivo
  "longitude": -43.98765,            // Longitude capturada pelo dispositivo
  "veiculoRemoteId": 456,            // ID remoto do veículo (opcional)
  "equipeRemoteId": 789,             // ID remoto da equipe (opcional)
  "accuracy": 10.5,                  // Precisão da leitura em metros (opcional)
  "provider": "gps",                 // Fonte de localização (opcional)
  "batteryLevel": 78,                // Nível de bateria 0-100 (opcional)
  "tagType": "periodic",             // Tipo da marcação (opcional)
  "tagDetail": "checkpoint",         // Detalhe da marcação (opcional)
  "capturedAt": "2024-01-15T08:30:00Z" // Timestamp da captura (opcional)
}
```

### 3.3 Processamento no Service

#### A) Geração de Assinatura para Idempotência

```typescript
// MobileLocationUploadService.handleUpload()
const signature = this.buildSignature(payload);

private buildSignature(payload: LocationUploadDto): string {
  const components = [
    payload.turnoId,
    payload.latitude,
    payload.longitude,
    payload.capturedAt || new Date().toISOString(),
  ];

  return createHash('sha256')
    .update(components.join('|'))
    .digest('hex');
}
```

#### B) Salvamento com Tratamento de Duplicidade

```typescript
try {
  // Tentar inserir diretamente - se já existir, será capturado pelo catch
  await prisma.mobileLocation.create({
    data: {
      turnoId: payload.turnoId,
      veiculoRemoteId: payload.veiculoRemoteId ?? null,
      equipeRemoteId: payload.equipeRemoteId ?? null,
      latitude: payload.latitude,
      longitude: payload.longitude,
      accuracy: payload.accuracy ?? null,
      provider: payload.provider ?? null,
      batteryLevel: payload.batteryLevel ?? null,
      tagType: payload.tagType ?? null,
      tagDetail: payload.tagDetail ?? null,
      capturedAt: payload.capturedAt ? new Date(payload.capturedAt) : new Date(),
      signature,
      ...audit,
    },
  });

  return {
    status: 'ok',
    alreadyExisted: false,
  };
} catch (error) {
  // Se for erro de constraint única, significa que já existe
  if (error.code === 'P2002' && error.meta?.target?.includes('signature')) {
    this.logger.debug(
      `Localização duplicada detectada (signature=${signature}), ignorando nova inserção`
    );

    return {
      status: 'ok',
      alreadyExisted: true,
    };
  }

  // Se for outro erro, relançar
  throw error;
}
```

### 3.4 Resposta da API

```typescript
{
  "status": "ok",
  "alreadyExisted": false           // true se já existia (idempotência)
}
```

---

## 🔄 4. PROCESSAMENTO DE PENDÊNCIAS AUTOMÁTICAS

### 4.1 Quando Acontece

- **Durante abertura do turno:** Processamento assíncrono após salvamento básico
- **Durante upload de fotos:** Processamento imediato para fotos de pendência

### 4.2 ChecklistPreenchidoService.processarPendenciasAutomaticas()

```typescript
async processarPendenciasAutomaticas(): Promise<number> {
  const prisma = this.db.getPrisma();

  // Buscar respostas que geram pendência mas ainda não têm pendência criada
  const respostasComPendencia = await prisma.checklistResposta.findMany({
    where: {
      opcaoResposta: {
        geraPendencia: true,
      },
      ChecklistPendencia: null, // Não tem pendência ainda
      deletedAt: null,
    },
    include: {
      opcaoResposta: true,
      checklistPreenchido: {
        include: {
          turno: true,
        },
      },
    },
  });

  let pendenciasCriadas = 0;

  for (const resposta of respostasComPendencia) {
    await prisma.checklistPendencia.create({
      data: {
        checklistRespostaId: resposta.id,
        checklistPreenchidoId: resposta.checklistPreenchidoId,
        turnoId: resposta.checklistPreenchido.turnoId,
        status: 'AGUARDANDO_TRATAMENTO',
        createdAt: new Date(),
        createdBy: 'system',
      },
    });

    pendenciasCriadas++;
  }

  return pendenciasCriadas;
}
```

### 4.3 ChecklistPreenchidoService.marcarRespostasAguardandoFoto()

```typescript
async marcarRespostasAguardandoFoto(): Promise<any[]> {
  const prisma = this.db.getPrisma();

  // Buscar respostas que geram pendência e marcar como aguardando foto
  const respostas = await prisma.checklistResposta.findMany({
    where: {
      opcaoResposta: {
        geraPendencia: true,
      },
      aguardandoFoto: false,
      deletedAt: null,
    },
    include: {
      opcaoResposta: true,
    },
  });

  const respostasAtualizadas = [];

  for (const resposta of respostas) {
    await prisma.checklistResposta.update({
      where: { id: resposta.id },
      data: {
        aguardandoFoto: true,
      },
    });

    respostasAtualizadas.push(resposta);
  }

  return respostasAtualizadas;
}
```

---

## 📊 5. ESTRUTURA DE DADOS NO BANCO

### 5.1 Tabelas Principais

#### A) Turnos

```sql
CREATE TABLE turnos (
  id SERIAL PRIMARY KEY,
  data_solicitacao TIMESTAMP NOT NULL,
  data_inicio TIMESTAMP NOT NULL,
  data_fim TIMESTAMP,
  veiculo_id INTEGER NOT NULL,
  equipe_id INTEGER NOT NULL,
  dispositivo VARCHAR(100),
  km_inicio INTEGER,
  km_final INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  created_by VARCHAR(100),
  updated_at TIMESTAMP,
  updated_by VARCHAR(100),
  deleted_at TIMESTAMP,
  deleted_by VARCHAR(100)
);
```

#### B) Checklists Preenchidos

```sql
CREATE TABLE checklist_preenchidos (
  id SERIAL PRIMARY KEY,
  uuid VARCHAR(36) UNIQUE,                    -- ✅ UUID opcional
  turno_id INTEGER NOT NULL,
  checklist_id INTEGER NOT NULL,
  eletricista_id INTEGER,
  data_preenchimento TIMESTAMP NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  created_at TIMESTAMP DEFAULT NOW(),
  created_by VARCHAR(100),
  updated_at TIMESTAMP,
  updated_by VARCHAR(100),
  deleted_at TIMESTAMP,
  deleted_by VARCHAR(100)
);
```

#### C) Respostas de Checklist

```sql
CREATE TABLE checklist_respostas (
  id SERIAL PRIMARY KEY,
  checklist_preenchido_id INTEGER NOT NULL,
  pergunta_id INTEGER NOT NULL,
  opcao_resposta_id INTEGER NOT NULL,
  data_resposta TIMESTAMP NOT NULL,
  aguardando_foto BOOLEAN DEFAULT FALSE,
  fotos_sincronizadas INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  created_by VARCHAR(100),
  updated_at TIMESTAMP,
  updated_by VARCHAR(100),
  deleted_at TIMESTAMP,
  deleted_by VARCHAR(100)
);
```

#### D) Pendências de Checklist

```sql
CREATE TABLE checklist_pendencias (
  id SERIAL PRIMARY KEY,
  checklist_resposta_id INTEGER NOT NULL,
  checklist_preenchido_id INTEGER NOT NULL,
  turno_id INTEGER NOT NULL,
  status VARCHAR(50) NOT NULL,                 -- 'AGUARDANDO_TRATAMENTO', 'EM_TRATAMENTO', 'TRATADA', 'REGISTRO_INCORRETO'
  created_at TIMESTAMP DEFAULT NOW(),
  created_by VARCHAR(100),
  updated_at TIMESTAMP,
  updated_by VARCHAR(100),
  deleted_at TIMESTAMP,
  deleted_by VARCHAR(100)
);
```

#### E) Fotos Mobile

```sql
CREATE TABLE mobile_photos (
  id SERIAL PRIMARY KEY,
  turno_id INTEGER NOT NULL,
  tipo VARCHAR(100) NOT NULL,                  -- 'checklistReprova', 'assinatura', 'servico'
  checklist_uuid VARCHAR(36),                  -- ✅ UUID opcional
  checklist_resposta_id INTEGER,               -- ID remoto da pergunta
  sequencia_assinatura INTEGER,
  servico_id INTEGER,
  file_name VARCHAR(255) NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  file_size BIGINT NOT NULL,
  checksum VARCHAR(255) UNIQUE NOT NULL,
  storage_path VARCHAR(500) NOT NULL,
  url VARCHAR(500) NOT NULL,
  captured_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  created_by VARCHAR(100),
  updated_at TIMESTAMP,
  updated_by VARCHAR(100),
  deleted_at TIMESTAMP,
  deleted_by VARCHAR(100)
);
```

#### F) Fotos de Resposta de Checklist

```sql
CREATE TABLE checklist_resposta_fotos (
  id SERIAL PRIMARY KEY,
  checklist_resposta_id INTEGER NOT NULL,
  checklist_pendencia_id INTEGER,
  caminho_arquivo VARCHAR(500) NOT NULL,
  url_publica VARCHAR(500),
  tamanho_bytes BIGINT NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  sincronizado_em TIMESTAMP NOT NULL,
  metadados JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  created_by VARCHAR(100),
  updated_at TIMESTAMP,
  updated_by VARCHAR(100),
  deleted_at TIMESTAMP,
  deleted_by VARCHAR(100)
);
```

#### G) Localizações Mobile

```sql
CREATE TABLE mobile_locations (
  id SERIAL PRIMARY KEY,
  turno_id INTEGER NOT NULL,
  veiculo_remote_id INTEGER,
  equipe_remote_id INTEGER,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  accuracy DECIMAL(8, 2),
  provider VARCHAR(100),
  battery_level INTEGER,
  tag_type VARCHAR(100),
  tag_detail VARCHAR(100),
  captured_at TIMESTAMP NOT NULL,
  signature VARCHAR(255) UNIQUE NOT NULL,      -- Para idempotência
  created_at TIMESTAMP DEFAULT NOW(),
  created_by VARCHAR(100),
  updated_at TIMESTAMP,
  updated_by VARCHAR(100),
  deleted_at TIMESTAMP,
  deleted_by VARCHAR(100)
);
```

---

## 🎯 6. RESUMO DOS FLUXOS

### 6.1 Fluxo Completo de Abertura de Turno

```
1. App Mobile → POST /api/turno/abrir
2. TurnoMobileController → Validação e conversão de DTO
3. TurnoService → Transação principal (turno + eletricistas + checklists básicos)
4. ChecklistPreenchidoService → Processamento assíncrono (pendências + fotos)
5. Resposta → App recebe remoteId do turno
```

### 6.2 Fluxo Completo de Upload de Foto

```
1. App Mobile → POST /api/mobile/uploads/photos (multipart/form-data)
2. MobilePhotoUploadController → Validação de arquivo
3. MobilePhotoUploadService → Verificação de duplicidade (checksum)
4. Salvamento do arquivo → Sistema de arquivos
5. Salvamento no banco → Tabela mobile_photos
6. Processamento de pendência → Se tipo = "checklistReprova"
   - Busca por UUID ou fallback por perguntaId
   - Criação de pendência (se não existir)
   - Vinculação da foto em checklist_resposta_fotos
7. Resposta → App recebe URL da foto
```

### 6.3 Fluxo Completo de Upload de Localização

```
1. App Mobile → POST /api/mobile/uploads/locations (JSON)
2. MobileLocationUploadController → Validação de dados
3. MobileLocationUploadService → Geração de assinatura para idempotência
4. Salvamento no banco → Tabela mobile_locations
5. Tratamento de duplicidade → Se constraint única violada
6. Resposta → App recebe status (ok/duplicate)
```

---

## 🔧 7. PONTOS IMPORTANTES

### 7.1 UUIDs

- **✅ Implementado:** Campo `uuid` opcional em `ChecklistPreenchido`
- **✅ Funcional:** Busca por UUID para vinculação de fotos
- **⚠️ Problema atual:** App não está enviando UUIDs válidos (todos são `null`)

### 7.2 Processamento Assíncrono

- **✅ Implementado:** Separação entre salvamento síncrono e processamento assíncrono
- **✅ Benefício:** Evita timeouts de transação
- **✅ Funcional:** Processamento de pendências fora da transação principal

### 7.3 Idempotência

- **✅ Fotos:** Verificação por checksum SHA256
- **✅ Localizações:** Verificação por assinatura única
- **✅ Benefício:** Evita duplicação de dados

### 7.4 Fallback para UUIDs

- **✅ Implementado:** Processamento sem UUID usando `turnoId + perguntaId`
- **✅ Funcional:** Vincula fotos mesmo sem UUID
- **⚠️ Limitação:** Pode vincular a múltiplas respostas se houver ambiguidade

### 7.5 Logs e Debug

- **✅ Implementado:** Logs detalhados em todas as operações
- **✅ Funcional:** Rastreamento completo do fluxo
- **✅ Benefício:** Facilita debugging e monitoramento

---

## 🚨 8. PROBLEMAS IDENTIFICADOS

### 8.1 UUIDs Não Funcionando

- **Problema:** App não está enviando UUIDs válidos
- **Impacto:** Sistema usa fallback, pode haver ambiguidade
- **Solução:** Verificar implementação no app mobile

### 8.2 Fotos Não Aparecendo no Web

- **Problema:** Web não encontra fotos vinculadas
- **Causa:** UUIDs são `null`, fallback pode não estar funcionando corretamente
- **Solução:** Testar com UUIDs válidos ou corrigir fallback

### 8.3 Processamento Assíncrono

- **Problema:** Processamento pode falhar silenciosamente
- **Impacto:** Pendências podem não ser criadas
- **Solução:** Implementar retry e notificação de falhas

---

## 📝 9. RECOMENDAÇÕES

### 9.1 Para o App Mobile

1. **Implementar UUIDs corretos** para todos os checklists preenchidos
2. **Enviar UUIDs nas fotos** para vinculação precisa
3. **Implementar retry** para uploads que falham

### 9.2 Para a API

1. **Melhorar logs** de processamento assíncrono
2. **Implementar monitoramento** de falhas assíncronas
3. **Adicionar validação** de UUIDs recebidos

### 9.3 Para o Web Frontend

1. **Implementar busca por UUID** (já implementado)
2. **Melhorar tratamento de erros** de carregamento de fotos
3. **Implementar cache** para melhor performance

---

**Este documento fornece uma visão completa de como a API Nexa Opera processa abertura de turnos e
uploads mobile. O sistema está bem estruturado, mas precisa de ajustes na implementação de UUIDs
para funcionar perfeitamente.**
