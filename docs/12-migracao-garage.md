# Migração de produção para Garage privado

## Estado observado em 24/10/2026

- Aplicação: xsys, `/var/www/apps/nexa-oper`.
- Arquivos: `/var/www/data/nexa-oper/uploads`.
- Remote rclone: `garage:nexa`.
- Endpoint atual: `https://storage.aporia.software`; região `garage`.
- Histórico registra 83.538 arquivos copiados e zero diferenças no check.
- API e Web executam no PM2 do root. Não usar o PM2 vazio do usuário deploy.
- `fotos.nexa.xsys.team` serve o disco diretamente pelo Nginx atualmente.

## Preparação

Publicar o código revisado no fluxo habitual do projeto antes de ativar S3.
Não substituir o checkout de produção com alterações locais sem revisá-las.
Não executar o deploy completo com migrations desnecessárias apenas por esta
mudança: não há alteração de schema.

Guardar cópias dos envs, configuração Nginx e saída de `sudo pm2 list`.
Guardar também o artefato da versão anterior para rollback.
Credenciais devem ser inseridas no servidor, sem colar segredos no chat.

Configurar em `apps/api/.env` e `apps/web/.env.local`:

```dotenv
UPLOAD_STORAGE=s3
AWS_S3_BUCKET=nexa
AWS_REGION=garage
AWS_S3_ENDPOINT=https://storage.aporia.software
AWS_S3_FORCE_PATH_STYLE=true
AWS_ACCESS_KEY_ID=<chave existente>
AWS_SECRET_ACCESS_KEY=<segredo existente>
```

Na Web, manter a base de fotos existente e definir:

```dotenv
NEXT_PUBLIC_PHOTOS_BASE_URL=https://fotos.nexa.xsys.team/
UPLOAD_PROXY_TARGET=https://api.nexa.xsys.team
```

Não configurar o proxy de leitura para o próprio domínio Web, pois isso cria
um loop. Nenhuma credencial deve usar `NEXT_PUBLIC_`.

## Cópia final e corte

Fazer uma cópia incremental antecipada com `rclone copy` (não `sync`, não
`--delete`). Antes da cópia final, pausar entrada de requisições que gravam
arquivos e aguardar requisições em andamento terminarem. Parar os processos
API e Web identificados no PM2 do root, inclusive jobs que gravem arquivos.
O snapshot inicial tem arquivos novos desde sua execução.

```bash
rclone copy /var/www/data/nexa-oper/uploads garage:nexa --transfers 4 --checkers 4 --s3-no-check-bucket --retries 5 --log-file "$HOME/nexa-garage-final.log" --log-level INFO
rclone check /var/www/data/nexa-oper/uploads garage:nexa --one-way --download --checkers 4 --log-file "$HOME/nexa-garage-final-check.log" --log-level INFO
```

Verificar o código de saída e o resumo dos logs antes de continuar. Não apagar
a cópia local. O check com download pode levar cerca de meia hora; planejar
a janela. Se houver outras raízes legadas, inventariá-las e consolidá-las
antes do corte. Os nomes de objetos devem ser relativos à raiz de uploads,
sem acrescentar `uploads/` na frente.

Construir API e Web com os envs corretos e reiniciar os processos Nexa
identificados no PM2 do root. Não reiniciar outras aplicações.

No bloco HTTPS de `fotos.nexa.xsys.team`, substituir os locations que servem
o disco (inclusive o regex das extensões) por:

```nginx
location / {
    proxy_pass http://127.0.0.1:3001;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_read_timeout 300s;
}
```

Preservar certificados e redirecionamento HTTP. Rodar `sudo nginx -t` antes
de `sudo systemctl reload nginx`. O domínio API já encaminha para a API.

## Validação antes de reabrir

- Buscar um arquivo antigo via API e via domínio de fotos; comparar SHA-256
  com o objeto e o arquivo local. Testar também `/mobile/photos/*`.
- Fazer upload autenticado de uma nova evidência, conferir presença no bucket
  e leitura pelos dois domínios. Confirmar que não criou arquivo local.
- Testar anexo de justificativa e publicação/download de APK.
- Testar HEAD, Range (206), ETag (304), arquivo inexistente (404).
- Confirmar ausência de redirecionamentos para Garage e de segredos nas URLs.
- Conferir logs API/Web, saúde do PM2 e comportamento dos jobs de checklist.

## VPN

Depois de estabelecer a VPN, testar o endpoint privado a partir do xsys com
requisição S3 assinada. Alterar `AWS_S3_ENDPOINT` nos dois envs e reiniciar
API/Web. Só então fechar o acesso público ao serviço S3; não expor as portas
administrativas do Garage. Os clientes continuam usando os domínios Nexa.

## Rollback

Antes de qualquer nova gravação no S3, pode restaurar envs, artefato anterior
e Nginx e reiniciar. Depois de novas gravações, pausar escritores e copiar os
objetos novos do bucket para o disco com `rclone copy garage:nexa
/var/www/data/nexa-oper/uploads` e verificar integridade antes de voltar a
`UPLOAD_STORAGE=local`. Sem essa cópia de retorno, novos arquivos ficam
inacessíveis ao voltar para disco. Não apagar objetos nem arquivos no rollback.
