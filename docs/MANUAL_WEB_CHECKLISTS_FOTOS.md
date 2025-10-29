# 📋 Manual: Como o Web Frontend Busca e Exibe Checklists e Fotos

## 📖 Visão Geral

Este manual explica como o frontend web (Next.js) busca e exibe checklists preenchidos e suas fotos
associadas, incluindo o fluxo completo desde a página de turnos até a visualização das fotos.

---

## 🚀 1. ARQUITETURA GERAL

### 1.1 Fluxo Completo

```bash
Página Turnos → ChecklistSelectorModal → ChecklistViewerModal → Exibição das Fotos
```

### 1.2 Componentes Principais

- **`TurnosPage`**: Página principal com lista de turnos
- **`ChecklistSelectorModal`**: Modal para selecionar checklist específico
- **`ChecklistViewerModal`**: Modal para visualizar checklist completo com fotos
- **`getChecklistsByTurno`**: Server Action para buscar dados
- **`getChecklistByUuid`**: Server Action para buscar por UUID específico

---

## 📊 2. SERVER ACTIONS (Backend)

### 2.1 getChecklistsByTurno

**Localização:** `apps/web/src/lib/actions/checklist/getByTurno.ts`

**Função:** Busca todos os checklists preenchidos de um turno específico

```typescript
export const getChecklistsByTurno = async (rawData: unknown) =>
  handleServerAction(
    getChecklistsByTurnoSchema,
    async data => {
      console.log('🔍 [getChecklistsByTurno] Buscando checklists do turno:', data.turnoId);

      const checklistsPreenchidos = await prisma.checklistPreenchido.findMany({
        where: {
          turnoId: data.turnoId,
          deletedAt: null,
        },
        include: {
          // ✅ Inclui dados do checklist modelo
          checklist: {
            include: {
              tipoChecklist: true,
            },
          },
          // ✅ Inclui dados do eletricista
          eletricista: {
            select: {
              id: true,
              nome: true,
              matricula: true,
            },
          },
          // ✅ Inclui todas as respostas do checklist (SEM fotos inicialmente)
          ChecklistResposta: {
            where: {
              deletedAt: null,
            },
            include: {
              // ✅ Dados da pergunta
              pergunta: {
                select: {
                  id: true,
                  nome: true,
                },
              },
              // ✅ Dados da opção escolhida
              opcaoResposta: {
                select: {
                  id: true,
                  nome: true,
                  geraPendencia: true,
                },
              },
              // ❌ NÃO inclui ChecklistRespostaFoto aqui - será buscado separadamente
            },
            orderBy: {
              dataResposta: 'asc',
            },
          },
        },
        orderBy: {
          dataPreenchimento: 'asc',
        },
      });

      // ✅ NOVA LÓGICA: Buscar fotos diretamente por turnoId + checklistUuid + perguntaId
      const checklistsComFotos = await Promise.all(
        checklistsPreenchidos.map(async checklist => {
          console.log(`🔍 [DEBUG] Processando checklist ${checklist.id} (UUID: ${checklist.uuid})`);

          // Buscar fotos para cada resposta específica
          const respostasComFotos = await Promise.all(
            checklist.ChecklistResposta.map(async resposta => {
              // ✅ Busca direta: turnoId + checklistUuid + perguntaId
              const fotosDaResposta = await prisma.mobilePhoto.findMany({
                where: {
                  turnoId: data.turnoId,
                  checklistUuid: checklist.uuid,
                  checklistPerguntaId: resposta.perguntaId,
                  tipo: {
                    in: ['checklistReprova', 'assinatura'],
                  },
                  deletedAt: null,
                },
                select: {
                  id: true,
                  tipo: true,
                  url: true,
                  storagePath: true,
                  fileSize: true,
                  mimeType: true,
                  capturedAt: true,
                  createdAt: true,
                },
                orderBy: {
                  createdAt: 'asc',
                },
              });

              console.log(`📋 [DEBUG] Resposta ${resposta.id} (perguntaId: ${resposta.perguntaId}):`, {
                aguardandoFoto: resposta.aguardandoFoto,
                fotosSincronizadas: resposta.fotosSincronizadas,
                fotosEncontradas: fotosDaResposta.length,
                fotos: fotosDaResposta.map(f => ({
                  id: f.id,
                  tipo: f.tipo,
                  url: f.url,
                  storagePath: f.storagePath,
                })),
              });

              // ✅ Converter para formato compatível com frontend
              const fotosFormatadas = fotosDaResposta.map(foto => ({
                id: foto.id,
                caminhoArquivo: foto.storagePath,
                urlPublica: foto.url,
                tamanhoBytes: BigInt(foto.fileSize),
                mimeType: foto.mimeType,
                sincronizadoEm: foto.capturedAt.toISOString(),
                createdAt: foto.createdAt.toISOString(),
              }));

              return {
                ...resposta,
                ChecklistRespostaFoto: fotosFormatadas,
              };
            })
          );

          return {
            ...checklist,
            ChecklistResposta: respostasComFotos,
          };
        })
      );

      return checklistsComFotos;
    },
    rawData,
    { entityName: 'ChecklistPreenchido', actionType: 'getByTurno' }
  );
```

