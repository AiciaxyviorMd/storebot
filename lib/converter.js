import { promises } from "fs";
import { createReadStream, ReadStream } from 'fs'
import { join } from 'path'
import { spawn } from 'child_process'
import yargs from 'yargs'
import os from 'os'
import { fileURLToPath, pathToFileURL } from 'url'
import path from 'path'
import fs from 'fs'
import { createRequire } from 'module'
import Stream, { Readable } from 'stream'
import Helper from './helper.js'

const __filename = function filename(pathURL = import.meta, rmPrefix = os.platform() !== 'win32') {
    const path = /** @type {ImportMeta} */ (pathURL).url || /** @type {String} */ (pathURL)
    return rmPrefix ?
        /file:\/\/\//.test(path) ?
            fileURLToPath(path) :
            path : /file:\/\/\//.test(path) ?
            path : pathToFileURL(path).href
}

const __dirname = function dirname(pathURL) {
    const dir = __filename(pathURL, true)
    const regex = /\/$/
    return regex.test(dir) ?
        dir : fs.existsSync(dir) &&
            fs.statSync(dir).isDirectory() ?
            dir.replace(regex, '') :
            path.dirname(dir) // windows
}


function ffmpeg(buffer, args = [], ext = "", ext2 = "") {
	return new Promise(async (resolve, reject) => {
		try {
			let tmp = join(
				__dirname(import.meta.url),
				"../tmp",
				+new Date() + "." + ext,
			);
			let out = tmp + "." + ext2;
			await promises.writeFile(tmp, buffer);
			spawn("ffmpeg", ["-y", "-i", tmp, ...args, out])
				.on("error", reject)
				.on("close", async (code) => {
					try {
						await promises.unlink(tmp);
						if (code !== 0) return reject(code);
						resolve({
							data: await promises.readFile(out),
							filename: out,
							delete() {
								return promises.unlink(out);
							},
						});
					} catch (e) {
						reject(e);
					}
				});
		} catch (e) {
			reject(e);
		}
	});
}

/**
 * Convert Audio to Playable WhatsApp Audio
 * @param {Buffer} buffer Audio Buffer
 * @param {String} ext File Extension
 * @returns {Promise<{data: Buffer, filename: String, delete: Function}>}
 */
function toPTT(buffer, ext) {
	return ffmpeg(
		buffer,
		["-vn", "-c:a", "libopus", "-b:a", "128k", "-vbr", "on"],
		ext,
		"ogg",
	);
}

/**
 * Convert Audio to Playable WhatsApp PTT
 * @param {Buffer} buffer Audio Buffer
 * @param {String} ext File Extension
 * @returns {Promise<{data: Buffer, filename: String, delete: Function}>}
 */
function toAudio(buffer, ext) {
	return ffmpeg(
		buffer,
		[
			"-vn",
			"-c:a",
			"libopus",
			"-b:a",
			"128k",
			"-vbr",
			"on",
			"-compression_level",
			"10",
		],
		ext,
		"opus",
	);
}

/**
 * Convert Audio to Playable WhatsApp Video
 * @param {Buffer} buffer Video Buffer
 * @param {String} ext File Extension
 * @returns {Promise<{data: Buffer, filename: String, delete: Function}>}
 */
function toVideo(buffer, ext) {
	return ffmpeg(
		buffer,
		[
			"-c:v",
			"libx264",
			"-c:a",
			"aac",
			"-ab",
			"128k",
			"-ar",
			"44100",
			"-crf",
			"32",
			"-preset",
			"slow",
		],
		ext,
		"mp4",
	);
}

export { toAudio, toPTT, toVideo, ffmpeg };
