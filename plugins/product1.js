import fs from 'fs';

const handler = async (m, { conn, args, command }) => {
  const img = 'https://telegra.ph/file/952f410bc89e6d396cdc0.jpg';
  const alicia = `
*≡ SCRIP Ini Di Jual*
*SCRIPT PREMIUM*

「 *Yui-Hoshikawa V2* 」

⛊ Special Features :
" *Cai character/ai character* "
" *Diffusion/animedif* ",
" *Neima/midjourney* ",
" *Aivoice/ttsanime/micmonster* ",
" *Ai, ChatGpt, Bard* ",
" *Ulartangga* ",
" *Play ytmp43* ",
" *Bingimage/realistic* ",
" *Owner, Creator, Mods* ",
" *Txt2img/txt3img* ",
" *Zetavoice/kobovoice* ", 
" *Jadianime/storyanime* ", 
💡 _Masih banyak lagi ya guys_

Benefits :
☰ Free Updates Insyaallah 😹
☰ Bonus ApiKey Premium🤭

Jika Kalian Berminat :
- Hubungin (6288268142831)
🏷️ HARGA : *50.000*
  `;
  
  await conn.sendFile(m.chat, img, 'payment.jpg', `${alicia}`, m);
};

handler.help = ['product1'];
handler.command = /^(product1)$/i;

export default handler;