### 2.2 getChecklistByUuid

**Função:** Busca um checklist específico por UUID

```typescript
export const getChecklistByUuid = async (rawData: unknown) =>
  handleServerAction(
    getChecklistByUuidSchema,
    async data => {
      console.log('🔍 [getChecklistByUuid] Buscando checklist por UUID:', data.uuid);

      const checklistPreenchido = await prisma.checklistPreenchido.findUnique({
        where: {
          uuid: data.uuid,
          deletedAt: null,
        },
        include: {
          // ✅ Mesma estrutura de includes do getChecklistsByTurno (SEM fotos inicialmente)
          checklist: {
            include: {
              tipoChecklist: true,
            },
          },
          eletricista: {
            select: {
              id: true,
              nome: true,
              matricula: true,
            },
          },
          ChecklistResposta: {
            where: {
              deletedAt: null,
            },
            include: {
              pergunta: {
                select: {
                  id: true,
                  nome: true,
                },
              },
              opcaoResposta: {
                select: {
                  id: true,
                  nome: true,
                  geraPendencia: true,
                },
              },
              // ❌ NÃO inclui ChecklistRespostaFoto aqui - será buscado separadamente
            },
            orderBy: {
              dataResposta: 'asc',
            },
          },
        },
      });

      if (!checklistPreenchido) {
        console.log(`❌ [getChecklistByUuid] Checklist não encontrado para UUID: ${data.uuid}`);
        return null;
      }

      // ✅ NOVA LÓGICA: Buscar fotos diretamente por turnoId + checklistUuid + perguntaId
      const respostasComFotos = await Promise.all(
        checklistPreenchido.ChecklistResposta.map(async resposta => {
          // ✅ Busca direta: turnoId + checklistUuid + perguntaId
          const fotosDaResposta = await prisma.mobilePhoto.findMany({
            where: {
              turnoId: checklistPreenchido.turnoId,
              checklistUuid: data.uuid,
              checklistPerguntaId: resposta.perguntaId,
              tipo: {
                in: ['checklistReprova', 'assinatura'],
              },
              deletedAt: null,
            },
            select: {
              id: true,
              tipo: true,
              url: true,
              storagePath: true,
              fileSize: true,
              mimeType: true,
              capturedAt: true,
              createdAt: true,
            },
            orderBy: {
              createdAt: 'asc',
            },
          });

          console.log(`📋 [getChecklistByUuid] Resposta ${resposta.id} (perguntaId: ${resposta.perguntaId}):`, {
            fotosEncontradas: fotosDaResposta.length,
            fotos: fotosDaResposta.map(f => ({
              id: f.id,
              tipo: f.tipo,
              url: f.url,
            })),
          });

          // ✅ Converter para formato compatível com frontend
          const fotosFormatadas = fotosDaResposta.map(foto => ({
            id: foto.id,
            caminhoArquivo: foto.storagePath,
            urlPublica: foto.url,
            tamanhoBytes: BigInt(foto.fileSize),
            mimeType: foto.mimeType,
            sincronizadoEm: foto.capturedAt.toISOString(),
            createdAt: foto.createdAt.toISOString(),
          }));

          return {
            ...resposta,
            ChecklistRespostaFoto: fotosFormatadas,
          };
        })
      );

      const checklistComFotos = {
        ...checklistPreenchido,
        ChecklistResposta: respostasComFotos,
      };

      console.log('✅ [getChecklistByUuid] Checklist encontrado:', {
        id: checklistComFotos.id,
        uuid: checklistComFotos.uuid,
        turnoId: checklistComFotos.turnoId,
        totalRespostas: checklistComFotos.ChecklistResposta.length,
        respostasComFoto: checklistComFotos.ChecklistResposta.filter(
          r => r.ChecklistRespostaFoto.length > 0
        ).length,
      });

      return checklistComFotos;
    },
    rawData,
    { entityName: 'ChecklistPreenchido', actionType: 'getByUuid' }
  );
```

