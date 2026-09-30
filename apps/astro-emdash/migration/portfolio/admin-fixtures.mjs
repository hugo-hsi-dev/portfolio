import { crc32, deflateSync } from 'node:zlib';

/** Valid, deterministic 1×1 PNG bytes for disposable upload/replacement assertions. */
export function testPng(red, green, blue) {
	const chunk = (type, data) => {
		const name = Buffer.from(type);
		const length = Buffer.alloc(4);
		length.writeUInt32BE(data.length);
		const checksum = Buffer.alloc(4);
		checksum.writeUInt32BE(crc32(Buffer.concat([name, data])));
		return Buffer.concat([length, name, data, checksum]);
	};
	const header = Buffer.alloc(13);
	header.writeUInt32BE(1, 0);
	header.writeUInt32BE(1, 4);
	header[8] = 8;
	header[9] = 6;
	return Buffer.concat([
		Buffer.from('89504e470d0a1a0a', 'hex'),
		chunk('IHDR', header),
		chunk('IDAT', deflateSync(Buffer.from([0, red, green, blue, 255]))),
		chunk('IEND', Buffer.alloc(0))
	]);
}

export const cookieHeader = (cookies) => cookies.map((cookie) => cookie.split(';')[0]).join('; ');
