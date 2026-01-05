'use client';

import { Modal, Form, Input, Select, Space, Button, Upload, message } from 'antd';
import { UploadOutlined, PaperClipOutlined } from '@ant-design/icons';
import { Falta } from '@/lib/schemas/turnoRealizadoSchema';
import { useEffect, useState } from 'react';
import type { UploadFile } from 'antd/es/upload/interface';
import type { UploadChangeEvent } from '@/lib/types/antd';

const { TextArea } = Input;

interface JustificarFaltaModalProps {
  open: boolean;
  onClose: () => void;
  onJustificar: (data: {
    faltaId: number;
    tipoJustificativaId: number;
    descricao?: string;
    anexos?: File[];
  }) => Promise<void>;
  falta: Falta | null;
  loading?: boolean;
  tiposJustificativa?: Array<{ id: number; nome: string }>;
}

/**
 * Modal para justificar uma falta
 *
 * Nota: Este é um modal básico. A implementação completa deve integrar
 * com o sistema de justificativas existente (Justificativa, TipoJustificativa, etc.)
 */
export default function JustificarFaltaModal({
  open,
  onClose,
  onJustificar,
  falta,
  loading = false,
  tiposJustificativa = [],
}: JustificarFaltaModalProps) {
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  useEffect(() => {
    if (open && falta) {
      form.resetFields();
      setFileList([]);
    }
  }, [open, falta, form]);

  const handleFileChange = (info: UploadChangeEvent) => {
    let newFileList = [...info.fileList];

    // Limitar a 5 arquivos
    newFileList = newFileList.slice(-5);

    // Validar tipo de arquivo (apenas imagens e PDFs)
    newFileList = newFileList.filter((file) => {
      const isValidType =
        file.type?.startsWith('image/') || file.type === 'application/pdf';
      if (!isValidType && file.originFileObj) {
        message.error(`${file.name} não é um arquivo válido. Use JPG, PNG, WEBP ou PDF.`);
        return false;
      }

      // Validar tamanho (10MB)
      const isValidSize = file.size ? file.size / 1024 / 1024 < 10 : true;
      if (!isValidSize) {
        message.error(`${file.name} excede o tamanho máximo de 10MB.`);
        return false;
      }

      return true;
    });

    setFileList(newFileList);
  };

  const handleRemove = (file: UploadFile) => {
    const index = fileList.indexOf(file);
    const newFileList = fileList.slice();
    newFileList.splice(index, 1);
    setFileList(newFileList);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (!falta) return;

      // Extrair arquivos originais
      const anexos = fileList
        .map((file) => file.originFileObj as File)
        .filter((file): file is File => file !== undefined);

      await onJustificar({
        faltaId: falta.id,
        tipoJustificativaId: values.tipoJustificativaId,
        descricao: values.descricao,
        anexos: anexos.length > 0 ? anexos : undefined,
      });

      form.resetFields();
      setFileList([]);
    } catch (error) {
      console.error('Erro ao justificar falta:', error);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setFileList([]);
    onClose();
  };

  return (
    <Modal
      title={falta ? `Justificar Falta - ${falta.eletricista.nome}` : 'Justificar Falta'}
      open={open}
      onCancel={handleCancel}
      footer={null}
      destroyOnHidden
      width={600}
    >
      {open && (
        <>
          {falta && (
            <div style={{ marginBottom: 16 }}>
              <p><strong>Data:</strong> {new Date(falta.dataReferencia).toLocaleDateString('pt-BR')}</p>
              <p><strong>Eletricista:</strong> {falta.eletricista.nome} ({falta.eletricista.matricula})</p>
              <p><strong>Equipe:</strong> {falta.equipe.nome}</p>
            </div>
          )}

          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
          >
        <Form.Item
          name="tipoJustificativaId"
          label="Tipo de Justificativa"
          rules={[{ required: true, message: 'Selecione um tipo de justificativa' }]}
        >
          <Select
            placeholder="Selecione o tipo"
            options={tiposJustificativa.map((t) => ({
              value: t.id,
              label: t.nome,
            }))}
          />
        </Form.Item>

        <Form.Item
          name="descricao"
          label="Descrição (opcional)"
        >
          <TextArea
            rows={4}
            placeholder="Descreva a justificativa da falta"
            maxLength={1000}
            showCount
          />
        </Form.Item>

        <Form.Item
          label="Anexar Atestado ou Documento"
          extra="Você pode anexar imagens (JPG, PNG, WEBP) ou PDFs. Máximo 5 arquivos, 10MB cada."
        >
          <Upload
            fileList={fileList}
            onChange={handleFileChange}
            onRemove={handleRemove}
            beforeUpload={() => false} // Prevenir upload automático
            accept="image/jpeg,image/png,image/webp,application/pdf"
            multiple
            maxCount={5}
          >
            <Button icon={<UploadOutlined />}>Selecionar Arquivo</Button>
          </Upload>
          {fileList.length > 0 && (
            <div style={{ marginTop: 8, fontSize: '12px', color: '#666' }}>
              {fileList.map((file, index) => (
                <div key={index} style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                  <PaperClipOutlined />
                  <span>{file.name}</span>
                  <span style={{ color: '#999' }}>
                    ({(file.size ? file.size / 1024 / 1024 : 0).toFixed(2)} MB)
                  </span>
                </div>
              ))}
            </div>
          )}
        </Form.Item>

        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" loading={loading}>
              Justificar
            </Button>
            <Button onClick={handleCancel}>Cancelar</Button>
          </Space>
        </Form.Item>
      </Form>
        </>
      )}
    </Modal>
  );
}

