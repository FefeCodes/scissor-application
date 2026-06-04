import { useSearchParams, Link } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { ArrowLeft } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";

export default function Analytics() {
  const [searchParams] = useSearchParams();
  const linkId = searchParams.get("id");

  const clickLogs = useQuery(
    api.links.getLinkClicks,

    linkId ? { linkId: linkId as any } : "skip",
  );

  if (!linkId) {
    return (
      <div className="p-8 text-center text-red-400">No Data to display yet</div>
    );
  }

  const lineChartData = Object.entries(
    (clickLogs || []).reduce((acc: Record<string, number>, click) => {
      const dateStr = new Date(click.timestamp).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      });
      acc[dateStr] = (acc[dateStr] || 0) + 1;
      return acc;
    }, {}),
  ).map(([date, count]) => ({ date, count }));

  const deviceCounts = (clickLogs || []).reduce(
    (acc: Record<string, number>, click) => {
      acc[click.device] = (acc[click.device] || 0) + 1;
      return acc;
    },
    {},
  );
  const pieChartData = Object.keys(deviceCounts).map((key) => ({
    name: key.toUpperCase(),
    value: deviceCounts[key],
  }));

  const referrerCounts = (clickLogs || []).reduce(
    (acc: Record<string, number>, click) => {
      acc[click.referrer] = (acc[click.referrer] || 0) + 1;
      return acc;
    },
    {},
  );
  const barChartData = Object.entries(referrerCounts)
    .map(([domain, clicks]) => ({ domain, clicks }))
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 5);

  const countryCounts = Object.entries(
    (clickLogs || []).reduce((acc: Record<string, number>, click) => {
      acc[click.country] = (acc[click.country] || 0) + 1;
      return acc;
    }, {}),
  ).sort((a, b) => b[1] - a[1]);

  const PIE_COLORS = ["#6366f1", "#10b981"];

  return (
    <div className="max-w-6xl mx-auto py-10 px-4 w-full text-gray-100 flex-1">
      <Link
        to="/dashboard"
        className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm mb-6 font-medium"
      >
        <ArrowLeft size={16} /> Go to Dashboard
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-blue-400">
          Visitor Records & Traffic Analysis
        </h1>
        <p className="text-gray-400 text-sm">
          Real-time analytical graphs evaluating traffic trends and access
          footprints.
        </p>
      </div>

      {clickLogs === undefined ? (
        <div className="text-center p-12 text-gray-400">
          Loading chart data frames...
        </div>
      ) : clickLogs.length === 0 ? (
        <div className="p-12 text-center bg-gray-800 rounded-xl border border-gray-700 text-gray-500 text-sm">
          No click tracking activities registered for this link. Share the URL
          to collect responses!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Chart Card 1: Line graph for activity tracking */}
          <div className="bg-gray-800 p-5 rounded-xl border border-gray-700 md:col-span-3">
            <h2 className="text-base font-bold text-gray-200 mb-4">
              Traffic Volume Over Time
            </h2>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lineChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      background: "#1e293b",
                      borderColor: "#475569",
                      color: "#f1f5f9",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#6366f1"
                    strokeWidth={2.5}
                    activeDot={{ r: 6 }}
                    name="Clicks"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart Card 2: Bar graph for referrer sources */}
          <div className="bg-gray-800 p-5 rounded-xl border border-gray-700 md:col-span-2">
            <h2 className="text-base font-bold text-gray-200 mb-4">
              Top Originating Channels (Referrers)
            </h2>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="domain" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      background: "#1e293b",
                      borderColor: "#475569",
                      color: "#f1f5f9",
                    }}
                  />
                  <Bar
                    dataKey="clicks"
                    fill="#3b82f6"
                    radius={[4, 4, 0, 0]}
                    name="Volume"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart Card 3: Pie graph for device distributions */}
          <div className="bg-gray-800 p-5 rounded-xl border border-gray-700 flex flex-col justify-between">
            <h2 className="text-base font-bold text-gray-200 mb-2">
              Device Proportions
            </h2>
            <div className="h-44 w-full relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieChartData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={PIE_COLORS[index % PIE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-6 text-xs text-gray-400 font-mono mt-2">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Desktop
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />{" "}
                Mobile
              </div>
            </div>
          </div>

          {/* Data Card 4: Sorted Country Code Table */}
          <div className="bg-gray-800 p-5 rounded-xl border border-gray-700 md:col-span-3">
            <h2 className="text-base font-bold text-gray-200 mb-4">
              Traffic Breakdown by Region
            </h2>
            <div className="max-h-52 overflow-y-auto border border-gray-700 rounded-lg">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-900 text-xs font-semibold text-gray-400 border-b border-gray-700 uppercase tracking-wider">
                    <th className="py-2.5 px-4">Country Code</th>
                    <th className="py-2.5 px-4 text-right">Click Tractions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700/60 font-mono text-xs">
                  {countryCounts.map(([country, count]) => (
                    <tr key={country} className="hover:bg-gray-900/30">
                      <td className="py-3 px-4 font-bold text-gray-300">
                        {country === "UNKNOWN"
                          ? "🌍 Proxy / Direct Hidden"
                          : `🏳️ ${country}`}
                      </td>
                      <td className="py-3 px-4 text-right text-blue-400 font-semibold">
                        {count}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
