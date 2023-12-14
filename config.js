import { watchFile, unwatchFile } from "fs";
import axios from "axios";
import chalk from "chalk";
import { fileURLToPath } from "url";

const configs = {
	// Owner
	owner: [["6288268142831", "alicia", true]],
	mods: [],
	prems: [],
	// Info
	packname: "izuka",
	author: "Alicia",

	// Info Wait
	wait: "Sedang Di Proses, Mohon Tunggu....",
	eror: "Terjadi Kesalahan Coba Lagi Nanti!",
	error: "Terjadi kesalahan, silahkan coba lagi nanti",
	APIs: {
		rose: "https:/api.itsrose.life",
	},

	APIKeys: {
		"https:/api.itsrose.life": "You_key",
	},
};

// Its should be ok, right?
Object.assign(global, {
	...configs,
});

const file = fileURLToPath(import.meta.url);
watchFile(file, () => {
	unwatchFile(file);
	console.log(chalk.redBright("Update 'config.js'"));
	import(`${file}?update=${Date.now()}`);
});
