/*
 * Nama Pengembang: Aliciazyn
 * Kontak Whatsapp: wa.me/6288268142831
 * Akun Github: github.com/AiciaxyviorMd
 * Catatan: tolong laporkan kepada saya ketika anda menemukan ada yang menjual script ini
 */

import fs from 'fs';

const handler = async (m, { conn, args, command }) => {
  const img = 'https://telegra.ph/file/0193de6ceec4d0a2c116c.jpg';
  const alicia = `
    To display product information use the command : *.product number*
*Example* : .product1

*1. SCRIPT PREMIUM*
*2. SCRIPT STORE*
*3. VPS*

© store Bot By Alicia ッ
  `;
  
  await conn.sendFile(m.chat, img, 'payment.jpg', `${alicia}`, m);
};

handler.help = ['product'];
handler.command = /^(product)$/i;

export default handler;