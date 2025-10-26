# Módulo Mobile Upload - Documentação Técnica

## 📸 MobilePhoto (Upload de Fotos)

### Endpoint
- **POST** `/mobile/uploads/photos`
- **Autenticação**: Bearer JWT obrigatória
- **Content-Type**: `multipart/form-data`

### Payload
- `file`: File (obrigatório) - Arquivo da foto
- `turnoId`: number (obrigatório) - ID do turno
- `tipo`: string (obrigatório) - Tipo da foto
- `checklistPreenchidoId`: number (opcional)
- `checklistRespostaId`: number (opcional)
- `sequenciaAssinatura`: number (opcional) - 1 ou 2
- `servicoId`: number (opcional)

### Tipos de Foto Aceitos
- `checklistReprova`
- `assinatura`
- `servico`
- `pendencia`
- `vistoria`
- `documento`
- `outro`

### Formato de Arquivo
- **MIME Types permitidos**: `image/jpeg`, `image/png`, `image/webp`, `image/heic`
- **Tamanho máximo**: Definido em MAX_MOBILE_PHOTO_FILE_SIZE

### Fluxo de Processamento
1. **Validação**: Verifica se arquivo e tipo estão dentro dos limites aceitos
2. **Checksum**: Calcula SHA-256 para detectar duplicatas
3. **Verificação de Duplicata**: Busca foto existente pelo checksum
4. **Idempotência**: Se foto já existe, retorna URL existente
5. **Armazenamento**:
   - Cria estrutura de diretórios: `/uploads/mobile/photos/{turnoId}/`
   - Nome do arquivo: `{timestamp}-{random}.{ext}`
   - Salva metadata no banco
6. **Resposta**: Retorna URL pública e checksum

### Resposta de Sucesso
```json
{
  "status": "stored",
  "url": "/uploads/mobile/photos/123/20250101120000-foto.jpg",
  "checksum": "d2f1b1a6c3e4f5..."
}
```

### Resposta de Duplicata
```json
{
  "status": "duplicate",
  "url": "/uploads/mobile/photos/123/20250101120000-foto.jpg",
  "checksum": "d2f1b1a6c3e4f5..."
}
```

### Banco de Dados - Tabela MobilePhoto
Campos principais:
- `id`: Int (PK)
- `turnoId`: Int - ID do turno
- `tipo`: String - Tipo da foto
- `fileName`: String - Nome do arquivo
- `mimeType`: String - Tipo MIME
- `fileSize`: Int - Tamanho em bytes
- `checksum`: String (UNIQUE) - SHA-256 para idempotência
- `storagePath`: String - Caminho completo no servidor
- `url`: String - URL pública da foto
- `capturedAt`: DateTime? - Data de captura
- `checklistPreenchidoId`: Int? - Relacionamento opcional
- `checklistRespostaId`: Int? - Relacionamento opcional
- `sequenciaAssinatura`: Int? - 1 ou 2
- `servicoId`: Int? - Relacionamento opcional
- Campos de auditoria: `createdAt`, `updatedAt`, `deletedAt`, `createdBy`, `updatedBy`, `deletedBy`

---

## 📍 MobileLocation (Upload de Localizações)

### Endpoint
- **POST** `/mobile/uploads/locations`
- **Autenticação**: Bearer JWT obrigatória
- **Content-Type**: `application/json`

### Payload
```json
{
  "turnoId": 123,
  "latitude": -19.12345,
  "longitude": -43.98765,
  "veiculoRemoteId": 456,
  "equipeRemoteId": 789,
  "accuracy": 10.5,
  "provider": "gps",
  "batteryLevel": 78,
  "tagType": "periodic",
  "tagDetail": "Automático a cada 5min",
  "capturedAt": "2025-01-01T12:00:00Z"
}
```

### Campos Obrigatórios
- `turnoId`: number - ID do turno
- `latitude`: number - Latitude
- `longitude`: number - Longitude

### Campos Opcionais
- `veiculoRemoteId`: number - ID remoto do veículo
- `equipeRemoteId`: number - ID remoto da equipe
- `accuracy`: number - Precisão em metros
- `provider`: string - Fonte da localização (ex: 'gps', 'network')
- `batteryLevel`: number - Nível da bateria (0 a 100)
- `tagType`: string - Tipo da marcação
- `tagDetail`: string - Detalhes da marcação
- `capturedAt`: string - Data/hora da captura (ISO 8601)

### Fluxo de Processamento
1. **Geração de Assinatura**: Combina dados para criar signature única
2. **Validação**: Calcula checksum SHA-256 dos componentes
3. **Verificação de Duplicata**: Busca localização existente pela signature
4. **Idempotência**: Se já existe, retorna status "ok" com alreadyExisted: true
5. **Armazenamento**: Salva localização no banco

### Resposta de Sucesso
```json
{
  "status": "ok",
  "alreadyExisted": false
}
```

### Resposta de Duplicata
```json
{
  "status": "ok",
  "alreadyExisted": true
}
```

### Banco de Dados - Tabela MobileLocation
Campos principais:
- `id`: Int (PK)
- `turnoId`: Int - ID do turno
- `latitude`: Float - Latitude
- `longitude`: Float - Longitude
- `accuracy`: Float? - Precisão em metros
- `veiculoRemoteId`: Int? - ID remoto do veículo
- `equipeRemoteId`: Int? - ID remoto da equipe
- `provider`: String? - Fonte da localização
- `batteryLevel`: Int? - Nível da bateria
- `tagType`: String? - Tipo da marcação
- `tagDetail`: String? - Detalhes da marcação
- `capturedAt`: DateTime - Data/hora da captura
- `signature`: String (UNIQUE) - SHA-256 para idempotência
- Campos de auditoria: `createdAt`, `updatedAt`, `deletedAt`, `createdBy`, `updatedBy`, `deletedBy`

---

## 🔧 Configurações Importantes

### Constantes Definidas
- `MAX_MOBILE_PHOTO_FILE_SIZE`: Tamanho máximo do arquivo de foto
- `MOBILE_PHOTO_UPLOAD_ROOT`: Diretório base para armazenamento
- `MOBILE_PHOTO_UPLOAD_PUBLIC_PREFIX`: Prefixo para URL pública
- `ALLOWED_MOBILE_PHOTO_MIME_TYPES`: Tipos MIME permitidos
- `SUPPORTED_MOBILE_PHOTO_TYPES`: Tipos de foto aceitos

### Características Principais
1. **Idempotência**: Sistema garante que uploads duplicados não criam registros novos
   - MobilePhoto: usa checksum SHA-256 do arquivo
   - MobileLocation: usa signature baseada nos dados de localização

2. **Auditoria Completa**: Todos os registros incluem campos de auditoria
   - `createdBy`: Quem criou
   - `updatedBy`: Quem atualizou
   - `deletedBy`: Quem deletou (soft delete)
   - `createdAt`, `updatedAt`, `deletedAt`: Timestamps

3. **Soft Delete**: Dados nunca são removidos fisicamente, apenas marcados como deletados

4. **Relação com Turno**: Todas as fotos e localizações são vinculadas a um turno específico

---

## ⚠️ Status Atual

As tabelas `MobilePhoto` e `MobileLocation` ainda NÃO foram criadas no banco de dados.

O modelo existe em: `packages/db/prisma/models/mobile-upload.prisma`

Para criar as tabelas, execute:
```bash
npm run db:migrate:dev --workspace=packages/db
```

Após executar a migration, o sistema de upload estará funcionando completamente.
