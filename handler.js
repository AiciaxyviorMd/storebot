import { smsg } from "./lib/simple.js";
import { format } from "util";
import { fileURLToPath } from "url";
import path, { join } from "path";
import { unwatchFile, watchFile } from "fs";
import chalk from "chalk";

import inserUsersDatas from "./lib/usersData.js";

/**
 * Handle messages upsert
 * @param {import('@adiwajshing/baileys').BaileysEventMap<unknown>['messages.upsert']} groupsUpdate
 */

export async function handler(chatUpdate) {
	this.msgqueque = this.msgqueque || [];
	if (!chatUpdate) return;
	// this.pushMessage(chatUpdate.messages).catch(console.error);
	let m = chatUpdate.messages[chatUpdate.messages.length - 1];

	if (!m) return;
	if (global.db.data == null) await global.loadDatabase();
	try {
		m = smsg(this, m) || m;
		if (!m) return;
		m.exp = 0;
		m.limit = false;
		try {
			// TODO: use loop to insert data instead of this;

			// wtf is this.
			let user = global.db.data.users[m.sender];
			let chat = global.db.data.chats[m.chat];
			let settings = global.db.data.settings[this.user.jid];
			inserUsersDatas(m, {
				user,
				chat,
				settings,
				conn,
			});
		} catch (e) {
			console.error(e);
		}
		if (opts["nyimak"]) return;
		if (!m.fromMe && opts["self"]) return;
		if (opts["pconly"] && m.chat.endsWith("g.us")) return;
		if (opts["gconly"] && !m.chat.endsWith("g.us")) return;
		if (opts["swonly"] && m.chat !== "status@broadcast") return;
		if (typeof m.text !== "string") m.text = "";

		const isROwner = [
			conn.decodeJid(global.conn.user.id),
			...global.owner.map(([number]) => number),
		]
			.map((v) => v.replace(/[^0-9]/g, "") + "@s.whatsapp.net")
			.includes(m.sender);
		const isOwner = isROwner || m.fromMe;
		const isMods =
			isOwner ||
			global.mods
				.map((v) => v.replace(/[^0-9]/g, "") + "@s.whatsapp.net")
				.includes(m.sender);
		const isPrems = isROwner || db.data.users[m.sender].premiumTime > 0;

		/* Don't need this
		if (opts["queque"] && m.text && !(isMods || isPrems)) {
			let queque = this.msgqueque,
				time = 1000 * 5;
			const previousID = queque[queque.length - 1];
			queque.push(m.id || m.key.id);
			setInterval(async function () {
				if (queque.indexOf(previousID) === -1) clearInterval(this);
				await delay(time);
			}, time);
		}
        */

		if (m.isBaileys) return;
		m.exp += Math.ceil(Math.random() * 10);

		let usedPrefix;
		let _user =
			global.db.data && global.db.data.users && global.db.data.users[m.sender];

		const groupMetadata =
			(m.isGroup
				? (conn.chats[m.chat] || {}).metadata ||
				  (await this.groupMetadata(m.chat).catch((_) => null))
				: {}) || {};
		const participants = (m.isGroup ? groupMetadata.participants : []) || [];
		const user =
			(m.isGroup
				? participants.find((u) => conn.decodeJid(u.id) === m.sender)
				: {}) || {}; // User Data
		const bot =
			(m.isGroup
				? participants.find((u) => conn.decodeJid(u.id) == this.user.jid)
				: {}) || {}; // Your Data
		const isRAdmin = user?.admin == "superadmin" || false;
		const isAdmin = isRAdmin || user?.admin == "admin" || false; // Is User Admin?
		const isBotAdmin = bot?.admin || false; // Are you Admin?

		const ___dirname = path.join(
			path.dirname(fileURLToPath(import.meta.url)),
			"./plugins",
		);
		for (let name in global.plugins) {
			let plugin = global.plugins[name];
			if (!plugin) continue;
			if (plugin.disabled) continue;
			const __filename = join(___dirname, name);
			if (typeof plugin.all === "function") {
				try {
					await plugin.all.call(this, m, {
						chatUpdate,
						__dirname: ___dirname,
						__filename,
					});
				} catch (e) {
					// if (typeof e === 'string') continue
					console.error(e);
					for (let [jid] of global.owner.filter(
						([number, _, isDeveloper]) => isDeveloper && number,
					)) {
						let data = (await conn.onWhatsApp(jid))[0] || {};
						if (data.exists)
							m.reply(
								`*Plugin:* ${name}\n*Sender:* ${m.sender}\n*Chat:* ${
									m.chat
								}\n*Command:* ${m.text}\n\n\`\`\`${format(e)}\`\`\``.trim(),
								data.jid,
							);
					}
				}
			}
			if (!opts["restrict"])
				if (plugin.tags && plugin.tags.includes("admin")) {
					// global.dfail('restrict', m, this)
					continue;
				}
			const str2Regex = (str) => str.replace(/[|\\{}()[\]^$+*?.]/g, "\\$&");
			let _prefix = plugin.customPrefix
				? plugin.customPrefix
				: conn.prefix
				? conn.prefix
				: global.prefix;
			let match = (
				_prefix instanceof RegExp // RegExp Mode?
					? [[_prefix.exec(m.text), _prefix]]
					: Array.isArray(_prefix) // Array?
					? _prefix.map((p) => {
							let re =
								p instanceof RegExp // RegExp in Array?
									? p
									: new RegExp(str2Regex(p));
							return [re.exec(m.text), re];
					  })
					: typeof _prefix === "string" // String?
					? [
							[
								new RegExp(str2Regex(_prefix)).exec(m.text),
								new RegExp(str2Regex(_prefix)),
							],
					  ]
					: [[[], new RegExp()]]
			).find((p) => p[1]);
			if (typeof plugin.before === "function") {
				if (
					await plugin.before.call(this, m, {
						match,
						conn: this,
						participants,
						groupMetadata,
						user,
						bot,
						isROwner,
						isOwner,
						isRAdmin,
						isAdmin,
						isBotAdmin,
						isPrems,
						chatUpdate,
						__dirname: ___dirname,
						__filename,
					})
				)
					continue;
			}
			if (typeof plugin !== "function") continue;
			if ((usedPrefix = (match[0] || "")[0])) {
				let noPrefix = m.text.replace(usedPrefix, "");
				let [command, ...args] = noPrefix.trim().split` `.filter((v) => v);
				args = args || [];
				let _args = noPrefix.trim().split` `.slice(1);
				let text = _args.join` `;

				command = (command || "").toLowerCase();
				let fail = plugin.fail || global.dfail; // When failed
				let isAccept =
					plugin.command instanceof RegExp // RegExp Mode?
						? plugin.command.test(command)
						: Array.isArray(plugin.command) // Array?
						? plugin.command.some((cmd) =>
								cmd instanceof RegExp // RegExp in Array?
									? cmd.test(command)
									: cmd === command,
						  )
						: typeof plugin.command === "string" // String?
						? plugin.command === command
						: false;

				if (!isAccept) continue;
				m.plugin = name;
				if (
					m.chat in global.db.data.chats ||
					m.sender in global.db.data.users
				) {
					let chat = global.db.data.chats[m.chat];
					let user = global.db.data.users[m.sender];
					if (
						name != "owner-unbanchat.js" &&
						name != "owner-exec.js" &&
						name != "owner-exec2.js" &&
						name != "tool-delete.js" &&
						chat?.isBanned &&
						!isOwner
					)
						return; // Except this
					if (name != "owner-unbanuser.js" && user?.banned) return;
				}
				if (plugin.rowner && plugin.owner && !(isROwner || isOwner)) {
					// Both Owner
					fail("owner", m, this);
					continue;
				}
				if (plugin.rowner && !isROwner) {
					// Real Owner
					fail("rowner", m, this);
					continue;
				}
				if (plugin.owner && !isOwner) {
					// Number Owner
					fail("owner", m, this);
					continue;
				}
				if (plugin.mods && !isMods) {
					// Moderator
					fail("mods", m, this);
					continue;
				}
				if (plugin.premium && !isPrems) {
					// Premium
					fail("premium", m, this);
					continue;
				}
				if (plugin.group && !m.isGroup) {
					// Group Only
					fail("group", m, this);
					continue;
				} else if (plugin.botAdmin && !isBotAdmin) {
					// You Admin
					fail("botAdmin", m, this);
					continue;
				} else if (plugin.admin && !isAdmin) {
					// User Admin
					fail("admin", m, this);
					continue;
				}
				if (plugin.private && m.isGroup) {
					// Private Chat Only
					fail("private", m, this);
					continue;
				}
				if (plugin.register == true && _user.registered == false) {
					// Butuh daftar?
					fail("unreg", m, this);
					continue;
				}
				m.isCommand = true;
				let xp = "exp" in plugin ? parseInt(plugin.exp) : 17; // XP Earning per command
				if (xp > 200) m.reply("Ngecit -_-"); // Hehehe
				else m.exp += xp;
				if (
					!isPrems &&
					plugin.limit &&
					global.db.data.users[m.sender].limit < plugin.limit * 1
				) {
					this.reply(
						m.chat,
						`Limit Kamu Habis, Beli Dengan Cara *${usedPrefix}buy limit*`,
						m,
					);
					continue; // Limit habis
				}
				if (plugin.level > _user.level) {
					this.reply(
						m.chat,
						`Diperlukan Level ${plugin.level} Untuk Menggunakan Perintah Ini\n*Level Kamu:* ${_user.level}`,
						m,
					);
					continue; // If the level has not been reached
				}
				let extra = {
					match,
					usedPrefix,
					noPrefix,
					_args,
					args,
					command,
					text,
					conn: this,
					participants,
					groupMetadata,
					user,
					bot,
					isROwner,
					isOwner,
					isRAdmin,
					isAdmin,
					isBotAdmin,
					isPrems,
					chatUpdate,
					__dirname: ___dirname,
					__filename,
				};
				try {
					await plugin.call(this, m, extra);
					if (!isPrems) m.limit = m.limit || plugin.limit || false;
				} catch (e) {
					// Error occured
					m.error = e;
					console.error(e);
					if (e) {
						let text = format(e);
						for (let key of Object.values(global.APIKeys))
							text = text.replace(new RegExp(key, "g"), "#HIDDEN#");
						if (e.name)
							for (let [jid] of global.owner.filter(
								([number, _, isDeveloper]) => isDeveloper && number,
							)) {
								let data = (await conn.onWhatsApp(jid))[0] || {};
								if (data.exists)
									m.reply(
										`*🗂️ Plugin:* ${m.plugin}\n*👤 Sender:* ${
											m.sender
										}\n*💬 Chat:* ${
											m.chat
										}\n*💻 Command:* ${usedPrefix}${command} ${args.join(
											" ",
										)}\n📄 *Error Logs:*\n\n\`\`\`${text}\`\`\``.trim(),
										data.jid,
									);
							}
						m.reply(text);
					}
				} finally {
					// m.reply(util.format(_user))
					if (typeof plugin.after === "function") {
						try {
							await plugin.after.call(this, m, extra);
						} catch (e) {
							console.error(e);
						}
					}
				}
				break;
			}
		}
	} catch (e) {
		console.error(e);
	} finally {
		try {
			const isG = !m?.key?.remoteJid?.endsWith("net");
			const sender = isG ? m?.key?.participant : m?.key?.remoteJid;
			console.log({
				group: isG,
				jid: sender,
				sender,
				raw_text: m?.message?.conversation,
			});
		} catch {}
		if (opts["autoread"]) await this.readMessages([m.key]);
	}
}

