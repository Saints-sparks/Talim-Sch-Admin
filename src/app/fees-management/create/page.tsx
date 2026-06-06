"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FiChevronRight, FiSearch } from "react-icons/fi";
import { toast } from "@/components/CustomToast";
import {
  createFeeItem,
  updateFeeItem,
  getFeeItemById,
  getFeeCategories,
  assignFeeToClasses,
  type FeeCategory,
  type FeeItem,
} from "@/app/services/fees.service";
import { getClasses, type Class } from "@/app/services/student.service";

// ─── Types ────────────────────────────────────────────────────────────────────

interface FormData {
  name: string;
  categoryId: string;
  description: string;
  academicYearId: string;
  termId: string;
  feeType: string;
  defaultAmount: string;
  defaultDueDate: string;
  lateFeeAmount: string;
  allowPartialPayment: boolean;
  isVisibleToParents: boolean;
  includeInCollection: boolean;
  applyLateFeeAfterDue: boolean;
  status: FeeItem["status"];
}

const INITIAL: FormData = {
  name: "",
  categoryId: "",
  description: "",
  academicYearId: "",
  termId: "",
  feeType: "one_time",
  defaultAmount: "",
  defaultDueDate: "",
  lateFeeAmount: "",
  allowPartialPayment: false,
  isVisibleToParents: true,
  includeInCollection: true,
  applyLateFeeAfterDue: true,
  status: "draft",
};

const FEE_TYPES = [
  { value: "one_time", label: "One Time" },
  { value: "recurring", label: "Recurring" },
  { value: "termly", label: "Termly" },
  { value: "annual", label: "Annual" },
];

