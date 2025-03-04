export function anonymizeName(name: string): string {
  if (!name) return "";
  const parts = name.split(" ");
  return parts
    .map((part) => {
      if (part.length <= 2) return part;
      return `${part[0]}${"*".repeat(part.length - 2)}${part[part.length - 1]}`;
    })
    .join(" ");
}
