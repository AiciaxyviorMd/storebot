import youtube from "yt-search";
var handler = async (m, { conn, text, usedPrefix, command }) => {
	if (!text)
		throw `Masukkan Judul / Link YouTube!\n\nExample :\n${
			usedPrefix + command
		} nightchanges / ${
			usedPrefix + command
		} https://youtube.com/watch?v=IHHX9CEyJ24`;
	try {
		var search = await youtube(text);
		var convert = search.videos[0];
		if (!convert) throw "Video/Audio Tidak Ditemukan";
		var audioUrl;
		try {
			audioUrl = `https://aemt.me/youtube?url=${convert.url}&filter=audioonly&quality=highestaudio&contenttype=audio/mpeg`;
		} catch (e) {
			conn.reply(m.chat, wait, m);
			audioUrl = `https://aemt.me/youtube?url=${convert.url}&filter=audioonly&quality=highestaudio&contenttype=audio/mpeg`;
		}
		var caption = `- Title : ${convert.title}\n- Duration : ${convert.timestamp}\n- Upload At : ${convert.ago}\n∘ Author : ${convert.author.name}\n- Channel : ${convert.author.url}\n- Description : ${convert.description}\n\n_Audio Sedang Dikirim_`;
		var pesan = conn.relayMessage(
			m.chat,
			{
				extendedTextMessage: {
					text: caption,
					contextInfo: {
						externalAdReply: {
							title: "Play Music Youtube ❦",
							body: wait,
							mediaType: 1,
							previewType: 0,
							renderLargerThumbnail: true,
							thumbnailUrl: convert.image,
						},
					},
					mentions: [m.sender],
				},
			},
			{},
		);
		conn.sendMessage(
			m.chat,
			{
				audio: {
					url: audioUrl,
				},
				mimetype: "audio/mpeg",
				contextInfo: {
					externalAdReply: {
						title: convert.title,
						body: "© aemt.me",
						thumbnailUrl: convert.image,
						mediaType: 1,
						showAdAttribution: false,
						renderLargerThumbnail: true,
					},
				},
			},
			{
				quoted: m,
			},
		);
	} catch (e) {
		conn.reply(m.chat, `*Error:* ` + eror, m);
	}
};

handler.command = ["play"];
handler.help = ["play"];

export default handler;
