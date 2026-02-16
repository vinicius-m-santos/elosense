# Configuração do S3 para avatares

O upload de foto de perfil usa Amazon S3. Se você receber o erro **NoSuchBucket** ao atualizar a imagem no perfil, o bucket ainda não foi criado.

## Como corrigir

1. Acesse o [Console AWS S3](https://s3.console.aws.amazon.com/).
2. Clique em **Criar bucket**.
3. **Nome do bucket**: use exatamente o valor da variável `AWS_BUCKET` do seu `.env` (ex.: `elosense`).
4. **Região**: escolha a **mesma região** configurada em `AWS_REGION` no `.env` (ex.: `sa-east-1` para São Paulo).
5. Crie o bucket com as permissões desejadas (bloqueio público opcional; o app usa presigned URLs para leitura).
6. Garanta que a chave de acesso (AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY) tenha permissão de `s3:PutObject`, `s3:GetObject` e `s3:DeleteObject` nesse bucket.

Após criar o bucket, tente novamente atualizar a imagem no perfil.
