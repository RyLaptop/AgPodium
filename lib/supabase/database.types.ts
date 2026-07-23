// Placeholder — regenerate with `npm run db:types` after Supabase is linked.
// This lets the app compile before you have a live Supabase project.

export type Database = {
  public: {
    Tables: Record<string, never>;
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      org_role: "member" | "officer" | "director";
      request_status:
        | "pending"
        | "approved"
        | "denied"
        | "completed"
        | "no_show"
        | "cancelled";
      bulletin_status: "pending" | "approved" | "denied";
    };
    CompositeTypes: Record<string, never>;
  };
};
