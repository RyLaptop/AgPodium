import { cookies } from "next/headers";

export type University = "tamu" | "lsu";

export const UNIVERSITIES = {
  tamu: { name: "Texas A&M University", shortName: "Texas A&M", label: "TAMU" },
  lsu:  { name: "Louisiana State University", shortName: "Louisiana State", label: "LSU" },
} as const satisfies Record<University, { name: string; shortName: string; label: string }>;

export async function getUniversity(): Promise<University> {
  const jar = await cookies();
  const val = jar.get("uni")?.value;
  return val === "lsu" ? "lsu" : "tamu";
}
