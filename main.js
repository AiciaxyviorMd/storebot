process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = "0";
import "./config.js";

import path, { join } from "path";
import { platform } from "process";
import { fileURLToPath, pathToFileURL } from "url";
import { createRequire } from "module"; // Bring in the ability to create the 'require' method
global._filename = function filename(
	pathURL = import.meta.url,
	rmPrefix = platform !== "win32",
) {
	return rmPrefix
		? /file:\/\/\//.test(pathURL)
			? fileURLToPath(pathURL)
			: pathURL
		: pathToFileURL(pathURL).toString();
};
global._dirname = function dirname(pathURL) {
	return path.dirname(global._filename(pathURL, true));
};
global._require = function require(dir = import.meta.url) {
	return createRequire(dir);
};
import * as ws from "ws";
import {
	readdirSync,
	statSync,
	unlinkSync,
	existsSync,
	readFileSync,
	watch,
} from "fs";
import yargs from "yargs";
import { spawn } from "child_process";
import lodash from "lodash";
import syntaxerror from "syntax-error";
import { tmpdir } from "os";
import { format } from "util";

import {
	useMultiFileAuthState,
	DisconnectReason,
	fetchLatestBaileysVersion,
} from "@whiskeysockets/baileys";
import { Low, JSONFile } from "lowdb";

import { makeWASocket, protoType, serialize } from "./lib/simple.js";

import { mongoDB, mongoDBV2 } from "./lib/mongoDB.js";

const { chain } = lodash;
const PORT = process.env.PORT || process.env.SERVER_PORT || 3000;

protoType();
serialize();

global.API = (name, path = "/", query = {}, apikeyqueryname) =>
	(name in global.APIs ? global.APIs[name] : name) +
	path +
	(query || apikeyqueryname
		? "?" +
		  new URLSearchParams(
				Object.entries({
					...query,
					...(apikeyqueryname
						? {
								[apikeyqueryname]:
									global.APIKeys[
										name in global.APIs ? global.APIs[name] : name
									],
						  }
						: {}),
				}),
		  )
		: "");

global.timestamp = {
	start: new Date(),
};

const _dirname = global._dirname(import.meta.url);

global.opts = new Object(
	yargs(process.argv.slice(2)).exitProcess(false).parse(),
);
global.prefix = new RegExp(
	"^[" +
		(opts["prefix"] || "xzXZ/i!#$%+£¢€¥^°=¶∆×÷π√✓©®:;?&.\\-").replace(
			/[|\\{}()[\]^$+*?.\-\^]/g,
			"\\$&",
		) +
		"]",
);

global.db = new Low(
	/https?:\/\//.test(opts["db"] || "")
		? new cloudDBAdapter(opts["db"])
		: /mongodb(\+srv)?:\/\//i.test(opts["db"])
		? opts["mongodbv2"]
			? new mongoDBV2(opts["db"])
			: new mongoDB(opts["db"])
		: new JSONFile(`${opts?.[0] ? opts?.[0] + "_" : ""}database.json`),
);
global.DATABASE = global.db; // Backwards Compatibility
global.loadDatabase = async function loadDatabase() {
	if (db.READ)
		return new Promise((resolve) =>
			setInterval(async function () {
				if (!db.READ) {
					clearInterval(this);
					resolve(db.data == null ? global.loadDatabase() : db.data);
				}
			}, 1 * 1000),
		);
	if (db.data !== null) return;
	db.READ = true;
	await db.read().catch(console.error);
	db.READ = null;
	db.data = {
		users: {},
		chats: {},
		stats: {},
		msgs: {},
		sticker: {},
		settings: {},
		...(db.data || {}),
	};
	global.db.chain = chain(db.data);
};
loadDatabase();

const { state, saveCreds } = await useMultiFileAuthState(
	path.resolve("./sessions"),
);
const { version, isLatest } = await fetchLatestBaileysVersion();
console.log(`using WA v${version.join(".")}, isLatest: ${isLatest}`);

const connectionOptions = {
	version,
	printQRInTerminal: true,
	auth: state,
	browser: ["Baileys", "Safari", "3.1.0"],
};

global.conn = makeWASocket(connectionOptions);
conn.isInit = false;

