import Sidebar from "@/components/Sidebar";

const stats = [
  {
    label: "Tasks completed",
    value: "143",
    change: "+18%",
  },
  {
    label: "Hours saved",
    value: "42h",
    change: "+24%",
  },
  {
    label: "Meetings booked",
    value: "18",
    change: "+12%",
  },
  {
    label: "Qualified leads",
    value: "11",
    change: "+31%",
  },
];

const peers = [
  {
    name: "Sales Peer",
    description: "Qualifies leads, answers visitors and books meetings.",
    metrics: ["19 conversations", "6 leads", "3 meetings"],
    status: "Watching website visitors...",
  },
  {
    name: "Support Peer",
    description: "Answers customer questions and resolves requests.",
    metrics: ["54 answers", "98% resolved", "4.9 rating"],
    status: "Helping a customer...",
  },
  {
    name: "Marketing Peer",
    description: "Creates content and supports active campaigns.",
    metrics: ["3 posts", "2 campaigns", "156 engagements"],
    status: "Generating content...",
  },
  {
    name: "Planning Peer",
    description: "Schedules appointments and sends reminders.",
    metrics: ["4 appointments", "12 reminders", "2 rescheduled"],
    status: "Checking the calendar...",
  },
];

const activities = [
  {
    time: "10:16",
    peer: "Sales Peer",
    action: "Booked a meeting with Solar BV",
  },
  {
    time: "10:03",
    peer: "Support Peer",
    action: "Answered a warranty question",
  },
  {
    time: "09:52",
    peer: "Planning Peer",
    action: "Scheduled a product demo",
  },
  {
    time: "09:41",
    peer: "Marketing Peer",
    action: "Created a LinkedIn post",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-[#030712] via-[#081028] to-[#140b2e] text-white">
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        <Sidebar />

        <section className="min-w-0 flex-1 p-5 md:p-8">
          <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-medium text-violet-400">Dashboard</p>

              <h1 className="mt-1 text-3xl font-semibold tracking-tight md:text-4xl">
                Good morning, Djemo 👋
              </h1>

              <p className="mt-2 text-slate-400">
                Your AI peers are working for you 24/7.
              </p>
            </div>

            <button
              type="button"
              className="w-fit rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300 transition hover:bg-white/10"
            >
              All workspaces
            </button>
          </header>

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat) => (
              <article
                key={stat.label}
                className="rounded-2xl border border-white/10 bg-[#0b1120]/90 p-5 shadow-xl shadow-black/10 backdrop-blur"
              >
                <p className="text-sm text-slate-400">{stat.label}</p>

                <p className="mt-4 text-3xl font-semibold">{stat.value}</p>

                <p className="mt-3 text-sm text-emerald-400">
                  ↑ {stat.change} vs yesterday
                </p>
              </article>
            ))}
          </section>

          <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
            <section>
              <div className="mb-4 flex items-end justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold">Your AI Workforce</h2>

                  <p className="mt-1 text-sm text-slate-400">
                    Your active peers are working around the clock.
                  </p>
                </div>

                <button
                  type="button"
                  className="shrink-0 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300 transition hover:bg-white/10"
                >
                  Manage peers
                </button>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {peers.map((peer, index) => (
                  <article
                    key={peer.name}
                    className="overflow-hidden rounded-2xl border border-white/10 bg-[#0b1120]/90 shadow-xl shadow-black/10 backdrop-blur"
                  >
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-blue-600 font-semibold">
                            {index + 1}
                          </div>

                          <div>
                            <h3 className="font-semibold">{peer.name}</h3>

                            <p className="mt-1 text-sm leading-6 text-slate-400">
                              {peer.description}
                            </p>
                          </div>
                        </div>

                        <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-400">
                          Active
                        </span>
                      </div>

                      <div className="mt-6 grid grid-cols-3 gap-3">
                        {peer.metrics.map((metric) => (
                          <div
                            key={metric}
                            className="rounded-xl bg-white/[0.03] p-3 text-center text-xs text-slate-300"
                          >
                            {metric}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-white/10 px-5 py-3 text-xs text-slate-500">
                      <span>{peer.status}</span>

                      <span className="flex items-center gap-2 text-violet-400">
                        <span className="h-2 w-2 animate-pulse rounded-full bg-violet-400" />
                        Live
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <aside className="h-fit rounded-2xl border border-white/10 bg-[#0b1120]/90 p-5 shadow-xl shadow-black/10 backdrop-blur">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold">Recent activity</h2>

                <button
                  type="button"
                  className="text-sm text-violet-400 transition hover:text-violet-300"
                >
                  View all
                </button>
              </div>

              <div className="mt-6 space-y-6">
                {activities.map((activity) => (
                  <div
                    key={`${activity.time}-${activity.peer}`}
                    className="flex gap-4"
                  >
                    <span className="w-10 shrink-0 text-xs text-slate-500">
                      {activity.time}
                    </span>

                    <div className="relative border-l border-white/10 pl-4">
                      <span className="absolute -left-1 top-1.5 h-2 w-2 rounded-full bg-violet-500" />

                      <p className="text-sm font-medium">{activity.peer}</p>

                      <p className="mt-1 text-sm leading-6 text-slate-400">
                        {activity.action}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </aside>
          </div>
        </section>
      </div>
    </main>
  );
}