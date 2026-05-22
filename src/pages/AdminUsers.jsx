import { useOutletContext } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { entities } from "@/api/supabaseClient";
import { Users, ShieldCheck, GraduationCap, UserCheck } from "lucide-react";
import { NoomoCard, NoomoBadge } from "@/components/ui/NoomoCard";

export default function AdminUsers() {
  // @ts-ignore
  const { user: _user } = useOutletContext();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["all-users"],
    queryFn: () => entities.User.list(),
  });

  const admins = users.filter(u => u.role === "admin");
  const teachers = users.filter(u => u.role === "teacher");
  const students = users.filter(u => !u.role || u.role === "user" || u.role === "student");

  /** @type {(role: string) => any} */
  const roleConfig = (role) => {
    if (role === "admin") return { label: "Admin", variant: "accent", icon: ShieldCheck };
    if (role === "teacher") return { label: "Guru", variant: "default", icon: GraduationCap };
    return { label: "Murid", variant: "ghost", icon: UserCheck };
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h2 className="text-2xl font-display font-bold text-foreground tracking-tight">Manajemen Pengguna</h2>
        <p className="text-medium-gray text-sm font-editorial mt-1">{users.length} pengguna terdaftar</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: "Admin", value: admins.length, icon: ShieldCheck, bg: "bg-vibrant-blue/10 text-vibrant-blue" },
          { label: "Guru", value: teachers.length, icon: GraduationCap, bg: "bg-lavender/40 text-navy" },
          { label: "Murid", value: students.length, icon: Users, bg: "bg-emerald-100 text-emerald-700" },
        ].map(({ label, value, icon: Icon, bg }) => (
          <NoomoCard key={label} className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-medium-gray font-editorial uppercase tracking-wider mb-1">{label}</p>
                <p className="text-3xl font-display font-bold">{value}</p>
              </div>
              <div className={`w-10 h-10 flex items-center justify-center ${bg}`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>
          </NoomoCard>
        ))}
      </div>

      {/* User list */}
      <NoomoCard className="overflow-hidden">
        <div className="p-5 border-b border-border">
          <h3 className="text-sm font-bold uppercase tracking-wider">Daftar Pengguna</h3>
        </div>
        {isLoading ? (
          <div className="p-6 space-y-3">
            {[1,2,3,4,5].map(i => (
              <div key={i} className="flex items-center gap-4 animate-pulse">
                <div className="w-9 h-9 bg-muted" />
                <div className="flex-1 space-y-1">
                  <div className="h-4 bg-muted w-1/3" />
                  <div className="h-3 bg-muted w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="divide-y divide-border">
            {users.map(u => {
              const cfg = roleConfig(u.role);
              const _Icon = cfg.icon;
              return (
                <div key={u.id} className="flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors">
                  <div className="w-9 h-9 bg-navy flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-sm font-bold">
                      {u.full_name?.charAt(0)?.toUpperCase() || "U"}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">{u.full_name || "—"}</p>
                    <p className="text-xs text-medium-gray font-editorial">{u.email}</p>
                  </div>
                  <NoomoBadge variant={cfg.variant} className="">
                    {cfg.label}
                  </NoomoBadge>
                </div>
              );
            })}
          </div>
        )}
      </NoomoCard>
    </div>
  );
}