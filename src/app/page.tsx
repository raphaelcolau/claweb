export default function Home() {
  return (
    <div className="grid gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Agents actifs" value="3" trend="up" />
        <StatCard label="Emails en attente" value="12" trend="neutral" />
        <StatCard label="Projets" value="5" trend="up" />
        <StatCard label="Sessions tmux" value="2" trend="neutral" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-5">
          <h2 className="mb-4 text-sm font-medium text-[#888]">
            Activité récente
          </h2>
          <div className="space-y-3">
            {[
              { text: "Agent Claude a terminé le build", time: "il y a 2m" },
              { text: "3 nouveaux emails reçus", time: "il y a 15m" },
              { text: "Projet claweb mis à jour", time: "il y a 1h" },
              { text: "Session tmux #2 démarrée", time: "il y a 2h" },
            ].map((item) => (
              <div
                key={item.text}
                className="flex items-center justify-between rounded-md border border-white/[0.04] bg-white/[0.02] px-3.5 py-2.5"
              >
                <span className="text-[13px] text-[#ccc]">{item.text}</span>
                <span className="text-xs text-[#555]">{item.time}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-5">
          <h2 className="mb-4 text-sm font-medium text-[#888]">
            Statut système
          </h2>
          <div className="space-y-3">
            {[
              { service: "OpenClaw Core", status: "online" as const },
              { service: "Email Worker", status: "online" as const },
              { service: "Renderer JSX", status: "idle" as const },
              { service: "tmux Sessions", status: "online" as const },
            ].map((item) => (
              <div
                key={item.service}
                className="flex items-center justify-between rounded-md border border-white/[0.04] bg-white/[0.02] px-3.5 py-2.5"
              >
                <span className="text-[13px] text-[#ccc]">
                  {item.service}
                </span>
                <StatusBadge status={item.status} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  trend,
}: {
  label: string;
  value: string;
  trend: "up" | "down" | "neutral";
}) {
  return (
    <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-5">
      <p className="text-xs font-medium text-[#888]">{label}</p>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-2xl font-semibold tabular-nums text-white">
          {value}
        </span>
        {trend === "up" && (
          <span className="text-xs text-emerald-500">+</span>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: "online" | "offline" | "idle" }) {
  const config = {
    online: { color: "bg-emerald-500", label: "En ligne" },
    offline: { color: "bg-red-500", label: "Hors ligne" },
    idle: { color: "bg-amber-500", label: "Inactif" },
  };
  const { color, label } = config[status];

  return (
    <div className="flex items-center gap-1.5">
      <div className={`h-1.5 w-1.5 rounded-full ${color}`} />
      <span className="text-xs text-[#666]">{label}</span>
    </div>
  );
}
