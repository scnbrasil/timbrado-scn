# Timbrado SCN

Aplicativo web para aplicar o cabeçalho e rodapé oficiais da SCN em documentos Word (.docx).

## Como funciona

1. O usuário faz upload de um arquivo `.docx`
2. O servidor injeta o cabeçalho e rodapé do `timbrado_scn.docx` (template)
3. O arquivo timbrado é devolvido para download imediato
4. Nenhum arquivo é armazenado no servidor

## Rodar localmente

```bash
npm install
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000)

## Deploy no Vercel

1. Faça push do projeto para um repositório GitHub
2. Acesse [vercel.com](https://vercel.com) e importe o repositório
3. Zero configuração necessária — o Vercel detecta Next.js automaticamente
4. Clique em **Deploy**

## Atualizar o timbrado

Para atualizar o modelo de cabeçalho/rodapé:

1. Substitua o arquivo `/public/timbrado_scn.docx` pelo novo modelo
2. Certifique-se de que o novo `.docx` contém:
   - `word/header1.xml` — XML do cabeçalho
   - `word/footer1.xml` — XML do rodapé
   - `word/_rels/header1.xml.rels` — relacionamentos do cabeçalho
   - `word/_rels/footer1.xml.rels` — relacionamentos do rodapé
   - `word/media/image1.jpeg` — logo do cabeçalho
   - `word/media/image2.png` — imagem do rodapé
3. Faça push — o Vercel fará redeploy automaticamente

## Estrutura do projeto

```
timbrado-scn/
├── app/
│   ├── layout.tsx              # Layout raiz
│   ├── page.tsx                # Página principal (upload + download)
│   ├── globals.css             # Estilos globais (Tailwind)
│   └── api/
│       └── aplicar/
│           └── route.ts        # API Route — processa o .docx no servidor
├── public/
│   └── timbrado_scn.docx       # Template do timbrado SCN
├── next.config.js
├── tailwind.config.js
├── vercel.json
└── package.json
```

## Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **JSZip** — manipulação de .docx como ZIP no servidor
