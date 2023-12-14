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
*>LAPORAN ERROR & REQUEST<*

Kamu mempunyai kendala terkait script Yui-Hoshikawa ? sebelum mengirim laporan silahkan ikuti step berikut :

1. Baca readme terlebih dahulu sebelum melakukan instalasi.

2. Perbaiki sendiri dengan menggunakan bantuan Search Engine atau AI dengan kata kunci error yang kamu temukan di logs.

3. Jika memang kamu sudah tidak bisa memperbaikinya silahkan open issue di repository (https://github.com/AiciaxyviorMd/Yui-Hoshikawaa)

Apabila kamu pengguna script premium dan terjadi error di script default (bukan script tambahan) silahkan kirim screenshot + deskripsi di caption, owner akan membalas ketika online.

*NB* : Owner hanya memberikan bantuan teknis melalui chat WhastApp untuk pengguna script premium.
`.trim(),
	);
};

handler.help = ["deal1"];
handler.command = ["deal1"];

export default handler;
