import { cookies } from "next/headers";
export type { University } from "./university-data";
export { UNIVERSITIES } from "./university-data";
import { UNIVERSITIES, type University } from "./university-data";

const UNI_KEYS = Object.keys(UNIVERSITIES) as University[];

export async function getUniversity(): Promise<University> {
  const jar = await cookies();
  const val = jar.get("uni")?.value as University | undefined;
  return val && UNI_KEYS.includes(val) ? val : "tamu";
}
