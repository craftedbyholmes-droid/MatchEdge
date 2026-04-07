export function requirePro(plan: string) {
  if (plan !== "pro") {
    throw new Error("Pro only feature");
  }
}
