import { FormData, Blob } from "formdata-node";
import { fileTypeFromBuffer } from "file-type";
import axios from "axios";

const ITSROSE_UPLOADER = async (opts) => {
	const { data } = await axios
		.request({
			baseURL: APIs["rose"],
			url: "/uploader/file",
			method: "POST",
			params: {
				apikey: APIKeys[APIs["rose"]],
			},
			...opts,
		})
		.catch((e) => e?.response);
	const { status, result, message } = data;
	if (!status) {
		throw new Error(message);
	}
	return result["url"];
};
export default async (buffer) => {
	const { ext, mime } = await fileTypeFromBuffer(buffer);
	const form = new FormData();
	const blob = new Blob([buffer.toArrayBuffer()], { type: mime });
	form.append("file", blob, "tmp." + ext);
	const { data, status } = await axios
		.request({
			baseURL: "https://telegra.ph",
			url: "/upload",
			method: "POST",
			data: form,
		})
		.catch((e) => e?.response);
	if (status !== 200) {
		console.log(form);
		return await ITSROSE_UPLOADER({ data: form });
	}
	return "https://telegra.ph" + data[0]?.src || data;
};