/**
 * Handle groups participants update
 * @param {import('@adiwajshing/baileys').BaileysEventMap<unknown>['group-participants.update']} groupsUpdate
 */
export async function participantsUpdate({ id, participants, action }) {
	if (opts["self"]) return;
	if (this.isInit) return;
	if (global.db.data == null) await loadDatabase();
	let chat = global.db.data.chats[id] || {};
	let text = "";
	switch (action) {
		case "add":
		case "remove":
			return;
			if (chat.welcome) {
				let groupMetadata =
					(await this.groupMetadata(id)) || (conn.chats[id] || {}).metadata;
				for (let user of participants) {
					let pp = "./src/avatar_contact.png";
					try {
						pp = await this.profilePictureUrl(user, "image");
					} catch (e) {
					} finally {
						text = (
							action === "add"
								? (
										chat.sWelcome ||
										this.welcome ||
										conn.welcome ||
										"Welcome, @user!"
								  )
										.replace("@subject", await this.getName(id))
										.replace(
											"@desc",
											groupMetadata.desc?.toString() || "unknow",
										)
								: chat.sBye || this.bye || conn.bye || "Bye, @user!"
						).replace("@user", await this.getName(user));
						const wel = "https://telegra.ph/file/61a04a443f2b9fc3e34bc.jpg";

						const lea = "https://telegra.ph/file/cadce7b456c2b36564737.jpg";

						this.sendFile(
							id,
							action === "add" ? wel : lea,
							"pp.jpg",
							text,
							null,
							false,
							{ mentions: [user] },
						);
					}
				}
			}
			break;
		case "promote":
			text =
				chat.sPromote ||
				this.spromote ||
				conn.spromote ||
				"@user ```is now Admin```";
		case "demote":
			if (!text)
				text =
					chat.sDemote ||
					this.sdemote ||
					conn.sdemote ||
					"@user ```is no longer Admin```";
			text = text.replace("@user", "@" + participants[0].split("@")[0]);
			if (chat.detect)
				this.sendMessage(id, { text, mentions: this.parseMention(text) });
			break;
	}
}
/**
 * Handle groups update
 * @param {import('@adiwajshing/baileys').BaileysEventMap<unknown>['groups.update']} groupsUpdate
 */