---

## 🎯 3. COMPONENTES FRONTEND

### 3.1 TurnosPage (Página Principal)

**Localização:** `apps/web/src/app/dashboard/turnos/page.tsx`

**Função:** Exibe lista de turnos com botão para visualizar checklists

```typescript
export default function TurnosPage() {
  // ✅ Estados para os modais de checklist
  const [checklistSelectorVisible, setChecklistSelectorVisible] = useState(false);
  const [checklistViewerVisible, setChecklistViewerVisible] = useState(false);
  const [selectedTurno, setSelectedTurno] = useState<TurnoData | null>(null);
  const [selectedChecklist, setSelectedChecklist] = useState<any>(null);

  // ✅ Função para abrir modal de seleção de checklist
  const handleViewChecklists = (turno: TurnoData) => {
    setSelectedTurno(turno);
    setChecklistSelectorVisible(true);
  };

  // ✅ Função para abrir modal de visualização de checklist
  const handleSelectChecklist = (checklist: any) => {
    setSelectedChecklist(checklist);
    setChecklistViewerVisible(true);
  };

  // ✅ Colunas da tabela de turnos
  const columns: ColumnsType<TurnoData> = [
    // ... outras colunas
    {
      title: 'Ações',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Tooltip title="Visualizar Checklists">
            <Button
              type="primary"
              icon={<EyeOutlined />}
              size="small"
              onClick={() => handleViewChecklists(record)}
            >
              Checklists
            </Button>
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div>
      {/* ✅ Tabela de turnos */}
      <Table
        columns={columns}
        dataSource={turnosAbertos}
        loading={loading}
        rowKey="id"
        pagination={{ pageSize: 10 }}
      />

      {/* ✅ Modal de seleção de checklist */}
      <ChecklistSelectorModal
        visible={checklistSelectorVisible}
        onClose={handleCloseChecklistSelector}
        turnoId={selectedTurno?.id || 0}
        turnoInfo={selectedTurno || {}}
        onSelectChecklist={handleSelectChecklist}
      />

      {/* ✅ Modal de visualização de checklist */}
      <ChecklistViewerModal
        visible={checklistViewerVisible}
        onClose={handleCloseChecklistViewer}
        checklist={selectedChecklist}
      />
    </div>
  );
}
```

### 3.2 ChecklistSelectorModal

**Localização:** `apps/web/src/ui/components/ChecklistSelectorModal.tsx`

**Função:** Modal para selecionar qual checklist específico visualizar