const FEE_STATUSES: Array<{ value: FeeItem["status"]; label: string }> = [
  { value: "draft", label: "Draft" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

// ─── Summary Panel ────────────────────────────────────────────────────────────

function SummaryPanel({
  form,
  selectedClasses,
  categories,
  classes,
}: {
  form: FormData;
  selectedClasses: Set<string>;
  categories: FeeCategory[];
  classes: Class[];
}) {
  const cat = categories.find((c) => c._id === form.categoryId);
  const selectedClassObjs = classes.filter((c) => selectedClasses.has(c._id));
  const totalStudents = selectedClassObjs.reduce((sum, c) => sum + Number(c.classCapacity || 0), 0);

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-4 sticky top-6">
      <h3 className="font-semibold text-gray-800">Fee Summary</h3>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-500">Fee Name</span>
          <span className="font-medium text-gray-800 text-right max-w-[160px] truncate">
            {form.name || "—"}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-500">Category</span>
          {cat ? (
            <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">
              {cat.name}
            </span>
          ) : (
            <span className="text-gray-400">—</span>
          )}
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Fee Type</span>
          <span className="font-medium text-gray-800 capitalize">
            {form.feeType.replace("_", " ") || "—"}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Amount (NGN)</span>
          <span className="font-medium text-[#003366]">
            {form.defaultAmount ? Number(form.defaultAmount).toLocaleString() : "—"}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Due Date</span>
          <span className="font-medium text-gray-800">
            {form.defaultDueDate
              ? new Date(form.defaultDueDate).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })
              : "—"}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Late Fee</span>
          <span className="font-medium text-gray-800">
            {form.lateFeeAmount ? Number(form.lateFeeAmount).toLocaleString() : "—"}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Status</span>
          <span className="font-medium text-gray-800 capitalize">{form.status}</span>
        </div>
      </div>

      {selectedClasses.size > 0 && (
        <>
          <hr className="border-gray-100" />
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Assigned Classes</span>
              <span className="font-medium text-gray-800">{selectedClasses.size} Classes</span>
            </div>
            <div className="space-y-1">
              {selectedClassObjs.slice(0, 4).map((c) => (
                <div key={c._id} className="flex items-center gap-1">
                  <div className="w-1 h-1 rounded-full bg-[#003366]" />
                  <span className="text-xs text-gray-500">
                    {c.name} ({c.classCapacity} Students)
                  </span>
                </div>
              ))}
              {selectedClasses.size > 4 && (
                <p className="text-xs text-gray-400 pl-2">
                  +{selectedClasses.size - 4} more classes
                </p>
              )}
            </div>
          </div>
          <div className="bg-blue-50 rounded-lg p-3 text-xs text-blue-700">
            This fee will be assigned to <strong>{totalStudents} students</strong>
            <br />
            <span className="text-blue-500">Total students in selected classes</span>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Class Selector ───────────────────────────────────────────────────────────

function ClassSelector({
  classes,
  selected,
  onToggle,
  onSelectAll,
  onClear,
}: {
  classes: Class[];
  selected: Set<string>;
  onToggle: (id: string) => void;
  onSelectAll: () => void;
  onClear: () => void;
}) {
  const [search, setSearch] = useState("");

  const filtered = classes.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
          <input
            type="checkbox"
            checked={selected.size === classes.length && classes.length > 0}
            onChange={selected.size === classes.length ? onClear : onSelectAll}
            className="w-4 h-4 rounded accent-[#003366]"
          />
          Select All Classes
        </label>
        <div className="relative">
          <FiSearch
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
            size={13}
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search classes..."
            className="pl-7 pr-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#003366]/30"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {filtered.map((cls) => {
          const checked = selected.has(cls._id);
          return (
            <button
              key={cls._id}
              type="button"
              onClick={() => onToggle(cls._id)}
              className={`relative flex flex-col items-start p-3 rounded-xl border-2 text-left transition-all ${
                checked
                  ? "border-[#003366] bg-[#003366]/5"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <input
                type="checkbox"
                checked={checked}
                readOnly
                className="absolute top-2 left-2 w-4 h-4 rounded accent-[#003366]"
              />
              <span className="pl-6 text-sm font-medium text-gray-800">{cls.name}</span>
              <span className="pl-6 text-xs text-gray-400">{cls.classCapacity} Students</span>
            </button>
          );
        })}
      </div>

      {selected.size > 0 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">Selected Classes ({selected.size})</span>
          <button onClick={onClear} className="text-xs text-red-500 hover:text-red-600">
            Clear Selection
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Toggle Switch ─────────────────────────────────────────────────────────────

function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-700">{label}</p>
        {description && <p className="text-xs text-gray-400">{description}</p>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          checked ? "bg-[#003366]" : "bg-gray-200"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow ${
            checked ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

function CreateFeeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");

  const [form, setForm] = useState<FormData>(INITIAL);
  const [categories, setCategories] = useState<FeeCategory[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClasses, setSelectedClasses] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const load = async () => {
      const [cats, classData] = await Promise.all([
        getFeeCategories().catch(() => []),
        getClasses().catch(() => []),
      ]);
      setCategories(cats);
      setClasses(classData);

      if (editId) {
        const item = await getFeeItemById(editId).catch(() => null);
        if (item) {
          const cat = item.categoryId as any;
          setForm({
            name: item.name,
            categoryId: cat?._id || cat || "",
            description: item.description,
            academicYearId: (item.academicYearId as string) || "",
            termId: (item.termId as string) || "",
            feeType: item.feeType,
            defaultAmount: String(item.defaultAmount),
            defaultDueDate: item.defaultDueDate
              ? new Date(item.defaultDueDate).toISOString().split("T")[0]
              : "",
            lateFeeAmount: String(item.lateFeeAmount || ""),
            allowPartialPayment: item.allowPartialPayment,
            isVisibleToParents: item.isVisibleToParents,
            includeInCollection: item.includeInCollection,
            applyLateFeeAfterDue: true,
            status: item.status,
          });
        }
      }
    };
    load();
  }, [editId]);

  const set = (key: keyof FormData, value: any) => setForm((prev) => ({ ...prev, [key]: value }));

  const toggleClass = (id: string) => {
    setSelectedClasses((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.categoryId || !form.defaultAmount) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: form.name.trim(),
        categoryId: form.categoryId,
        description: form.description,
        feeType: form.feeType as any,
        defaultAmount: Number(form.defaultAmount),
        defaultDueDate: form.defaultDueDate || undefined,
        lateFeeAmount: form.lateFeeAmount ? Number(form.lateFeeAmount) : 0,
        allowPartialPayment: form.allowPartialPayment,
        isVisibleToParents: form.isVisibleToParents,
        includeInCollection: form.includeInCollection,
        status: form.status,
      };

      let feeId = editId;
      if (editId) {
        await updateFeeItem(editId, payload);
        toast.success("Fee updated successfully");
      } else {
        const created = await createFeeItem(payload);
        feeId = created._id;
        toast.success("Fee created successfully");
      }

      if (selectedClasses.size > 0 && feeId && form.defaultDueDate) {
        await assignFeeToClasses({
          feeItemId: feeId,
          classes: Array.from(selectedClasses).map((classId) => ({
            classId,
            amount: Number(form.defaultAmount),
            dueDate: form.defaultDueDate,
            lateFeeAmount: form.lateFeeAmount ? Number(form.lateFeeAmount) : 0,
            isVisibleToParents: form.isVisibleToParents,
          })),
        });
        toast.success(`Fee assigned to ${selectedClasses.size} class(es)`);
      }

      router.push("/fees-management");
    } catch (e: any) {
      toast.error(e.message || "Failed to save fee");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-screen-xl mx-auto px-6 py-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
          <button onClick={() => router.push("/fees-management")} className="hover:text-[#003366]">
            Fees Management
          </button>
          <FiChevronRight size={14} />
          <span className="text-gray-600">{editId ? "Edit Fee" : "Create New Fee"}</span>
        </div>

        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {editId ? "Edit Fee" : "Create New Fee"}
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Add a new fee and assign it to one or more classes.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => router.push("/fees-management")}
              className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="create-fee-form"
              disabled={submitting}
              className="flex items-center gap-2 px-5 py-2 text-sm bg-[#003366] text-white rounded-xl font-medium disabled:opacity-60 hover:bg-[#003366]/90"
            >
              {submitting ? "Saving..." : editId ? "Update Fee" : "Save & Continue"}
              {!submitting && <FiChevronRight size={15} />}
            </button>
          </div>
        </div>

        <form id="create-fee-form" onSubmit={handleSubmit}>
          <div className="flex gap-6 items-start">
            <div className="flex-1 space-y-6">
              {/* Section 1: Fee Information */}
              <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-5">
                <div>
                  <h2 className="text-base font-semibold text-gray-800">1. Fee Information</h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Enter the basic details of the fee.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fee Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => set("name", e.target.value)}
                      placeholder="e.g. Annual Tuition Fee"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003366]/30"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={form.categoryId}
                      onChange={(e) => set("categoryId", e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003366]/30 bg-white"
                      required
                    >
                      <option value="">Select category</option>
                      {categories.map((c) => (
                        <option key={c._id} value={c._id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description (Optional)
                    </label>
                    <input
                      type="text"
                      value={form.description}
                      onChange={(e) => set("description", e.target.value)}
                      placeholder="Brief description..."
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003366]/30"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={form.status}
                      onChange={(e) => set("status", e.target.value as FeeItem["status"])}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003366]/30 bg-white"
                    >
                      {FEE_STATUSES.map((status) => (
                        <option key={status.value} value={status.value}>
                          {status.label}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-400 mt-1">
                      Active fees count on the dashboard and can be used for collection.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Term</label>
                    <select
                      value={form.termId}
                      onChange={(e) => set("termId", e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003366]/30 bg-white"
                    >
                      <option value="">Select term</option>
                      <option value="first">First Term</option>
                      <option value="second">Second Term</option>
                      <option value="third">Third Term</option>
                      <option value="whole_year">Whole Year</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fee Type <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-4">
                      {FEE_TYPES.map((ft) => (
                        <label key={ft.value} className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="radio"
                            name="feeType"
                            value={ft.value}
                            checked={form.feeType === ft.value}
                            onChange={() => set("feeType", ft.value)}
                            className="accent-[#003366]"
                          />
                          <span className="text-sm text-gray-700">{ft.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Amount (NGN) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={form.defaultAmount}
                      onChange={(e) => set("defaultAmount", e.target.value)}
                      placeholder="0"
                      min="0"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003366]/30"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Due Date <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        value={form.defaultDueDate}
                        onChange={(e) => set("defaultDueDate", e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003366]/30"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Late Fee (NGN) (Optional)
                    </label>
                    <input
                      type="number"
                      value={form.lateFeeAmount}
                      onChange={(e) => set("lateFeeAmount", e.target.value)}
                      placeholder="0"
                      min="0"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003366]/30"
                    />
                    <p className="text-xs text-gray-400 mt-1">Applied after due date</p>
                  </div>
                </div>
              </div>

              {/* Section 2: Assign to Classes */}
              <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
                <div>
                  <h2 className="text-base font-semibold text-gray-800">2. Assign to Classes</h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Select one or more classes to assign this fee.
                  </p>
                </div>
                <ClassSelector
                  classes={classes}
                  selected={selectedClasses}
                  onToggle={toggleClass}
                  onSelectAll={() => setSelectedClasses(new Set(classes.map((c) => c._id)))}
                  onClear={() => setSelectedClasses(new Set())}
                />
              </div>

              {/* Section 3: Additional Settings */}
              <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
                <div>
                  <h2 className="text-base font-semibold text-gray-800">3. Additional Settings</h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Configure other options for this fee.
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Toggle
                    checked={form.isVisibleToParents}
                    onChange={(v) => set("isVisibleToParents", v)}
                    label="Make fee visible to parents"
                    description="Parents will be able to view this fee in their portal."
                  />
                  <Toggle
                    checked={form.includeInCollection}
                    onChange={(v) => set("includeInCollection", v)}
                    label="Include in Fee Collection"
                    description="Include this fee in the fee collection process."
                  />
                  <Toggle
                    checked={form.allowPartialPayment}
                    onChange={(v) => set("allowPartialPayment", v)}
                    label="Allow Partial Payment"
                    description="Students can pay a portion of this fee."
                  />
                  <Toggle
                    checked={form.applyLateFeeAfterDue}
                    onChange={(v) => set("applyLateFeeAfterDue", v)}
                    label="Apply Late Fee After Due Date"
                    description="Automatically apply late fee after the due date."
                  />
                </div>
              </div>
            </div>

            {/* Summary Panel */}
            <div className="w-72 shrink-0">
              <SummaryPanel
                form={form}
                selectedClasses={selectedClasses}
                categories={categories}
                classes={classes}
              />

              {/* Tips */}
              <div className="mt-4 bg-white rounded-xl border border-gray-100 p-4 space-y-2">
                <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  💡 Tips
                </h3>
                <ul className="space-y-2 text-xs text-gray-500">
                  <li>• You can always edit or reassign this fee after creating it.</li>
                  <li>• Parents will see this fee in their portal once it&apos;s published.</li>
                  <li>• You can assign different amounts per class using the Assign flow.</li>
                </ul>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function CreateFeePage() {
  return (
    <Suspense fallback={<div className="p-8 text-gray-400">Loading...</div>}>
      <CreateFeeContent />
    </Suspense>
  );
}