export async function groupsUpdate(groupsUpdate) {
	if (opts["self"]) return;
	for (const groupUpdate of groupsUpdate) {
		const id = groupUpdate.id;
		if (!id) continue;
		let chats = global.db.data.chats[id],
			text = "";
		if (!chats?.detect) continue;
		if (groupUpdate.desc)
			text = (
				chats.sDesc ||
				this.sDesc ||
				conn.sDesc ||
				"```Description has been changed to```\n@desc"
			).replace("@desc", groupUpdate.desc);
		if (groupUpdate.subject)
			text = (
				chats.sSubject ||
				this.sSubject ||
				conn.sSubject ||
				"```Subject has been changed to```\n@subject"
			).replace("@subject", groupUpdate.subject);
		if (groupUpdate.icon)
			text = (
				chats.sIcon ||
				this.sIcon ||
				conn.sIcon ||
				"```Icon has been changed to```"
			).replace("@icon", groupUpdate.icon);
		if (groupUpdate.revoke)
			text = (
				chats.sRevoke ||
				this.sRevoke ||
				conn.sRevoke ||
				"```Group link has been changed to```\n@revoke"
			).replace("@revoke", groupUpdate.revoke);
		if (!text) continue;
		await this.sendMessage(id, { text, mentions: this.parseMention(text) });
	}
}

