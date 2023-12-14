/*
 * Nama Pengembang: Aliciazyn
 * Kontak Whatsapp: wa.me/6288268142831
 * Akun Github: github.com/AiciaxyviorMd
 * Catatan: tolong laporkan kepada saya ketika anda menemukan ada yang menjual script ini
 */

import fs from "fs";

const handler = async (m, { conn, args, command }) => {
	const img = "https://telegra.ph/file/01a3522954cf54cd5716f.jpg";
	const alicia = `
◦ *Bot store*
◦ *creator: [Alicia]*           
Hi! , Ini Bot store alicia Bot asisten Yang Di Buat Khusus Bantuan, Terkait Semua produk Tentang Produk, Jika ingin memesan sesuatu ikutin arahan comand yang ada di bawah ini

╭〣 
│ ∘ .log 
│ ∘ .deal *ɴᴏ*     
│ ∘ .getplugins  *ᴛᴇxᴛ*
│ ∘ .sf/.df  *ᴛᴇxᴛ*
│ ∘ .public/.self
│ ∘ .play *qᴜᴇʀʏ*      
│ ∘ .product *ɴᴏ*
│ ∘ .pushkontak *ᴛᴇxᴛ*
│ ∘ .translate *ᴛᴇxᴛ*
│ ∘ .ttsearch *qᴜᴇʀʏ*    
│ ∘ .web 
│ ∘ .ytmp3/4 *ʟɪɴᴋ*
╰─〣 
             
© store bot by alicia 
  `;

	await conn.sendFile(m.chat, img, "payment.jpg", `${alicia}`, m);
};

handler.help = ["menu"];
handler.command = /^(menu)$/i;

export default handler;