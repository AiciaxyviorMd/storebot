import fs from 'fs';

const handler = async (m, { conn, args, command }) => {
  const img = 'https://telegra.ph/file/6bc4c642a37db7e3b7cfa.jpg';
  const alicia = `
    *≡ SCRIP Ini Di Jual*
*SCRIPT STORE*

「 *SCRIP STORE* 」

⛊  :
Scrip Bot Ini Hanya Untuk Berjualan

Sistem Fitur Ada 3
product1
product2
product3

Jika Kalian Ingin Req Fitur Silahkan Hub Owner.

Jika Kalian Berminat :
- Hubungin (6288268142831)
🏷️ HARGA : *20.000*
  `;
  
  await conn.sendFile(m.chat, img, 'payment.jpg', `${alicia}`, m);
};

handler.help = ['product2'];
handler.command = /^(product2)$/i;

export default handler;