```typescript
export default function ChecklistSelectorModal({
  visible,
  onClose,
  turnoId,
  turnoInfo,
  onSelectChecklist,
}: ChecklistSelectorModalProps) {
  const [checklists, setChecklists] = useState<ChecklistPreenchido[]>([]);
  const [loading, setLoading] = useState(false);

  // ✅ Função para buscar checklists do turno
  const fetchChecklists = useCallback(async () => {
    setLoading(true);
    try {
      // ✅ Chama a Server Action
      const result = await getChecklistsByTurno({ turnoId });

      if (result.success && result.data) {
        setChecklists(result.data);
      } else {
        console.error('Erro ao buscar checklists:', result.error);
        setChecklists([]);
      }
    } catch (error) {
      console.error('Erro ao buscar checklists:', error);
      setChecklists([]);
    } finally {
      setLoading(false);
    }
  }, [turnoId]);

  // ✅ Buscar checklists quando modal abrir
  useEffect(() => {
    if (visible && turnoId) {
      fetchChecklists();
    }
  }, [visible, turnoId, fetchChecklists]);

  // ✅ Função para determinar status do checklist
  const getStatusColor = (checklist: ChecklistPreenchido) => {
    const totalRespostas = checklist.ChecklistResposta.length;
    const respostasComFoto = checklist.ChecklistResposta.filter(r => r.fotosSincronizadas > 0).length;
    const aguardandoFoto = checklist.ChecklistResposta.some(r => r.aguardandoFoto);

    if (aguardandoFoto) return 'orange'; // ✅ Aguardando fotos
    if (respostasComFoto === totalRespostas && totalRespostas > 0) return 'green'; // ✅ Completo
    return 'blue'; // ✅ Preenchido
  };

  const getStatusText = (checklist: ChecklistPreenchido) => {
    const totalRespostas = checklist.ChecklistResposta.length;
    const respostasComFoto = checklist.ChecklistResposta.filter(r => r.fotosSincronizadas > 0).length;
    const aguardandoFoto = checklist.ChecklistResposta.some(r => r.aguardandoFoto);

    if (aguardandoFoto) return 'Aguardando fotos';
    if (respostasComFoto === totalRespostas && totalRespostas > 0) return 'Completo';
    return 'Preenchido';
  };

  return (
    <Modal
      title={
        <Space>
          <EyeOutlined />
          <span>Selecionar Checklist - Turno {turnoInfo.veiculoPlaca}</span>
        </Space>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={800}
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <Spin size="large" />
        </div>
      ) : checklists.length === 0 ? (
        <Empty description="Nenhum checklist encontrado para este turno" />
      ) : (
        <List
          dataSource={checklists}
          renderItem={(checklist) => (
            <List.Item>
              <Card
                hoverable
                style={{ width: '100%' }}
                onClick={() => handleSelectChecklist(checklist)}
              >
                <Card.Meta
                  title={
                    <Space>
                      <span>{checklist.checklist.nome}</span>
                      <Tag color={getStatusColor(checklist)}>
                        {getStatusText(checklist)}
                      </Tag>
                    </Space>
                  }
                  description={
                    <Space direction="vertical" size={4}>
                      <Text>
                        <UserOutlined /> {checklist.eletricista.nome} ({checklist.eletricista.matricula})
                      </Text>
                      <Text>
                        <CalendarOutlined /> {formatDateTime(checklist.dataPreenchimento).date} às {formatDateTime(checklist.dataPreenchimento).time}
                      </Text>
                      <Text>
                        <ClockCircleOutlined /> {checklist.ChecklistResposta.length} respostas
                      </Text>
                    </Space>
                  }
                />
              </Card>
            </List.Item>
          )}
        />
      )}
    </Modal>
  );
}
```

### 3.3 ChecklistViewerModal

**Localização:** `apps/web/src/ui/components/ChecklistViewerModal.tsx`

**Função:** Modal para visualizar checklist completo com todas as respostas e fotos

