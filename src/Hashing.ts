import { SHA512_256 } from "bun";

export function buf2hex(buffer: TypedArray) {
  return [...new Uint8Array(buffer)]
    .map((x) => x.toString(16).padStart(2, "0"))
    .join("");
}

let hash = crypto.randomUUID() + crypto.randomUUID() + Math.random();

if (Bun.file("hash.txt").size == 0) {
  Bun.write("hash.txt", hash);
} else {
  hash = await Bun.file("hash.txt").text();
}

export default class Hashing {
  static idHashing(ip: string) {
    let sh = new SHA512_256();
    sh.update(ip + hash);
    return buf2hex(sh.digest()).slice(0, 24);
  }
}