if (!opts["test"]) {
	// (await import("./server.js")).default(PORT);
	setInterval(async () => {
		if (global.db.data) await global.db.write().catch(console.error);
		// if (opts['autocleartmp']) try {
		clearTmp();
		//  } catch (e) { console.error(e) }
	}, 60 * 1000);
}

function clearTmp() {
	const tmp = [tmpdir(), join(_dirname, "./tmp")];
	const filename = [];
	tmp.forEach((dirname) =>
		readdirSync(dirname).forEach((file) => filename.push(join(dirname, file))),
	);
	return filename.map((file) => {
		const stats = statSync(file);
		if (stats.isFile() && Date.now() - stats.mtimeMs >= 1000 * 60 * 3)
			return unlinkSync(file); // 3 minutes
		return false;
	});
}

async function connectionUpdate(update) {
	console.log(update);
	// /** @type {Partial<{ connection: import('@adiwajshing/baileys').ConnectionState['connection'], lastDisconnect: { error: Error | import('@hapi/boom').Boom, date: Date }, isNewLogin: import('@adiwajshing/baileys').ConnectionState['isNewLogin'] }>} */
	const { connection, lastDisconnect, isNewLogin } = update;
	if (isNewLogin) this.isInit = true;
	// @ts-ignore
	const code =
		lastDisconnect?.error?.output?.statusCode ||
		lastDisconnect?.error?.output?.payload?.statusCode;
	if (code && code !== DisconnectReason.loggedOut) {
		await reloadHandler(true).catch(console.error);
		global.timestamp.connect = new Date();
	}
	if (connection == "open") console.log("- opened connection -");

	if (db.data == null) loadDatabase();
}

process.on("uncaughtException", console.error);
// let strQuot = /(["'])(?:(?=(\\?))\2.)*?\1/

let isInit = true;
let handler = await import("./handler.js");
global.reloadHandler = async function (restatConn) {
	try {
		const Handler = await import(`./handler.js?update=${Date.now()}`).catch(
			console.error,
		);
		if (Object.keys(Handler || {}).length) handler = Handler;
	} catch (e) {
		console.error(e);
	}
	if (restatConn) {
		const oldChats = global.conn.chats;
		try {
			global.conn.ws.close();
		} catch {}
		conn.ev.removeAllListeners();
		global.conn = makeWASocket(connectionOptions, { chats: oldChats });
		isInit = true;
	}
	if (!isInit) {
		conn.ev.off("messages.upsert", conn.handler);
		conn.ev.off("group-participants.update", conn.participantsUpdate);
		conn.ev.off("groups.update", conn.groupsUpdate);
		conn.ev.off("message.delete", conn.onDelete);
		conn.ev.off("connection.update", conn.connectionUpdate);
		conn.ev.off("creds.update", conn.credsUpdate);
	}

	conn.welcome =
		"Selamat Datang Di @subject\nSilahkan Perkenalkan Diri Kamu @user";
	conn.bye = "Selamat Tinggal @user\nKalau Balik Jangan Lupa Gorengannya";
	conn.spromote = "@user Telah Di Promosikan Menjadi Admin";
	conn.sdemote = "@user Telah Di Berhentikan Sebagai Admin";
	conn.sDesc = "Deskripsi Telah Diubah Menjadi \n@desc";
	conn.sSubject = "Nama Grup Telah Diubah Menjadi \n@subject";
	conn.sIcon = "Foto Grup Telah Diubah!";
	conn.sRevoke = "Tautan Group Telah Diubah Menjadi \n@revoke";
	conn.sAnnounceOn =
		"Group telah di tutup!\nsekarang hanya admin yang dapat mengirim pesan.";
	conn.sAnnounceOff =
		"Group telah di buka!\nsekarang semua peserta dapat mengirim pesan.";
	conn.sRestrictOn = "Edit Info Grup di ubah ke hanya admin!";
	conn.sRestrictOff = "Edit Info Grup di ubah ke semua peserta!";

	conn.handler = handler.handler.bind(global.conn);
	conn.participantsUpdate = handler.participantsUpdate.bind(global.conn);
	conn.groupsUpdate = handler.groupsUpdate.bind(global.conn);
	conn.onDelete = handler.deleteUpdate.bind(global.conn);
	conn.connectionUpdate = connectionUpdate.bind(global.conn);
	conn.credsUpdate = saveCreds.bind(global.conn);

	conn.ev.on("messages.upsert", conn.handler);
	conn.ev.on("group-participants.update", conn.participantsUpdate);
	conn.ev.on("groups.update", conn.groupsUpdate);
	conn.ev.on("message.delete", conn.onDelete);
	conn.ev.on("connection.update", conn.connectionUpdate);
	conn.ev.on("creds.update", conn.credsUpdate);
	isInit = false;
	return true;
};

