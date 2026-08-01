import { createClient } from "@/lib/supabase/client";

export async function getProvinces(): Promise<string[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("provinces")
    .select("id")
    .order("id");

  if (error) throw error;
  return (data ?? []).map((row) => row.id);
}

export async function getCitiesByProvince(province: string): Promise<string[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("cities")
    .select("name")
    .eq("province_id", province)
    .order("name");

  if (error) throw error;
  return (data ?? []).map((row) => row.name);
}
