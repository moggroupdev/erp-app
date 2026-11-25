const SST_SUFFIX_RE = /-\d+$/;

/** Paper number for SST edit forms: strip one trailing -<digits> from a stored SST number. */
export function toSstPaperNumber(storedNumber: string) {
  return storedNumber.replace(SST_SUFFIX_RE, "");
}
