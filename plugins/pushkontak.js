let handler = async (m, { conn, groupMetadata, usedPrefix, text, command }) => {
	if (!text && !m.quoted) return m.reply("Input text\nReply pesan");
	let get = await groupMetadata.participants
		.filter((v) => v.id.endsWith(".net"))
		.map((v) => v.id);
	let count = get.length;
	let sentCount = 0;
	m.reply("Tunggu Sebentar...");
	for (let i = 0; i < get.length; i++) {
		setTimeout(function () {
			if (text) {
				conn.sendMessage(get[i], {
					text: text,
				});
			} else if (m.quoted) {
				conn.copyNForward(get[i], m.getQuotedObj(), false);
			} else if (text && m.quoted) {
				conn.sendMessage(get[i], {
					text: text + "\n" + m.quoted.text,
				});
			}
			count--;
			sentCount++;
			if (count === 0) {
				m.reply(`Berhasil Pushkontak!\nJumlah terkirim: *${sentCount}*`);
			}
		}, i * 5000); // delay setiap pengiriman selama 5 detik
	}
};
handler.help = ["pushcontact"];
handler.command = ["pushkontak", "pushcontact"];
handler.group = true;
handler.rowner = true;

export default handler;