```typescript
export default function ChecklistViewerModal({
  visible,
  onClose,
  checklist,
}: ChecklistViewerModalProps) {
  const [previewImage, setPreviewImage] = useState('');
  const [imagePreviewVisible, setImagePreviewVisible] = useState(false);

  if (!checklist) return null;

  // ✅ Função para determinar status da resposta
  const getRespostaStatus = (resposta: ChecklistResposta) => {
    if (resposta.aguardandoFoto) {
      return { color: 'orange', icon: <ExclamationCircleOutlined />, text: 'Aguardando foto' };
    }
    if (resposta.fotosSincronizadas > 0) {
      return { color: 'green', icon: <CheckCircleOutlined />, text: 'Com foto' };
    }
    return { color: 'blue', icon: <CheckCircleOutlined />, text: 'Respondido' };
  };

  // ✅ Função para formatar tamanho do arquivo
  const formatFileSize = (bytes: bigint) => {
    const bytesNumber = Number(bytes);
    if (bytesNumber === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytesNumber) / Math.log(k));
    return parseFloat((bytesNumber / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // ✅ Função para abrir preview da imagem
  const handleImagePreview = (imagePath: string) => {
    setPreviewImage(imagePath);
    setImagePreviewVisible(true);
  };

  return (
    <>
      <Modal
        title={
          <Space>
            <EyeOutlined />
            <span>{checklist.checklist.nome}</span>
          </Space>
        }
        open={visible}
        onCancel={onClose}
        footer={null}
        width={1000}
        style={{ top: 20 }}
      >
        {/* ✅ Informações do checklist */}
        <Card size="small" style={{ marginBottom: 16 }}>
          <Space direction="vertical" size={4}>
            <Text strong>Eletricista: {checklist.eletricista.nome} ({checklist.eletricista.matricula})</Text>
            <Text>
              <CalendarOutlined /> {formatDateTime(checklist.dataPreenchimento).date} às {formatDateTime(checklist.dataPreenchimento).time}
            </Text>
            {checklist.latitude && checklist.longitude && (
              <Text>
                📍 Localização: {checklist.latitude}, {checklist.longitude}
              </Text>
            )}
          </Space>
        </Card>

        {/* ✅ Lista de respostas com fotos */}
        <Collapse
          items={checklist.ChecklistResposta.map((resposta, index) => {
            const status = getRespostaStatus(resposta);

            return {
              key: resposta.id,
              label: (
                <Space>
                  <span>{resposta.pergunta.nome}</span>
                  <Tag color={status.color} icon={status.icon}>
                    {status.text}
                  </Tag>
                  {resposta.ChecklistRespostaFoto.length > 0 && (
                    <Tag color="blue">
                      <CameraOutlined /> {resposta.ChecklistRespostaFoto.length} foto(s)
                    </Tag>
                  )}
                </Space>
              ),
              children: (
                <div>
                  {/* ✅ Informações da resposta */}
                  <Card size="small" style={{ marginBottom: 16 }}>
                    <Space direction="vertical" size={4}>
                      <Text strong>Resposta: {resposta.opcaoResposta.nome}</Text>
                      <Text>
                        <ClockCircleOutlined /> {formatDateTime(resposta.dataResposta).date} às {formatDateTime(resposta.dataResposta).time}
                      </Text>
                      {resposta.opcaoResposta.geraPendencia && (
                        <Alert
                          message="Esta resposta gera pendência"
                          type="warning"
                          showIcon
                          style={{ marginTop: 8 }}
                        />
                      )}
                    </Space>
                  </Card>

                  {/* ✅ FOTOS ASSOCIADAS À RESPOSTA */}
                  {resposta.ChecklistRespostaFoto.length > 0 && (
                    <>
                      <Divider orientation="left">
                        <Space>
                          <CameraOutlined />
                          <Text strong>Fotos ({resposta.ChecklistRespostaFoto.length})</Text>
                        </Space>
                      </Divider>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
                        {resposta.ChecklistRespostaFoto.map((foto) => {
                          const imageSrc = foto.urlPublica || foto.caminhoArquivo;
                          const hasValidSrc = imageSrc && imageSrc.trim() !== '';

                          return (
                            <Card
                              key={foto.id}
                              size="small"
                              hoverable={hasValidSrc}
                              onClick={() => hasValidSrc && handleImagePreview(imageSrc)}
                              style={{ cursor: hasValidSrc ? 'pointer' : 'default' }}
                            >
                              <div style={{ textAlign: 'center' }}>
                                {hasValidSrc ? (
                                  <Image
                                    src={imageSrc}
                                    alt={`Foto ${foto.id}`}
                                    style={{ width: '100%', height: 120, objectFit: 'cover' }}
                                    preview={false}
                                  />
                                ) : (
                                  <div style={{
                                    width: '100%',
                                    height: 120,
                                    backgroundColor: '#f5f5f5',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    border: '1px dashed #d9d9d9'
                                  }}>
                                    <Text type="secondary">URL não disponível</Text>
                                  </div>
                                )}
                                <div style={{ marginTop: 8 }}>
                                  <Text type="secondary" style={{ fontSize: 12 }}>
                                    Foto {foto.id}
                                  </Text>
                                  <br />
                                  <Text type="secondary" style={{ fontSize: 10 }}>
                                    {formatFileSize(foto.tamanhoBytes)} • {foto.mimeType}
                                  </Text>
                                  {!hasValidSrc && (
                                    <>
                                      <br />
                                      <Text type="danger" style={{ fontSize: 10 }}>
                                        URL: {imageSrc || 'vazio'}
                                      </Text>
                                    </>
                                  )}
                                </div>
                              </div>
                            </Card>
                          );
                        })}
                      </div>
                    </>
                  )}

                  {/* ✅ Mensagem se não há fotos */}
                  {resposta.ChecklistRespostaFoto.length === 0 && (
                    <Empty
                      description="Nenhuma foto associada a esta resposta"
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                    />
                  )}
                </div>
              ),
            };
          })}
        />
      </Modal>

      {/* ✅ Preview de Imagem */}
      {previewImage && previewImage.trim() !== '' && (
        <Image
          style={{ display: 'none' }}
          src={previewImage}
          preview={{
            visible: imagePreviewVisible,
            onVisibleChange: setImagePreviewVisible,
          }}
        />
      )}
    </>
  );
}
```

