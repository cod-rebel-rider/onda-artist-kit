/* ==========================================================================
   Onda Artist Kit — Configurador
   zip.js — gerador de arquivos .zip no navegador, sem dependências.

   Implementa o formato ZIP usando o método STORE (sem compressão): o
   arquivo final é um pouco maior, mas o código é pequeno, auditável e o
   projeto permanece sem bibliotecas externas. Suporta texto (UTF-8) e
   binários (Uint8Array).
   ========================================================================== */

(() => {
  "use strict";

  /* Tabela CRC32 pré-calculada (polinômio 0xEDB88320, padrão do ZIP). */
  const CRC_TABLE = (() => {
    const table = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) {
        c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      }
      table[n] = c >>> 0;
    }
    return table;
  })();

  const crc32 = (bytes) => {
    let crc = 0xffffffff;
    for (let i = 0; i < bytes.length; i++) {
      crc = CRC_TABLE[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
    }
    return (crc ^ 0xffffffff) >>> 0;
  };

  const textBytes = (text) => new TextEncoder().encode(text);

  const writeU16 = (bytes, offset, value) => {
    bytes[offset] = value & 0xff;
    bytes[offset + 1] = (value >>> 8) & 0xff;
  };
  const writeU32 = (bytes, offset, value) => {
    bytes[offset] = value & 0xff;
    bytes[offset + 1] = (value >>> 8) & 0xff;
    bytes[offset + 2] = (value >>> 16) & 0xff;
    bytes[offset + 3] = (value >>> 24) & 0xff;
  };

  const dosDateTime = (date) => ({
    time: (date.getHours() << 11) | (date.getMinutes() << 5) | (Math.floor(date.getSeconds() / 2)),
    date: ((date.getFullYear() - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate()
  });

  /**
   * Cria um arquivo .zip a partir de uma lista de entradas.
   * @param {Array<{path: string, data: string|Uint8Array}>} entries
   * @returns {Uint8Array} conteúdo binário do .zip
   */
  const createZip = (entries) => {
    const now = dosDateTime(new Date());
    const locals = [];
    const centrals = [];
    let offset = 0;

    for (const entry of entries) {
      const nameBytes = textBytes(entry.path);
      const data = typeof entry.data === "string" ? textBytes(entry.data) : entry.data;
      const crc = crc32(data);

      const local = new Uint8Array(30 + nameBytes.length);
      writeU32(local, 0, 0x04034b50);
      writeU16(local, 4, 20);
      writeU16(local, 6, 0x0800);
      writeU16(local, 8, 0);
      writeU16(local, 10, now.time);
      writeU16(local, 12, now.date);
      writeU32(local, 14, crc);
      writeU32(local, 18, data.length);
      writeU32(local, 22, data.length);
      writeU16(local, 26, nameBytes.length);
      writeU16(local, 28, 0);
      local.set(nameBytes, 30);

      locals.push(local, data);

      const central = new Uint8Array(46 + nameBytes.length);
      writeU32(central, 0, 0x02014b50);
      writeU16(central, 4, 20);
      writeU16(central, 6, 20);
      writeU16(central, 8, 0x0800);
      writeU16(central, 10, 0);
      writeU16(central, 12, now.time);
      writeU16(central, 14, now.date);
      writeU32(central, 16, crc);
      writeU32(central, 20, data.length);
      writeU32(central, 24, data.length);
      writeU16(central, 28, nameBytes.length);
      writeU32(central, 42, offset);
      central.set(nameBytes, 46);
      centrals.push(central);

      offset += local.length + data.length;
    }

    const centralSize = centrals.reduce((sum, part) => sum + part.length, 0);
    const end = new Uint8Array(22);
    writeU32(end, 0, 0x06054b50);
    writeU16(end, 8, entries.length);
    writeU16(end, 10, entries.length);
    writeU32(end, 12, centralSize);
    writeU32(end, 16, offset);

    const total = offset + centralSize + end.length;
    const zip = new Uint8Array(total);
    let position = 0;
    for (const part of [...locals, ...centrals, end]) {
      zip.set(part, position);
      position += part.length;
    }
    return zip;
  };

  window.OndaZip = { createZip, crc32 };
})();