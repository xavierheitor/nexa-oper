'use client';

import { CheckOutlined } from '@ant-design/icons';
import type { AtividadeAprRespostaDetalhe } from '@/lib/types/atividadeDashboard';
import { Card, Empty, Space, Typography } from 'antd';
import { useMemo, type ReactNode } from 'react';

const { Text } = Typography;

interface AprRespostaGrupo {
  key: string;
  ordemGrupo: number;
  nome: string;
  respostas: AtividadeAprRespostaDetalhe[];
  temMedidasControle: boolean;
}

function groupAprRespostas(
  respostas: AtividadeAprRespostaDetalhe[],
): AprRespostaGrupo[] {
  const grupos = new Map<string, AprRespostaGrupo>();

  for (const resposta of respostas) {
    const ordemGrupo = resposta.ordemGrupo ?? 0;
    const nome = resposta.grupoNomeSnapshot?.trim() || 'Sem grupo';
    const key = `${ordemGrupo}::${nome}`;

    const grupo = grupos.get(key);
    if (grupo) {
      grupo.respostas.push(resposta);
    } else {
      grupos.set(key, {
        key,
        ordemGrupo,
        nome,
        respostas: [resposta],
        temMedidasControle: false,
      });
    }
  }

  return Array.from(grupos.values())
    .map(grupo => {
      const respostasOrdenadas = [...grupo.respostas].sort(
        (a, b) => a.ordemPergunta - b.ordemPergunta,
      );

      return {
        ...grupo,
        respostas: respostasOrdenadas,
        temMedidasControle: respostasOrdenadas.some(
          resposta =>
            (resposta.AtividadeAprRespostaMedidaControle?.length ?? 0) > 0,
        ),
      };
    })
    .sort((a, b) => a.ordemGrupo - b.ordemGrupo);
}

function isRespostaMarcador(resposta: AtividadeAprRespostaDetalhe) {
  return (
    typeof resposta.marcado === 'boolean' &&
    !resposta.respostaTexto &&
    !resposta.opcaoNomeSnapshot
  );
}

function renderValorResposta(resposta: AtividadeAprRespostaDetalhe): ReactNode {
  if (resposta.respostaTexto) {
    return <Text type='secondary'>{resposta.respostaTexto}</Text>;
  }

  if (typeof resposta.marcado === 'boolean') {
    return resposta.marcado ? (
      <CheckOutlined style={{ color: '#52c41a', fontSize: 16 }} />
    ) : null;
  }

  if (resposta.opcaoNomeSnapshot) {
    return <Text>{resposta.opcaoNomeSnapshot}</Text>;
  }

  return null;
}

function AprRespostaItem({
  resposta,
  showMedidas,
  isLast,
}: {
  resposta: AtividadeAprRespostaDetalhe;
  showMedidas: boolean;
  isLast: boolean;
}) {
  const medidas = resposta.AtividadeAprRespostaMedidaControle || [];
  const marcador = isRespostaMarcador(resposta);
  const valorResposta = renderValorResposta(resposta);

  return (
    <div
      style={{
        display: 'flex',
        gap: 10,
        alignItems: 'flex-start',
        padding: '8px 0',
        borderBottom: isLast ? undefined : '1px solid #f5f5f5',
      }}
    >
      {marcador ? (
        <div style={{ width: 24, flexShrink: 0, paddingTop: 2 }}>
          {valorResposta}
        </div>
      ) : null}

      <div style={{ flex: 1, minWidth: 0 }}>
        <Text>{resposta.perguntaNomeSnapshot}</Text>

        {!marcador && valorResposta ? (
          <div style={{ marginTop: 4 }}>{valorResposta}</div>
        ) : null}

        {showMedidas && medidas.length > 0 ? (
          <ul
            style={{
              margin: '6px 0 0',
              paddingLeft: 18,
              color: '#595959',
            }}
          >
            {medidas.map(medida => (
              <li key={medida.id}>
                {medida.textoLivre
                  ? `${medida.medidaControleNomeSnapshot}: ${medida.textoLivre}`
                  : medida.medidaControleNomeSnapshot}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}

interface AprRespostasAgrupadasProps {
  respostas: AtividadeAprRespostaDetalhe[];
}

export default function AprRespostasAgrupadas({
  respostas,
}: AprRespostasAgrupadasProps) {
  const grupos = useMemo(() => groupAprRespostas(respostas), [respostas]);

  if (!grupos.length) {
    return (
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description='Sem respostas na APR.'
      />
    );
  }

  return (
    <Space direction='vertical' size={12} style={{ width: '100%' }}>
      {grupos.map(grupo => (
        <Card key={grupo.key} size='small' title={grupo.nome}>
          {grupo.respostas.map((resposta, index) => (
            <AprRespostaItem
              key={resposta.id}
              resposta={resposta}
              showMedidas={grupo.temMedidasControle}
              isLast={index === grupo.respostas.length - 1}
            />
          ))}
        </Card>
      ))}
    </Space>
  );
}
