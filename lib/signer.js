/* eslint-disable no-bitwise */

'use strict';

const { createHash, createHmac, timingSafeEqual } = require('crypto');
/* We do not introduce randomness into signed cookies, since:
 *  1. It's next to useless for replay attacks (we have `expiry` instead)
 *  2. Entropy pools are valuable, and there's no way for Node.js
 *     to access the system RNG directly (as of May 2019)
 *  3. Cookies changing all the time may provoke unnecessary suspicion
 *     about them being used for web tracking and/or GDPR non-compliance.
 */

class Signer {
  constructor(algo, secret, prefix) {
    const s = Buffer.from(secret, 'utf16le');
    const h = createHash(algo).update(s).digest();

    this.algo = algo;
    this.secret = s.length > 64 ? h : s;
    this.prefix = `${prefix || ''}`;
    this.hashLen = h.length;
  }

  createSig(key, val, nonce) {
    // NOTE: utf16 preserves stale surrogates (FOR SECURITY REASONS; DO NOT CHANGE)
    return createHmac(this.algo, this.secret).update(nonce)
      .update(`${key}=${val}`, 'utf16le').digest();
  }

  sign(key, val, expiry) {
    if (typeof key !== 'string') {
      throw new TypeError('Cookie key must be a string');
    }
    if (typeof val !== 'string' && !Buffer.isBuffer(val)) {
      throw new TypeError('Cookie content must be a string or a buffer');
    }
    const nonce = Buffer.alloc(8);
    let v = expiry == null ? 8.64e15 + 1 : Math.floor(+expiry);
    if (!(v > 0)) v = 0;
    const p2m24 = 2.3283064365386963e-10; // 2^-24
    nonce.writeUInt32LE(v >>> 0, 0);
    nonce.writeUInt32LE((v * p2m24) >>> 0, 4);
    const sig = this.createSig(key, val, nonce);
    const suffix = Buffer.concat([sig, nonce]).toString('base64');
    return `${this.prefix}${val}${suffix}`;
  }

  unsign(key, data, unsafe) {
    if (typeof key !== 'string') {
      throw new TypeError('Cookie key must be a string');
    }
    if (data == null) return data;
    if (typeof data !== 'string') {
      throw new TypeError('Cookie must be a string');
    }
    const p = this.prefix;
    const h = +this.hashLen + 8;
    const j = Math.ceil(h / 3) * 4;
    const l = p.length;
    const w = data.length - j;
    if (w >= l && data.startsWith(p)) {
      const rb = Buffer.from(data.substring(w), 'base64');
      // NOTE expiry might be imprecise
      if (rb.length === h && (unsafe
        || rb.readUInt32LE(h - 4) * 4294967296 /* 2^32 */
         + rb.readUInt32LE(h - 8) > Date.now())) {
        const val = data.substring(l, w);
        const sig = this.createSig(key, val, rb.slice(h - 8));
        if (timingSafeEqual(rb.slice(0, h - 8), sig)) {
          return val;
        }
      }
    }
    return unsafe ? data : null;
  }
}

module.exports = Signer;
