/**
 * Reference code shown to the customer as the Zelle memo, e.g. "SCF-K7QM4".
 *
 * This is the only thread tying a Zelle transfer back to an order, and a human
 * retypes it into their banking app — so the alphabet drops the characters that
 * get misread by hand (I, O, 0, 1). 32 symbols divides 256 evenly, so the byte
 * modulo below is unbiased.
 *
 * Not persisted anywhere. Uniqueness is probabilistic (32^5 ≈ 33.5M), which is
 * fine for a fair stall and would not be for a real ledger.
 */
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const LENGTH = 5;

export function createReference(): string {
  const bytes = new Uint8Array(LENGTH);
  crypto.getRandomValues(bytes);

  let code = "";
  for (const byte of bytes) code += ALPHABET[byte % ALPHABET.length];

  return `SCF-${code}`;
}