---

## 🔍 4. ESTRUTURA DE DADOS RETORNADA

### 4.1 ChecklistPreenchido (Interface)

```typescript
interface ChecklistPreenchido {
  id: number;
  uuid: string; // ✅ UUID obrigatório
  dataPreenchimento: string;
  latitude?: number | null;
  longitude?: number | null;
  checklist: {
    id: number;
    nome: string;
    tipoChecklist: {
      id: number;
      nome: string;
    };
  };
  eletricista: {
    id: number;
    nome: string;
    matricula: string;
  };
  ChecklistResposta: Array<{
    id: number;
    dataResposta: string;
    aguardandoFoto: boolean;
    fotosSincronizadas: number;
    pergunta: {
      id: number;
      nome: string;
    };
    opcaoResposta: {
      id: number;
      nome: string;
      geraPendencia: boolean;
    };
    ChecklistRespostaFoto: Array<{
      id: number;
      caminhoArquivo: string;
      urlPublica?: string;
      tamanhoBytes: bigint;
      mimeType: string;
      sincronizadoEm: string;
      createdAt: string;
    }>;
  }>;
}
```

### 4.2 ChecklistRespostaFoto (Interface)

```typescript
interface ChecklistRespostaFoto {
  id: number;
  caminhoArquivo: string; // ✅ Caminho do arquivo no servidor
  urlPublica?: string; // ✅ URL pública (se disponível)
  tamanhoBytes: bigint; // ✅ Tamanho em bytes
  mimeType: string; // ✅ Tipo MIME (image/jpeg, image/png, etc.)
  sincronizadoEm: string; // ✅ Data de sincronização
  createdAt: string; // ✅ Data de criação
}
```

---

## 🎯 5. FLUXO COMPLETO DE BUSCA E EXIBIÇÃO

### 5.1 Passo a Passo

#### **Passo 1: Usuário clica em "Checklists" na tabela de turnos**

```typescript
// TurnosPage.tsx
const handleViewChecklists = (turno: TurnoData) => {
  setSelectedTurno(turno);
  setChecklistSelectorVisible(true); // ✅ Abre modal de seleção
};
```

#### **Passo 2: ChecklistSelectorModal busca checklists do turno**

```typescript
// ChecklistSelectorModal.tsx
const fetchChecklists = useCallback(async () => {
  setLoading(true);
  try {
    // ✅ Chama Server Action
    const result = await getChecklistsByTurno({ turnoId });

    if (result.success && result.data) {
      setChecklists(result.data); // ✅ Armazena checklists encontrados
    }
  } catch (error) {
    console.error('Erro ao buscar checklists:', error);
  } finally {
    setLoading(false);
  }
}, [turnoId]);
```

#### **Passo 3: Server Action executa query no banco**

