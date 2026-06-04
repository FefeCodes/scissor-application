import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useNavigate, Link } from "react-router-dom";
import {
  Copy,
  Check,
  Trash2,
  Search,
  BarChart3,
  PlusCircle,
  Link2Off,
} from "lucide-react";
import toast from "react-hot-toast";

export default function Dashboard() {
  const links = useQuery(api.links.getUserLinks);
  const deleteLinkMutation = useMutation(api.links.deleteLink);
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const handleCopy = async (id: string, slug: string) => {
    const fullUrl = `${window.location.origin}/${slug}`;
    await navigator.clipboard.writeText(fullUrl);
    setCopiedId(id);
    toast.success("Short path copied to clipboard!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDeleteSingle = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (
      confirm(
        "Are you sure you want to delete this link shortcut? Analytics data will be lost.",
      )
    ) {
      try {
        await deleteLinkMutation({ id: id as any });
        setSelectedIds(selectedIds.filter((item) => item !== id));
        toast.success("Shortcut tracking record wiped out.");
      } catch {
        toast.error("Failed to safely remove link shortcut entry.");
      }
    }
  };

  const handleToggleSelect = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleBulkDelete = async () => {
    if (
      confirm(`Wipe out all ${selectedIds.length} chosen links simultaneously?`)
    ) {
      try {
        for (const id of selectedIds) {
          await deleteLinkMutation({ id: id as any });
        }
        setSelectedIds([]);
        toast.success("Selected links removed successfully.");
      } catch {
        toast.error("Errors encountered executing batch cleanup.");
      }
    }
  };

  const filteredLinks = (links || []).filter((link) => {
    const matchesSearch =
      link.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
      link.longUrl.toLowerCase().includes(searchTerm.toLowerCase());

    const now = Date.now();
    const isExpired = link.expiresAt ? now > link.expiresAt : false;
    const computedStatus = link.isExpired || isExpired ? "Expired" : "Active";
    const matchesFilter =
      statusFilter === "All" || computedStatus === statusFilter;

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="max-w-6xl mx-auto py-10 px-4 flex-1 w-full text-gray-100">
      {links !== undefined && links.length === 0 ? (
        <div className="text-center py-20 bg-gray-800/40 rounded-2xl border border-gray-800 border-dashed p-8 max-w-xl mx-auto flex flex-col items-center gap-4 mt-12 animate-fadeIn">
          <div className="p-4 bg-blue-600/10 text-blue-400 rounded-full">
            <Link2Off size={40} />
          </div>
          <h2 className="text-2xl font-bold text-gray-200">
            No Shortcuts Built Yet
          </h2>
          <p className="text-sm text-gray-400 max-w-sm">
            Your dashboard workspace looks clean. Paste long URL addresses on
            the home page to access shortening anchors and vistors trackers.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 mt-2 bg-blue-600 hover:bg-blue-500 transition-colors text-white font-semibold text-sm px-5 py-3 rounded-lg shadow-md"
          >
            <PlusCircle size={18} /> First Tracking Link
          </Link>
        </div>
      ) : (
        <>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-blue-400">
                Your Shortcuts
              </h1>
              <p className="text-sm text-gray-400">
                Manage links, access metrics, and monitor rate allocations.
              </p>
            </div>

            {selectedIds.length > 0 && (
              <button
                onClick={handleBulkDelete}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-500 transition-colors text-white text-sm font-semibold px-4 py-2 rounded-lg shadow cursor-pointer"
              >
                <Trash2 size={16} /> Delete Selected ({selectedIds.length})
              </button>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                type="text"
                placeholder="Search by keyword or target slug parameters..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full items-center bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2.5 text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="All">All Link States</option>
              <option value="Active">Active</option>
              <option value="Expired">Expired / Ended</option>
            </select>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden shadow-lg">
            {links === undefined ? (
              <div className="p-12 text-center text-gray-400">
                Loading collection records...
              </div>
            ) : filteredLinks.length === 0 ? (
              <div className="p-12 text-center text-gray-500 text-sm">
                No links fit your selected search configuration fields.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-gray-900 border-b border-gray-700 text-gray-400 font-medium text-xs uppercase tracking-wider">
                      <th className="py-4 px-4 w-10"></th>
                      <th className="py-4 px-4">Short Link</th>
                      <th className="py-4 px-4 max-w-xs">Destination</th>
                      <th className="py-4 px-4 text-center">Status</th>
                      <th className="py-4 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {filteredLinks.map((link) => {
                      const now = Date.now();
                      const isExpired = link.expiresAt
                        ? now > link.expiresAt
                        : false;
                      const computedStatus =
                        link.isExpired || isExpired ? "Expired" : "Active";

                      return (
                        <tr
                          key={link._id}
                          onClick={() => navigate(`/analytics?id=${link._id}`)}
                          className="hover:bg-gray-700/40 cursor-pointer transition-colors group"
                        >
                          <td
                            className="py-4 px-4"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <input
                              type="checkbox"
                              checked={selectedIds.includes(link._id)}
                              onChange={() => {}}
                              onClick={(e) => handleToggleSelect(e, link._id)}
                              className="rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500 h-4 w-4 cursor-pointer"
                            />
                          </td>
                          <td className="py-4 px-4 font-mono text-blue-400 font-semibold">
                            /{link.slug}
                          </td>
                          <td className="py-4 px-4 text-gray-300 max-w-xs truncate font-light">
                            {link.longUrl}
                          </td>
                          <td className="py-4 px-4 text-center">
                            <span
                              className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                                computedStatus === "Active"
                                  ? "bg-green-500/10 text-green-400 border border-green-500/20"
                                  : "bg-red-500/10 text-red-400 border border-red-500/20"
                              }`}
                            >
                              {computedStatus}
                            </span>
                          </td>
                          <td
                            className="py-4 px-4 text-right"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleCopy(link._id, link.slug)}
                                className="p-1.5 hover:bg-gray-600 rounded text-gray-400 hover:text-gray-200 transition-colors cursor-pointer"
                                title="Copy short link"
                              >
                                {copiedId === link._id ? (
                                  <Check size={16} className="text-green-400" />
                                ) : (
                                  <Copy size={16} />
                                )}
                              </button>
                              <button
                                onClick={() =>
                                  navigate(`/analytics?id=${link._id}`)
                                }
                                className="p-1.5 hover:bg-gray-600 rounded text-gray-400 hover:text-gray-200 transition-colors cursor-pointer"
                                title="View Charts Insights"
                              >
                                <BarChart3 size={16} />
                              </button>
                              <button
                                onClick={(e) => handleDeleteSingle(e, link._id)}
                                className="p-1.5 hover:bg-red-950/40 rounded text-gray-400 hover:text-red-400 transition-colors cursor-pointer"
                                title="Delete shortcut record"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
