/*
 * Nama Pengembang: Aliciazyn
 * Kontak Whatsapp: wa.me/6288268142831
 * Akun Github: github.com/AiciaxyviorMd
 * Catatan: tolong laporkan kepada saya ketika anda menemukan ada yang menjual script ini
 */

/*
 * Nama Pengembang: Aliciazyn
 * Kontak Whatsapp: wa.me/6288268142831
 * Akun Github: github.com/AiciaxyviorMd
 * Catatan: tolong laporkan kepada saya ketika anda menemukan ada yang menjual script ini
 */

import { promises } from "fs";
import { join } from "path";

let handler = async function (m, { conn, __dirname }) {
	let _package =
		JSON.parse(
			await promises
				.readFile(join(__dirname, "../package.json"))
				.catch((_) => ({})),
		) || {};

	m.reply(
		`
*TRANSAKSI & METODE PEMBAYARAN*

-  (Dana/Pulsa)

*CARA MELAKUKAN TRANSAKSI*

1. Lakukan transfer ke salah satu metode diatas.
2. Kirim bukti transfer berupa screenshot.
3. Proses Jika sudah ada bukti berupa transfer
4. proses produk yang ada order kami kirimkan 
5. Next Jangan di perjual Belikan
`.trim(),
	);
};

handler.help = ["deal2"];
handler.command = ["deal2"];

export default handler;