```typescript
// getByTurno.ts
const checklistsPreenchidos = await prisma.checklistPreenchido.findMany({
  where: {
    turnoId: data.turnoId,
    deletedAt: null,
  },
  include: {
    // ✅ Inclui checklist modelo, eletricista, respostas E fotos
    ChecklistResposta: {
      include: {
        ChecklistRespostaFoto: {
          where: { deletedAt: null },
          select: {
            id: true,
            caminhoArquivo: true,
            urlPublica: true,
            tamanhoBytes: true,
            mimeType: true,
            sincronizadoEm: true,
            createdAt: true,
          },
        },
      },
    },
  },
});
```

#### **Passo 4: Usuário seleciona checklist específico**

```typescript
// ChecklistSelectorModal.tsx
const handleSelectChecklist = (checklist: ChecklistPreenchido) => {
  onSelectChecklist(checklist); // ✅ Passa checklist selecionado
  onClose(); // ✅ Fecha modal de seleção
};
```

#### **Passo 5: ChecklistViewerModal exibe checklist com fotos**

```typescript
// ChecklistViewerModal.tsx
{resposta.ChecklistRespostaFoto.map((foto) => {
  const imageSrc = foto.urlPublica || foto.caminhoArquivo;
  const hasValidSrc = imageSrc && imageSrc.trim() !== '';

  return (
    <Card key={foto.id} onClick={() => hasValidSrc && handleImagePreview(imageSrc)}>
      {hasValidSrc ? (
        <Image
          src={imageSrc}
          alt={`Foto ${foto.id}`}
          style={{ width: '100%', height: 120, objectFit: 'cover' }}
        />
      ) : (
        <div>URL não disponível</div>
      )}
    </Card>
  );
})}
```

### 5.2 Debug e Logs

#### **Logs da Server Action:**

```
🔍 [getChecklistsByTurno] Buscando checklists do turno: 54
✅ [getChecklistsByTurno] Checklists encontrados: 4
🔍 [DEBUG] Fotos encontradas diretamente no banco: 0
🔍 [DEBUG] Checklist 1: { id: 148, uuid: "550e8400-e29b-41d4-a716-446655440000", totalRespostas: 7, respostasComFoto: 0 }
📋 [DEBUG] Resposta 1: { respostaId: 586, perguntaId: 1, opcaoRespostaId: 1, aguardandoFoto: false, fotosSincronizadas: 0, totalFotosEncontradas: 0, fotos: [] }
```

#### **Logs do Frontend:**

```
Erro ao buscar checklists: [erro detalhado]
```

---

## 🔧 6. TRATAMENTO DE ERROS E VALIDAÇÕES

### 6.1 Validações de Imagem

```typescript
// ChecklistViewerModal.tsx
const imageSrc = foto.urlPublica || foto.caminhoArquivo;
const hasValidSrc = imageSrc && imageSrc.trim() !== '';

// ✅ Só renderiza imagem se URL for válida
{hasValidSrc ? (
  <Image src={imageSrc} alt={`Foto ${foto.id}`} />
) : (
  <div>URL não disponível</div>
)}
```

### 6.2 Tratamento de Estados de Loading

```typescript
// ChecklistSelectorModal.tsx
{loading ? (
  <div style={{ textAlign: 'center', padding: '50px' }}>
    <Spin size="large" />
  </div>
) : checklists.length === 0 ? (
  <Empty description="Nenhum checklist encontrado para este turno" />
) : (
  // ✅ Renderiza lista de checklists
)}
```

### 6.3 Validação de Dados

```typescript
// getByTurno.ts
if (result.success && result.data) {
  setChecklists(result.data);
} else {
  console.error('Erro ao buscar checklists:', result.error);
  setChecklists([]); // ✅ Fallback para array vazio
}
```

---

## 📊 7. PERFORMANCE E OTIMIZAÇÕES

### 7.1 Queries Otimizadas

```typescript
// ✅ Usa select específico para evitar dados desnecessários
select: {
  id: true,
  caminhoArquivo: true,
  urlPublica: true,
  tamanhoBytes: true,
  mimeType: true,
  sincronizadoEm: true,
  createdAt: true,
}
```

### 7.2 Lazy Loading

```typescript
// ✅ Só busca dados quando modal está visível
useEffect(() => {
  if (visible && turnoId) {
    fetchChecklists();
  }
}, [visible, turnoId, fetchChecklists]);
```

