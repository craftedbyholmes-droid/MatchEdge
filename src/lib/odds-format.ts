export function gcd(a: number, b: number): number {
  let x = Math.abs(Math.round(a));
  let y = Math.abs(Math.round(b));

  while (y) {
    const t = y;
    y = x % y;
    x = t;
  }

  return x || 1;
}

export function decimalToFractional(decimalOdds: number) {
  if (!Number.isFinite(decimalOdds) || decimalOdds <= 1) {
    return "—";
  }

  const profitPart = decimalOdds - 1;
  const precision = 100;
  const numerator = Math.round(profitPart * precision);
  const denominator = precision;
  const divisor = gcd(numerator, denominator);

  return `${numerator / divisor}/${denominator / divisor}`;
}

export function formatOddsBoth(decimalOdds: number) {
  if (!Number.isFinite(decimalOdds)) {
    return "—";
  }

  return `${decimalOdds.toFixed(2)} (${decimalToFractional(decimalOdds)})`;
}