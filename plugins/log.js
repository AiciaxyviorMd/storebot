import fs from 'fs';

const handler = async (m, { conn, args, command }) => {
  const img = 'https://telegra.ph/file/6d73eb9ba3e703f2438dd.jpg';
  const alicia = `
    Hai teman-teman! 🌟
     1. "Selamat datang di store Alicia! ."
2. "Kami menyediakan berbagai pilihan produk terbaru."
3. "Dapatkan penawaran spesial hanya di store kami! Jangan lewatkan kesempatan ini."
4. "Kualitas adalah prioritas kami. Belanja di store kami adalah investasi yang tepat."
5. "Kami siap memberikan pelayanan terbaik untuk kepuasan pelanggan. Kunjungi store kami sekarang juga!"
6. " kami dan temukan keinginan terkini dengan harga terbaik."
7. "Kami mengutamakan kepercayaan pelanggan. Belanja di store kami."
8. "Store kami adalah tempat yang tepat untuk menemukan hadiah spesial bagi orang terkasih!"
9. "Dapatkan pengalaman berbelanja yang menyenangkan dan mudah di store kami. Kami siap membantu Anda."
10. " Jadilah bagian dari pelanggan setia kami!"

Terimakasih
  `;
  
  await conn.sendFile(m.chat, img, 'payment.jpg', `${alicia}`, m);
};

handler.help = ['log'];
handler.command = /^(log)$/i;

export default handler;