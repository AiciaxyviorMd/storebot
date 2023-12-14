import { youtubedl, youtubedlv2 } from '@bochilteam/scraper';
let handler = async (m, { conn, args, command, usedPrefix }) => {
    conn.room = conn.room ? conn.room: {}
    if (!args[0]) return m.reply(`Masukan Link Youtube!\n\nContoh :\n${usedPrefix + command} https://youtu.be/Wky7Gz_5CZs`)
    let id = 'youtubedl_' + m.sender
    if (id in conn.room) return m.reply('Kamu Masih Mendownload!')
    try {
        conn.room[id] = true
        let { audio, title, thumbnail } = await youtubedl(args[0]).catch(async _=> await youtubedlv2(args[0]))
        let text = 'Youtube Audio Downloader\n\n'
        text += `❏ Title: ${title}\n`
        text += `❏ Quality: ${audio['128kbps'].quality}\n`
        text += `❏ File Size: ${audio['128kbps'].fileSizeH}`
        let msg = await conn.sendFile(m.chat, thumbnail, null, text, m)
        conn.sendFile(m.chat, await audio['128kbps'].download(), title + '.mp3', '', msg, false, { mimetype: 'audio/mpeg' })
    } catch (e) {
        throw 'Failed :('
    } finally {
        delete conn.room[id]
    }
}
handler.help = ['ytmp3'].map(v => v + ' <𝒖𝒓𝒍>')
handler.command = /^yt(mp3|audio)|youtube(mp3|audio)$/i

handler.limit = true

export default handler