### 7.3 Memoização

```typescript
// ✅ Evita re-renders desnecessários
const fetchChecklists = useCallback(async () => {
  // ... lógica de busca
}, [turnoId]);
```

---

## 🎯 8. PONTOS IMPORTANTES

### 8.1 Relacionamento de Dados

- **✅ NOVA LÓGICA:** Busca direta em `MobilePhoto` usando `turnoId` + `checklistUuid` + `perguntaId`
- **✅ Fotos são identificadas pela combinação única** de turno + checklist + pergunta
- **✅ Uma resposta pode ter múltiplas fotos** do mesmo tipo
- **✅ Não depende mais** do relacionamento `ChecklistResposta` → `ChecklistRespostaFoto`

### 8.2 Campos de Foto

- **✅ `urlPublica`**: URL pública da foto (preferencial)
- **✅ `caminhoArquivo`**: Caminho interno do arquivo (fallback)
- **✅ `tamanhoBytes`**: Tamanho em bytes (para exibição)
- **✅ `mimeType`**: Tipo MIME (para validação)

### 8.3 Estados de Checklist

- **✅ `aguardandoFoto`**: Resposta aguardando foto de pendência
- **✅ `fotosSincronizadas`**: Contador de fotos já sincronizadas
- **✅ Status visual**: Orange (aguardando), Green (completo), Blue (preenchido)

### 8.4 Debug e Monitoramento

- **✅ Logs detalhados** em todas as etapas
- **✅ Contadores** de fotos encontradas
- **✅ Validação** de URLs de imagem
- **✅ Fallbacks** para dados ausentes

---

## 🚨 9. PROBLEMAS COMUNS E SOLUÇÕES

### 9.1 Fotos Não Aparecem

**Problema:** Fotos não são exibidas no frontend

**Possíveis Causas:**

1. **UUID não enviado pelo app** → Fotos não são encontradas na busca
2. **URLs inválidas** → `urlPublica` ou `caminhoArquivo` estão vazios
3. **Fotos não salvas em MobilePhoto** → App não está enviando fotos corretamente
4. **PerguntaId incorreto** → Fotos não são associadas à resposta correta

**Soluções:**

1. **Verificar logs** da Server Action para ver quantas fotos são encontradas
2. **Verificar URLs** das fotos nos logs de debug
3. **Confirmar dados** em MobilePhoto: `turnoId`, `checklistUuid`, `checklistPerguntaId`
4. **Testar busca direta** no banco: `SELECT * FROM MobilePhoto WHERE turnoId = X AND checklistUuid = Y`

### 9.2 Performance Lenta

**Problema:** Carregamento lento dos checklists

**Soluções:**

1. **Otimizar queries** com select específico
2. **Implementar paginação** para turnos com muitos checklists
3. **Cache** de dados frequentemente acessados

### 9.3 Erros de Validação

**Problema:** Erros ao exibir imagens

**Soluções:**

1. **Validar URLs** antes de renderizar Image component
2. **Fallback** para placeholder quando URL inválida
3. **Tratamento de erros** com try/catch

---

## 📝 10. RESUMO

### 10.1 Fluxo Completo

1. **Usuário** clica em "Checklists" na tabela de turnos
2. **ChecklistSelectorModal** abre e busca checklists via `getChecklistsByTurno`
3. **Server Action** executa query com includes completos (checklist, eletricista, respostas, fotos)
4. **Modal** exibe lista de checklists com status visual
5. **Usuário** seleciona checklist específico
6. **ChecklistViewerModal** abre e exibe checklist completo
7. **Fotos** são renderizadas com validação de URL e preview

### 10.2 Pontos Críticos

- **✅ UUID obrigatório** para vinculação correta de fotos
- **✅ Validação de URLs** para evitar erros de renderização
- **✅ Logs detalhados** para debugging
- **✅ Fallbacks** para dados ausentes
- **✅ Performance otimizada** com queries específicas

**O sistema está preparado para trabalhar com UUIDs e exibir fotos corretamente quando os dados
estão vinculados adequadamente!** 🎉
