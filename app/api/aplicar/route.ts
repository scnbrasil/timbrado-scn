import { NextRequest, NextResponse } from 'next/server';
import JSZip from 'jszip';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';
export const maxDuration = 30;

const HEADER_REL_ID = 'rId_scn_h';
const FOOTER_REL_ID = 'rId_scn_f';

// Margens padrão usadas quando o documento não tem nenhuma definida
const PG_MAR_DEFAULT =
  '<w:pgMar w:top="2041" w:right="1701" w:bottom="1418" w:left="1701" w:header="709" w:footer="709" w:gutter="0"/>';

const TEMPLATE_FILES = [
  'word/header1.xml',
  'word/footer1.xml',
  'word/_rels/header1.xml.rels',
  'word/_rels/footer1.xml.rels',
  'word/media/image1.jpeg',
  'word/media/image2.png',
];

// ── Injeção do timbrado ───────────────────────────────────────────────────────

async function updateContentTypes(zip: JSZip): Promise<void> {
  const file = zip.file('[Content_Types].xml');
  if (!file) return;
  let xml = await file.async('string');
  const add: string[] = [];
  if (!xml.includes('wordprocessingml.header'))
    add.push('<Override PartName="/word/header1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml"/>');
  if (!xml.includes('wordprocessingml.footer'))
    add.push('<Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/>');
  if (!xml.match(/Extension="jpe?g"/i))
    add.push('<Default Extension="jpeg" ContentType="image/jpeg"/>');
  if (!xml.includes('Extension="png"'))
    add.push('<Default Extension="png" ContentType="image/png"/>');
  if (add.length > 0) {
    xml = xml.replace('</Types>', add.join('') + '</Types>');
    zip.file('[Content_Types].xml', xml);
  }
}

async function updateDocumentXml(zip: JSZip): Promise<void> {
  const file = zip.file('word/document.xml');
  if (!file) throw new Error('word/document.xml não encontrado.');
  let xml = await file.async('string');

  // Remover referências de header/footer existentes (serão substituídas pelo SCN)
  xml = xml.replace(/<w:headerReference\b[^>]*\/?>/g, '');
  xml = xml.replace(/<w:footerReference\b[^>]*\/?>/g, '');

  // Atualizar pgMar: preservar margens esquerda/direita originais do documento.
  // Apenas garantir espaço mínimo para o cabeçalho/rodapé no topo/base.
  if (/<w:pgMar\b/.test(xml)) {
    xml = xml.replace(/<w:pgMar\b([^>]*)\/?>/g, (_match, attrs: string) => {
      const get = (name: string, fallback: number): number => {
        const m = attrs.match(new RegExp(`w:${name}="(\\d+)"`));
        return m ? parseInt(m[1], 10) : fallback;
      };
      const top    = Math.max(get('top', 2041), 2041);
      const bottom = Math.max(get('bottom', 1418), 1418);
      const left   = get('left', 1701);
      const right  = get('right', 1701);
      const gutter = get('gutter', 0);
      return `<w:pgMar w:top="${top}" w:right="${right}" w:bottom="${bottom}" w:left="${left}" w:header="709" w:footer="709" w:gutter="${gutter}"/>`;
    });
  } else {
    // Nenhum pgMar no documento: adicionar o padrão
    xml = xml.replace(/<\/w:sectPr>/g, PG_MAR_DEFAULT + '</w:sectPr>');
  }

  // Expandir <w:sectPr/> auto-fechante (gerado por alguns editores mínimos)
  xml = xml.replace(/<w:sectPr\s*\/>/g, `<w:sectPr>${PG_MAR_DEFAULT}</w:sectPr>`);

  // Injetar referências ao cabeçalho e rodapé SCN
  const hfRefs =
    `<w:headerReference w:type="default" r:id="${HEADER_REL_ID}"/>` +
    `<w:footerReference w:type="default" r:id="${FOOTER_REL_ID}"/>`;
  xml = xml.replace(/<\/w:sectPr>/g, hfRefs + '</w:sectPr>');

  zip.file('word/document.xml', xml);
}

async function updateDocumentRels(zip: JSZip): Promise<void> {
  const file = zip.file('word/_rels/document.xml.rels');
  if (!file) return;
  let xml = await file.async('string');

  xml = xml.replace(/<Relationship\b[^>]*Type="[^"]*\/header"[^>]*\/?>/g, '');
  xml = xml.replace(/<Relationship\b[^>]*Type="[^"]*\/footer"[^>]*\/?>/g, '');
  xml = xml.replace(new RegExp(`<Relationship\\b[^>]*Id="${HEADER_REL_ID}"[^>]*\\/?>`, 'g'), '');
  xml = xml.replace(new RegExp(`<Relationship\\b[^>]*Id="${FOOTER_REL_ID}"[^>]*\\/?>`, 'g'), '');

  const newRels =
    `<Relationship Id="${HEADER_REL_ID}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/header" Target="header1.xml"/>` +
    `<Relationship Id="${FOOTER_REL_ID}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer1.xml"/>`;

  xml = xml.replace('</Relationships>', newRels + '</Relationships>');
  zip.file('word/_rels/document.xml.rels', xml);
}

// ── Handler principal ─────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado.' }, { status: 400 });
    }

    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith('.docx') && !fileName.endsWith('.doc')) {
      return NextResponse.json(
        { error: 'Apenas arquivos .doc e .docx são aceitos.' },
        { status: 400 },
      );
    }

    const userBuffer = Buffer.from(await file.arrayBuffer());

    // Detectar .doc binário OLE (Word 97-2003) pelos magic bytes D0 CF 11 E0
    const isOleBinary =
      userBuffer[0] === 0xd0 &&
      userBuffer[1] === 0xcf &&
      userBuffer[2] === 0x11 &&
      userBuffer[3] === 0xe0;

    if (isOleBinary) {
      return NextResponse.json(
        {
          error:
            'Formato .doc binário (Word 97-2003) não é suportado.\n\n' +
            'Para preservar toda a formatação, abra o arquivo no Word → Arquivo → Salvar Como → selecione "Documento do Word (.docx)" → envie o arquivo .docx.',
        },
        { status: 400 },
      );
    }

    const templatePath = path.join(process.cwd(), 'public', 'timbrado_scn.docx');
    if (!fs.existsSync(templatePath)) {
      return NextResponse.json(
        { error: 'Template timbrado_scn.docx não encontrado no servidor.' },
        { status: 500 },
      );
    }
    const templateBuffer = fs.readFileSync(templatePath);

    let userZip: JSZip;
    try {
      userZip = await JSZip.loadAsync(userBuffer);
    } catch {
      return NextResponse.json(
        { error: 'O arquivo enviado não é um .docx válido ou está corrompido.' },
        { status: 400 },
      );
    }

    const templateZip = await JSZip.loadAsync(templateBuffer);

    for (const filePath of TEMPLATE_FILES) {
      const tplFile = templateZip.file(filePath);
      if (tplFile) {
        userZip.file(filePath, await tplFile.async('nodebuffer'));
      }
    }

    await updateContentTypes(userZip);
    await updateDocumentXml(userZip);
    await updateDocumentRels(userZip);

    const outputBuffer = await userZip.generateAsync({
      type: 'nodebuffer',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    });

    const baseName = file.name.replace(/\.docx?$/i, '');
    const outputName = `timbrado_${baseName}.docx`;

    return new NextResponse(new Uint8Array(outputBuffer), {
      status: 200,
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(outputName)}`,
        'Content-Length': outputBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('[timbrado] Erro:', error);
    const msg =
      error instanceof Error ? error.message : 'Erro interno ao processar o documento.';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