const pluginFolder = global._dirname(join(_dirname, "./plugins/index"));
const pluginFilter = (filename) => /\.js$/.test(filename);
global.plugins = {};
async function filesInit() {
	for (let filename of readdirSync(pluginFolder).filter(pluginFilter)) {
		try {
			let file = global._filename(join(pluginFolder, filename));
			const module = await import(file);
			global.plugins[filename] = module.default || module;
		} catch (e) {
			conn.logger.error(e);
			delete global.plugins[filename];
		}
	}
}
filesInit()
	.then((_) => console.log(Object.keys(global.plugins)))
	.catch(console.error);

global.reload = async (_ev, filename) => {
	if (pluginFilter(filename)) {
		let dir = global._filename(join(pluginFolder, filename), true);
		if (filename in global.plugins) {
			if (existsSync(dir))
				conn.logger.info(`re - require plugin '${filename}'`);
			else {
				conn.logger.warn(`deleted plugin '${filename}'`);
				return delete global.plugins[filename];
			}
		} else conn.logger.info(`requiring new plugin '${filename}'`);
		let err = syntaxerror(readFileSync(dir), filename, {
			sourceType: "module",
			allowAwaitOutsideFunction: true,
		});
		if (err)
			conn.logger.error(
				`syntax error while loading '${filename}'\n${format(err)}`,
			);
		else
			try {
				const module = await import(
					`${global._filename(dir)}?update=${Date.now()}`
				);
				global.plugins[filename] = module.default || module;
			} catch (e) {
				conn.logger.error(`error require plugin '${filename}\n${format(e)}'`);
			} finally {
				global.plugins = Object.fromEntries(
					Object.entries(global.plugins).sort(([a], [b]) => a.localeCompare(b)),
				);
			}
	}
};
Object.freeze(global.reload);
watch(pluginFolder, global.reload);
await global.reloadHandler();

// Quick Test

async function _quickTest() {
	let test = await Promise.all(
		[
			spawn("ffmpeg"),
			spawn("ffprobe"),
			spawn("ffmpeg", [
				"-hide_banner",
				"-loglevel",
				"error",
				"-filter_complex",
				"color",
				"-frames:v",
				"1",
				"-f",
				"webp",
				"-",
			]),
			spawn("convert"),
			spawn("magick"),
			spawn("gm"),
			spawn("find", ["--version"]),
		].map((p) => {
			return Promise.race([
				new Promise((resolve) => {
					p.on("close", (code) => {
						resolve(code !== 127);
					});
				}),
				new Promise((resolve) => {
					p.on("error", (_) => resolve(false));
				}),
			]);
		}),
	);
	let [ffmpeg, ffprobe, ffmpegWebp, convert, magick, gm, find] = test;
	console.log(test);
	let s = (global.support = {
		ffmpeg,
		ffprobe,
		ffmpegWebp,
		convert,
		magick,
		gm,
		find,
	});
	// require('./lib/sticker').support = s
	Object.freeze(global.support);

	if (!s.ffmpeg) {
		conn.logger.warn(
			`Silahkan Install ffmpeg Terlebih Dahulu Agar Bisa Mengirim Video`,
		);
	}

	if (s.ffmpeg && !s.ffmpegWebp) {
		conn.logger.warn(
			"Sticker Mungkin Tidak Beranimasi tanpa libwebp di ffmpeg (--enable-ibwebp while compiling ffmpeg)",
		);
	}

	if (!s.convert && !s.magick && !s.gm) {
		conn.logger.warn(
			"Fitur Stiker Mungkin Tidak Bekerja Tanpa imagemagick dan libwebp di ffmpeg belum terinstall (pkg install imagemagick)",
		);
	}
}
_quickTest()
	.then(() =>
		conn.logger.info("☑️ Quick Test Done , nama file session ~> creds.json"),
	)
	.catch(console.error);
