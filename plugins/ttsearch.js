import fetch from "node-fetch";
import axios from "axios";

const handler = async (m, { text, command }) => {
	if (!text) return m.reply("Masukkan pencarian!!");

	async function ttSearch(query) {
		return new Promise(async (resolve, reject) => {
			axios("https://tikwm.com/api/feed/search", {
				headers: {
					"content-type": "application/x-www-form-urlencoded; charset=UTF-8",
					cookie: "current_language=en",
					"User-Agent":
						"Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36",
				},
				data: {
					keywords: query,
					count: 12,
					cursor: 0,
					web: 1,
					hd: 1,
				},
				method: "POST",
			}).then((res) => {
				resolve(res.data.data);
			});
		});
	}

	let resre = await ttSearch(text);
	let asd = resre.videos[7].play;
	let wasd = "https://tikwm.com" + asd;

	conn.sendFile(m.chat, wasd, "", "", m);
};

handler.help = ["tiktoks *ᴛᴇxᴛ*"];
handler.command = ["ttsearch", "tiktoks", "tiktoksearch"];

export default handler;
