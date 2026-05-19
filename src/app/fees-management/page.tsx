"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  FiSettings,
  FiPlus,
  FiChevronDown,
  FiEdit2,
  FiArchive,
  FiEye,
  FiMoreVertical,
  FiSearch,
  FiFilter,
  FiRefreshCw,
  FiCopy,
  FiUpload,
  FiDownload,
  FiX,
} from "react-icons/fi";
import { toast } from "@/components/CustomToast";
import {
  getFeesDashboardSummary,
  getFeeCategories,
  getFeeItems,
  getFeeAssignments,
  getReceiptSettings,
  updateReceiptSettings,
  archiveFeeCategory,
  archiveFeeItem,
  archiveFeeAssignment,
  publishFeeAssignment,
  unpublishFeeAssignment,
  duplicateFeeItem,
  restoreFeeCategory,
  restoreFeeItem,
  restoreFeeAssignment,
  createFeeCategory,
  updateFeeCategory,
  type FeeCategory,
  type FeeItem,
  type FeeAssignment,
  type DashboardSummary,
  type ReceiptSettings,
} from "../services/fees.service";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PKR = (n: number) =>
  `PKR ${n.toLocaleString("en-PK", { minimumFractionDigits: 0 })}`;

const STATUS_BADGE: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  draft: "bg-yellow-100 text-yellow-700",
  inactive: "bg-gray-100 text-gray-500",
  archived: "bg-red-100 text-red-600",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_BADGE[status] || "bg-gray-100 text-gray-500"}`}
    >
      {status}
    </span>
  );
}

function StatCard({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 flex flex-col gap-1 shadow-sm">
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`text-2xl font-bold ${color || "text-[#003366]"}`}>
        {value}
      </p>
      {sub && <p className="text-xs text-gray-400">{sub}</p>}
    </div>
  );
}

function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="animate-pulse space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-10 bg-gray-100 rounded" />
      ))}
    </div>
  );
}

// ─── Category Modal ────────────────────────────────────────────────────────────

function CategoryModal({
  open,
  onClose,
  onSave,
  editing,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (name: string, description: string) => Promise<void>;
  editing?: FeeCategory | null;
}) {
  const [name, setName] = useState(editing?.name || "");
  const [description, setDescription] = useState(editing?.description || "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setName(editing?.name || "");
    setDescription(editing?.description || "");
  }, [editing]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      await onSave(name.trim(), description.trim());
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">
            {editing ? "Edit Category" : "Create Category"}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <FiX size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Tuition Fees"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003366]/30"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Describe this fee category..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003366]/30 resize-none"
            />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm text-gray-600 border border-gray-200 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !name.trim()}
              className="px-4 py-2 rounded-lg text-sm bg-[#003366] text-white font-medium disabled:opacity-60"
            >
              {saving ? "Saving..." : editing ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Signature Card ────────────────────────────────────────────────────────────

function SignatureCard({
  settings,
  onUpdate,
}: {
  settings: ReceiptSettings | null;
  onUpdate: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState(settings?.signatureName || "");
  const [title, setTitle] = useState(settings?.signatureTitle || "");

  useEffect(() => {
    setName(settings?.signatureName || "");
    setTitle(settings?.signatureTitle || "");
  }, [settings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateReceiptSettings({ signatureName: name, signatureTitle: title });
      toast.success("Signature settings saved");
      onUpdate();
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async () => {
    setSaving(true);
    try {
      await updateReceiptSettings({ signatureUrl: "", signatureName: "", signatureTitle: "" });
      toast.success("Signature removed");
      onUpdate();
    } catch {
      toast.error("Failed to remove signature");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
      <h3 className="text-sm font-semibold text-gray-700">Signature for Receipts</h3>
      <p className="text-xs text-gray-400">This signature will appear on all fee receipts.</p>
      {settings?.signatureUrl ? (
        <img
          src={settings.signatureUrl}
          alt="Signature"
          className="h-12 object-contain border border-gray-100 rounded p-1"
        />
      ) : (
        <div className="h-12 border-2 border-dashed border-gray-200 rounded flex items-center justify-center text-xs text-gray-400">
          No signature uploaded
        </div>
      )}
      <div className="space-y-2">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Authorized name"
          className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-xs"
        />
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title / Position"
          className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-xs"
        />
      </div>
      <p className="text-[10px] text-gray-400">Recommended size: 300x100px (PNG, JPG)</p>
      <div className="flex gap-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 flex items-center justify-center gap-1 text-xs py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50"
        >
          <FiUpload size={12} /> Change Signature
        </button>
        {settings?.signatureUrl && (
          <button
            onClick={handleRemove}
            disabled={saving}
            className="flex items-center gap-1 text-xs py-1.5 px-3 border border-red-200 rounded-lg text-red-500 hover:bg-red-50"
          >
            Remove
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────

function OverviewTab({
  summary,
  items,
  loadingItems,
  onRefresh,
}: {
  summary: DashboardSummary | null;
  items: FeeItem[];
  loadingItems: boolean;
  onRefresh: () => void;
}) {
  const router = useRouter();
  const [actionMenu, setActionMenu] = useState<string | null>(null);

  const handleArchive = async (id: string) => {
    try {
      await archiveFeeItem(id);
      toast.success("Fee item archived");
      onRefresh();
    } catch (e: any) {
      toast.error(e.message || "Failed to archive");
    }
    setActionMenu(null);
  };

  const handleDuplicate = async (id: string) => {
    try {
      await duplicateFeeItem(id);
      toast.success("Fee item duplicated");
      onRefresh();
    } catch (e: any) {
      toast.error(e.message || "Failed to duplicate");
    }
    setActionMenu(null);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Fee Items" value={summary?.totalFeeItems ?? "—"} sub="Across all categories" />
        <StatCard label="Active Fee Items" value={summary?.activeFeeItems ?? "—"} sub="Currently active" />
        <StatCard
          label="Total Expected Amount"
          value={summary ? PKR(summary.totalExpectedAmount) : "—"}
          sub="This academic year"
          color="text-[#003366]"
        />
        <StatCard label="Fee Categories" value={summary?.feeCategories ?? "—"} sub="Custom categories" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          label="Paid Amount"
          value={summary ? PKR(summary.paidAmount) : "—"}
          sub="Total collected"
          color="text-green-600"
        />
        <StatCard
          label="Outstanding Amount"
          value={summary ? PKR(summary.outstandingAmount) : "—"}
          sub="Pending collection"
          color="text-red-500"
        />
        <StatCard label="Active Assignments" value={summary?.activeAssignments ?? "—"} sub="Classes assigned" />
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-50 flex items-center justify-between">
          <h3 className="font-semibold text-gray-800 text-sm">Fee Items</h3>
          <button
            onClick={() => router.push("/fees-management/create")}
            className="flex items-center gap-1 text-xs bg-[#003366] text-white px-3 py-1.5 rounded-lg hover:bg-[#003366]/90"
          >
            <FiPlus size={12} /> Create New Fee
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Fee Name</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Category</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Fee Type</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Amount (PKR)</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Status</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loadingItems ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6">
                    <TableSkeleton rows={5} />
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-400 text-sm">
                    No fee items yet. Create your first fee.
                  </td>
                </tr>
              ) : (
                items.map((item) => {
                  const cat = item.categoryId as any;
                  return (
                    <tr key={item._id} className="hover:bg-gray-50/50">
                      <td className="px-4 py-3 font-medium text-gray-800">{item.name}</td>
                      <td className="px-4 py-3 text-gray-500">{cat?.name || "—"}</td>
                      <td className="px-4 py-3 text-gray-500 capitalize">{item.feeType.replace("_", " ")}</td>
                      <td className="px-4 py-3 text-[#003366] font-medium">
                        {item.defaultAmount.toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={item.status} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => router.push(`/fees-management/create?edit=${item._id}`)}
                            className="p-1.5 rounded text-gray-400 hover:text-[#003366] hover:bg-blue-50"
                            title="Edit"
                          >
                            <FiEdit2 size={14} />
                          </button>
                          <div className="relative">
                            <button
                              onClick={() => setActionMenu(actionMenu === item._id ? null : item._id)}
                              className="p-1.5 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                            >
                              <FiMoreVertical size={14} />
                            </button>
                            {actionMenu === item._id && (
                              <div className="absolute right-0 top-8 bg-white border border-gray-100 rounded-lg shadow-lg py-1 z-10 w-44">
                                <button
                                  onClick={() => handleDuplicate(item._id)}
                                  className="w-full text-left px-3 py-2 text-xs text-gray-600 hover:bg-gray-50 flex items-center gap-2"
                                >
                                  <FiCopy size={12} /> Duplicate
                                </button>
                                <button
                                  onClick={() => router.push(`/fees-management/assign?feeId=${item._id}`)}
                                  className="w-full text-left px-3 py-2 text-xs text-gray-600 hover:bg-gray-50 flex items-center gap-2"
                                >
                                  <FiPlus size={12} /> Assign to Classes
                                </button>
                                <hr className="my-1 border-gray-100" />
                                <button
                                  onClick={() => handleArchive(item._id)}
                                  className="w-full text-left px-3 py-2 text-xs text-red-500 hover:bg-red-50 flex items-center gap-2"
                                >
                                  <FiArchive size={12} /> Archive
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Categories Tab ────────────────────────────────────────────────────────────

function CategoriesTab({
  categories,
  loading,
  onRefresh,
}: {
  categories: FeeCategory[];
  loading: boolean;
  onRefresh: () => void;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<FeeCategory | null>(null);

  const handleSave = async (name: string, description: string) => {
    try {
      if (editing) {
        await updateFeeCategory(editing._id, { name, description });
        toast.success("Category updated");
      } else {
        await createFeeCategory({ name, description });
        toast.success("Category created");
      }
      onRefresh();
    } catch (e: any) {
      toast.error(e.message || "Failed to save category");
      throw e;
    }
  };

  const handleArchive = async (id: string) => {
    try {
      await archiveFeeCategory(id);
      toast.success("Category archived");
      onRefresh();
    } catch (e: any) {
      toast.error(e.message || "Failed to archive category");
    }
  };

  const handleRestore = async (id: string) => {
    try {
      await restoreFeeCategory(id);
      toast.success("Category restored");
      onRefresh();
    } catch (e: any) {
      toast.error(e.message || "Failed to restore category");
    }
  };

  const active = categories.filter((c) => c.status === "active");
  const archived = categories.filter((c) => c.status === "archived");

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Categories" value={categories.length} sub="All fee categories" />
        <StatCard label="Active Categories" value={active.length} sub="Currently active" />
        <StatCard label="Archived Categories" value={archived.length} sub="No archived categories" />
        <StatCard label="Total Fee Items" value="—" sub="Across all categories" />
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-50 flex items-center justify-between">
          <h3 className="font-semibold text-gray-800 text-sm">Fee Categories</h3>
          <button
            onClick={() => { setEditing(null); setModalOpen(true); }}
            className="flex items-center gap-1 text-xs bg-[#003366] text-white px-3 py-1.5 rounded-lg hover:bg-[#003366]/90"
          >
            <FiPlus size={12} /> Create Category
          </button>
        </div>
        {loading ? (
          <div className="p-4"><TableSkeleton rows={4} /></div>
        ) : categories.length === 0 ? (
          <div className="py-12 text-center text-gray-400 text-sm">No categories yet. Create your first category.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Category Name</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Description</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Status</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {categories.map((cat) => (
                <tr key={cat._id} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3 font-medium text-gray-800">{cat.name}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs max-w-xs truncate">{cat.description || "—"}</td>
                  <td className="px-4 py-3"><StatusBadge status={cat.status} /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => { setEditing(cat); setModalOpen(true); }}
                        className="p-1.5 rounded text-gray-400 hover:text-[#003366] hover:bg-blue-50"
                        title="Edit"
                      >
                        <FiEdit2 size={14} />
                      </button>
                      {cat.status === "active" ? (
                        <button
                          onClick={() => handleArchive(cat._id)}
                          className="p-1.5 rounded text-gray-400 hover:text-red-500 hover:bg-red-50"
                          title="Archive"
                        >
                          <FiArchive size={14} />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleRestore(cat._id)}
                          className="p-1.5 rounded text-gray-400 hover:text-green-600 hover:bg-green-50"
                          title="Restore"
                        >
                          <FiRefreshCw size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <CategoryModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        editing={editing}
      />
    </div>
  );
}

// ─── Fee Structures Tab ────────────────────────────────────────────────────────

function FeeStructuresTab({
  items,
  loading,
  onRefresh,
}: {
  items: FeeItem[];
  loading: boolean;
  onRefresh: () => void;
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");

  const filtered = items.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleDuplicate = async (id: string) => {
    try {
      await duplicateFeeItem(id);
      toast.success("Fee duplicated");
      onRefresh();
    } catch (e: any) {
      toast.error(e.message || "Failed to duplicate");
    }
  };

  const handleArchive = async (id: string) => {
    try {
      await archiveFeeItem(id);
      toast.success("Fee archived");
      onRefresh();
    } catch (e: any) {
      toast.error(e.message || "Failed to archive");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search fee structures..."
            className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#003366]/30"
          />
        </div>
        <button className="flex items-center gap-1 text-sm text-gray-500 border border-gray-200 rounded-lg px-3 py-2 hover:bg-gray-50">
          <FiFilter size={14} /> Filters
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-4"><TableSkeleton rows={5} /></div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-gray-400 text-sm">No fee structures found.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Fee Name</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Category</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Type</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Amount (PKR)</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Status</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((item) => {
                const cat = item.categoryId as any;
                return (
                  <tr key={item._id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-medium text-gray-800">{item.name}</td>
                    <td className="px-4 py-3 text-gray-500">{cat?.name || "—"}</td>
                    <td className="px-4 py-3 text-gray-500 capitalize">{item.feeType.replace("_", " ")}</td>
                    <td className="px-4 py-3 text-[#003366] font-medium">{item.defaultAmount.toLocaleString()}</td>
                    <td className="px-4 py-3"><StatusBadge status={item.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => router.push(`/fees-management/create?edit=${item._id}`)}
                          className="p-1.5 rounded text-gray-400 hover:text-[#003366] hover:bg-blue-50"
                          title="Edit"
                        >
                          <FiEdit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDuplicate(item._id)}
                          className="p-1.5 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                          title="Duplicate"
                        >
                          <FiCopy size={14} />
                        </button>
                        <button
                          onClick={() => handleArchive(item._id)}
                          className="p-1.5 rounded text-gray-400 hover:text-red-500 hover:bg-red-50"
                          title="Archive"
                        >
                          <FiArchive size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ─── Fee Assignments Tab ───────────────────────────────────────────────────────

function FeeAssignmentsTab({
  assignments,
  loading,
  onRefresh,
}: {
  assignments: FeeAssignment[];
  loading: boolean;
  onRefresh: () => void;
}) {
  const [subTab, setSubTab] = useState<"assigned" | "unassigned">("assigned");

  const active = assignments.filter((a) => a.status !== "archived");
  const archived = assignments.filter((a) => a.status === "archived");

  const handlePublish = async (id: string) => {
    try {
      await publishFeeAssignment(id);
      toast.success("Fee assignment published");
      onRefresh();
    } catch (e: any) {
      toast.error(e.message || "Failed to publish");
    }
  };

  const handleUnpublish = async (id: string) => {
    try {
      await unpublishFeeAssignment(id);
      toast.success("Fee assignment unpublished");
      onRefresh();
    } catch (e: any) {
      toast.error(e.message || "Failed to unpublish");
    }
  };

  const handleArchive = async (id: string) => {
    try {
      await archiveFeeAssignment(id);
      toast.success("Assignment archived");
      onRefresh();
    } catch (e: any) {
      toast.error(e.message || "Failed to archive");
    }
  };

  const display = subTab === "assigned" ? active : archived;

  return (
    <div className="space-y-4">
      <div className="flex gap-1 border-b border-gray-100">
        {(["assigned", "unassigned"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setSubTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors ${
              subTab === t
                ? "border-[#003366] text-[#003366]"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-4"><TableSkeleton rows={5} /></div>
        ) : display.length === 0 ? (
          <div className="py-12 text-center text-gray-400 text-sm">No assignments found.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Fee Name</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Assigned Class</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Due Date</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Amount (PKR)</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Status</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {display.map((a) => {
                const fee = a.feeItemId as any;
                const cls = a.classId as any;
                return (
                  <tr key={a._id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-medium text-gray-800">{fee?.name || "—"}</td>
                    <td className="px-4 py-3 text-gray-500">{cls?.name || "—"}</td>
                    <td className="px-4 py-3 text-gray-500">
                      {a.dueDate ? new Date(a.dueDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                    </td>
                    <td className="px-4 py-3 text-[#003366] font-medium">{a.amount.toLocaleString()}</td>
                    <td className="px-4 py-3"><StatusBadge status={a.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {a.status === "draft" || a.status === "inactive" ? (
                          <button
                            onClick={() => handlePublish(a._id)}
                            className="text-xs px-2 py-1 rounded bg-green-100 text-green-700 hover:bg-green-200"
                          >
                            Publish
                          </button>
                        ) : a.status === "active" ? (
                          <button
                            onClick={() => handleUnpublish(a._id)}
                            className="text-xs px-2 py-1 rounded bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                          >
                            Unpublish
                          </button>
                        ) : null}
                        <button
                          onClick={() => handleArchive(a._id)}
                          className="p-1.5 rounded text-gray-400 hover:text-red-500 hover:bg-red-50"
                          title="Archive"
                        >
                          <FiArchive size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ─── Archived Tab ──────────────────────────────────────────────────────────────

function ArchivedTab({
  categories,
  items,
  assignments,
  onRefresh,
}: {
  categories: FeeCategory[];
  items: FeeItem[];
  assignments: FeeAssignment[];
  onRefresh: () => void;
}) {
  const [type, setType] = useState<"categories" | "items" | "assignments">("categories");

  const handleRestore = async (id: string) => {
    try {
      if (type === "categories") await restoreFeeCategory(id);
      else if (type === "items") await restoreFeeItem(id);
      else await restoreFeeAssignment(id);
      toast.success("Restored successfully");
      onRefresh();
    } catch (e: any) {
      toast.error(e.message || "Failed to restore");
    }
  };

  const archivedCategories = categories.filter((c) => c.status === "archived");
  const archivedItems = items.filter((i) => i.status === "archived");
  const archivedAssignments = assignments.filter((a) => a.status === "archived");

  const current =
    type === "categories" ? archivedCategories : type === "items" ? archivedItems : archivedAssignments;

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {(["categories", "items", "assignments"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setType(t)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize ${
              type === t ? "bg-[#003366] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {current.length === 0 ? (
          <div className="py-12 text-center text-gray-400 text-sm">No archived {type} found.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Name</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Archived At</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {current.map((item: any) => (
                <tr key={item._id} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3 font-medium text-gray-700">{item.name || (item.feeItemId as any)?.name || "—"}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {new Date(item.updatedAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleRestore(item._id)}
                      className="flex items-center gap-1 text-xs text-green-600 hover:text-green-700 border border-green-200 px-2 py-1 rounded-lg hover:bg-green-50"
                    >
                      <FiRefreshCw size={12} /> Restore
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

const TABS = ["Overview", "Fee Categories", "Fee Structures", "Fee Assignments", "Archived"] as const;
type Tab = (typeof TABS)[number];

export default function FeesManagementPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("Overview");
  const [createMenuOpen, setCreateMenuOpen] = useState(false);

  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [categories, setCategories] = useState<FeeCategory[]>([]);
  const [items, setItems] = useState<FeeItem[]>([]);
  const [assignments, setAssignments] = useState<FeeAssignment[]>([]);
  const [receiptSettings, setReceiptSettings] = useState<ReceiptSettings | null>(null);

  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingItems, setLoadingItems] = useState(true);
  const [loadingAssignments, setLoadingAssignments] = useState(true);

  const loadAll = useCallback(async () => {
    setLoadingCategories(true);
    setLoadingItems(true);
    setLoadingAssignments(true);
    try {
      const [s, cats, itemsRes, assignRes, receiptRes] = await Promise.all([
        getFeesDashboardSummary().catch(() => null),
        getFeeCategories(true).catch(() => []),
        getFeeItems({ limit: 50, includeArchived: true }).catch(() => ({ data: [], total: 0 })),
        getFeeAssignments({ limit: 50, includeArchived: true }).catch(() => ({ data: [], total: 0 })),
        getReceiptSettings().catch(() => null),
      ]);
      setSummary(s);
      setCategories(cats);
      setItems(itemsRes.data);
      setAssignments(assignRes.data);
      setReceiptSettings(receiptRes);
    } finally {
      setLoadingCategories(false);
      setLoadingItems(false);
      setLoadingAssignments(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const categorySummary = categories.filter((c) => c.status === "active");

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-screen-xl mx-auto px-6 py-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Fees Management</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Create, manage and assign multiple fees to one or more classes.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 text-sm text-gray-600 border border-gray-200 rounded-xl px-4 py-2 hover:bg-gray-50 bg-white">
              <FiSettings size={15} /> Settings
            </button>
            <div className="relative">
              <button
                onClick={() => setCreateMenuOpen(!createMenuOpen)}
                className="flex items-center gap-2 text-sm bg-[#003366] text-white rounded-xl px-4 py-2 hover:bg-[#003366]/90 font-medium"
              >
                <FiPlus size={15} /> Create New Fee <FiChevronDown size={14} />
              </button>
              {createMenuOpen && (
                <div className="absolute right-0 top-11 bg-white border border-gray-100 rounded-xl shadow-lg py-1 z-20 w-52">
                  <button
                    onClick={() => { router.push("/fees-management/create"); setCreateMenuOpen(false); }}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <FiPlus size={14} /> Create New Fee
                  </button>
                  <button
                    onClick={() => { router.push("/fees-management/assign"); setCreateMenuOpen(false); }}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <FiPlus size={14} /> Add Existing Fee to Classes
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-6">
          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Tabs */}
            <div className="flex gap-1 border-b border-gray-200 mb-6">
              {TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === tab
                      ? "border-[#003366] text-[#003366]"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {activeTab === "Overview" && (
              <OverviewTab
                summary={summary}
                items={items.filter((i) => i.status !== "archived")}
                loadingItems={loadingItems}
                onRefresh={loadAll}
              />
            )}
            {activeTab === "Fee Categories" && (
              <CategoriesTab
                categories={categories}
                loading={loadingCategories}
                onRefresh={loadAll}
              />
            )}
            {activeTab === "Fee Structures" && (
              <FeeStructuresTab
                items={items.filter((i) => i.status !== "archived")}
                loading={loadingItems}
                onRefresh={loadAll}
              />
            )}
            {activeTab === "Fee Assignments" && (
              <FeeAssignmentsTab
                assignments={assignments}
                loading={loadingAssignments}
                onRefresh={loadAll}
              />
            )}
            {activeTab === "Archived" && (
              <ArchivedTab
                categories={categories}
                items={items}
                assignments={assignments}
                onRefresh={loadAll}
              />
            )}
          </div>

          {/* Right Sidebar */}
          <div className="w-64 shrink-0 space-y-4">
            {/* Fee Categories Summary */}
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-700">Fee Categories</h3>
                <button
                  onClick={() => setActiveTab("Fee Categories")}
                  className="text-xs text-[#003366] hover:underline"
                >
                  View All
                </button>
              </div>
              {loadingCategories ? (
                <div className="space-y-2 animate-pulse">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-6 bg-gray-100 rounded" />
                  ))}
                </div>
              ) : categorySummary.length === 0 ? (
                <p className="text-xs text-gray-400">No categories yet.</p>
              ) : (
                <div className="space-y-2">
                  {categorySummary.slice(0, 6).map((cat) => (
                    <div key={cat._id} className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">{cat.name}</span>
                      <span className="text-xs text-gray-400">{cat.feeCount ?? "—"} Items</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Quick Actions</h3>
              <div className="space-y-2">
                {[
                  { label: "Create New Fee", action: () => router.push("/fees-management/create") },
                  { label: "Add Existing Fee to Classes", action: () => router.push("/fees-management/assign") },
                  { label: "View Fee Reports", action: () => {} },
                  { label: "Fee Collection Overview", action: () => {} },
                  { label: "Export Fee Structures", action: () => {} },
                ].map((item) => (
                  <button
                    key={item.label}
                    onClick={item.action}
                    className="w-full text-left text-xs text-[#003366] hover:underline py-1"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Signature Settings */}
            <SignatureCard
              settings={receiptSettings}
              onUpdate={loadAll}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