export async function deleteUpdate(message) {
	/** Don't need this. Anoying */
	return;
	try {
		const { fromMe, id, participant } = message;
		if (fromMe) return;
		let msg = this.serializeM(this.loadMessage(id));
		if (!msg) return;
		let chat = global.db.data.chats[msg.chat] || {};
		if (chat.delete) return;
		await this.reply(
			msg.chat,
			`
Terdeteksi @${participant.split`@`[0]} telah menghapus pesan
Untuk mematikan fitur ini, ketik
*.enable delete*
`.trim(),
			msg,
			{
				mentions: [participant],
			},
		);
		this.copyNForward(msg.chat, msg).catch((e) => console.log(e, msg));
	} catch (e) {
		console.error(e);
	}
}

global.dfail = (type, m, conn) => {
	const tag = `@${m.sender.replace(/@.+/, "")}`;
	const name = conn.getName(m.sender);
	const fkon = {
		key: {
			fromMe: false,
			participant: `${m.sender.split`@`[0]}@s.whatsapp.net`,
			...(m.chat ? { remoteJid: "16504228206@s.whatsapp.net" } : {}),
		},
		message: {
			contactMessage: {
				displayName: `${name}`,
				vcard: `BEGIN:VCARD\nVERSION:3.0\nN:;a,;;;\nFN:${name}\nitem1.TEL;waid=${
					m.sender.split("@")[0]
				}:${m.sender.split("@")[0]}\nitem1.X-ABLabel:Ponsel\nEND:VCARD`,
			},
		},
	};
	const vn = "https://bucin-livid.vercel.app/audio/lusiapa.mp3";
	const mssg = {
		rowner: "Maaf, Fitur Ini Hanya Bisa Di Pakai Oleh Ownerku",
		owner: "Maaf, Fitur Ini Hanya Bisa Di Pakai Oleh Ownerku",
		mods: "Fitur Ini Khusus Moderator",
	}[type];
	if (mssg)
		return conn.sendFile(m.chat, vn, "owner.mp3", null, m, true, {
			type: "audioMessage",
			ptt: true,
		});
	let msg = {
		premium: "Maaf Kak, Tapi Fitur Ini Hanya Bisa Di Gunakan Oleh User Premium",
		group: "Fitur Ini Hanya Bisa Digunakan Di Dalam Grup",
		botAdmin:
			"Jadikan Bot Sebagai Admin Terlebih Dahulu Agar Bisa Menggunakan Fitur Ini",
		restrict: "Restict Belum Di Nyalakan Untuk Chat Ini",
	}[type];
	if (msg) return conn.reply(m.chat, msg, fkon);
	const daftar = {
		unreg:
			"Hai Kak, Sebelum Menggunakan Fiturku, Kamu Harus Daftar Ke Database Terlebih Dahulu\nCaranya Ketik .daftar namakamu.umurkamu\nContoh : .daftar boy.18",
	}[type];
	if (daftar) return conn.reply(m.chat, daftar, fkon);
};

const file = global._filename(import.meta.url, true);
watchFile(file, async () => {
	unwatchFile(file);
	console.log(chalk.redBright("Update 'handler.js'"));
	if (global.reloadHandler) console.log(await global.reloadHandler());
});