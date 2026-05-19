"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FiChevronRight, FiChevronLeft, FiSearch, FiFilter, FiCheck } from "react-icons/fi";
import { toast } from "@/components/CustomToast";
import {
  getFeeItems,
  assignFeeToClasses,
  type FeeItem,
  type ClassAssignmentOverride,
} from "@/app/services/fees.service";
import { getClasses, type Class } from "@/app/services/student.service";

// ─── Step Indicator ───────────────────────────────────────────────────────────

const STEPS = ["Select Fee", "Select Classes", "Set Amount & Due Date", "Review & Confirm"];

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-0 mb-8">
      {STEPS.map((label, i) => (
        <div key={label} className="flex items-center">
          <div className="flex items-center gap-2">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                i < current
                  ? "bg-[#003366] border-[#003366] text-white"
                  : i === current
                  ? "border-[#003366] text-[#003366] bg-white"
                  : "border-gray-200 text-gray-400 bg-white"
              }`}
            >
              {i < current ? <FiCheck size={13} /> : i + 1}
            </div>
            <span
              className={`text-sm font-medium ${
                i === current ? "text-[#003366]" : i < current ? "text-gray-600" : "text-gray-400"
              }`}
            >
              {label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`w-8 h-0.5 mx-2 ${i < current ? "bg-[#003366]" : "bg-gray-200"}`} />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Step 1: Select Fee ───────────────────────────────────────────────────────

function SelectFeeStep({
  items,
  selectedFee,
  onSelect,
}: {
  items: FeeItem[];
  selectedFee: FeeItem | null;
  onSelect: (fee: FeeItem) => void;
}) {
  const [search, setSearch] = useState("");

  const filtered = items.filter(
    (i) =>
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      (i.categoryId as any)?.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex gap-6">
      <div className="flex-1 bg-white rounded-xl border border-gray-100 p-4 space-y-4">
        <div>
          <h2 className="font-semibold text-gray-800">1. Select Fee</h2>
          <p className="text-xs text-gray-400 mt-0.5">Choose the existing fee you want to assign.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by fee name or category..."
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#003366]/30"
            />
          </div>
          <button className="flex items-center gap-1 text-sm text-gray-500 border border-gray-200 rounded-lg px-3 py-2 hover:bg-gray-50">
            <FiFilter size={14} /> Filters
          </button>
        </div>

        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="w-8 px-4 py-3" />
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Fee Name</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Category</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Academic Year</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Type</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Amount (PKR)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400 text-sm">
                  No fee items found.
                </td>
              </tr>
            ) : (
              filtered.map((item) => {
                const cat = item.categoryId as any;
                const isSelected = selectedFee?._id === item._id;
                return (
                  <tr
                    key={item._id}
                    onClick={() => onSelect(item)}
                    className={`cursor-pointer transition-colors ${
                      isSelected ? "bg-[#003366]/5" : "hover:bg-gray-50"
                    }`}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="radio"
                        checked={isSelected}
                        readOnly
                        className="accent-[#003366]"
                      />
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-800">{item.name}</td>
                    <td className="px-4 py-3 text-gray-500">{cat?.name || "—"}</td>
                    <td className="px-4 py-3 text-gray-500">2026 - 2027</td>
                    <td className="px-4 py-3">
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full capitalize">
                        {item.feeType.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-[#003366]">
                      {item.defaultAmount.toLocaleString()}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>Showing 1 to {filtered.length} of {items.length} fees</span>
        </div>
      </div>

      {/* Selected Fee Summary */}
      <div className="w-64 shrink-0">
        <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
          <h3 className="text-sm font-semibold text-gray-700">Selected Fee Summary</h3>
          {selectedFee ? (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Fee Name</span>
                <span className="font-medium text-gray-800">{selectedFee.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Category</span>
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                  {(selectedFee.categoryId as any)?.name || "—"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Type</span>
                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full capitalize">
                  {selectedFee.feeType.replace("_", " ")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Academic Year</span>
                <span className="font-medium text-gray-800">2026 - 2027</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Default Amount</span>
                <span className="font-medium text-[#003366]">
                  PKR {selectedFee.defaultAmount.toLocaleString()}
                </span>
              </div>
              {selectedFee.description && (
                <div>
                  <span className="text-gray-500">Description</span>
                  <p className="font-medium text-gray-800 text-xs mt-0.5">{selectedFee.description}</p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-gray-400">Select a fee to see details.</p>
          )}
        </div>

        <div className="mt-3 bg-blue-50 rounded-xl p-3 text-xs text-blue-700">
          You can set different amounts and due dates for each class in the next step.
        </div>
      </div>
    </div>
  );
}

// ─── Step 2: Select Classes ───────────────────────────────────────────────────

function SelectClassesStep({
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

  const filtered = classes.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const totalStudents = classes
    .filter((c) => selected.has(c._id))
    .reduce((sum, c) => sum + Number(c.classCapacity || 0), 0);

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-5">
      <div>
        <h2 className="font-semibold text-gray-800">2. Select Classes</h2>
        <p className="text-xs text-gray-400 mt-0.5">Select one or more classes to assign this fee.</p>
      </div>

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
          <FiSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={13} />
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
                checked ? "border-[#003366] bg-[#003366]/5" : "border-gray-200 hover:border-gray-300"
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
        <div className="flex items-center justify-between pt-2 border-t border-gray-50">
          <span className="text-sm text-gray-600">
            Selected Classes ({selected.size}) · Total Students: {totalStudents}
          </span>
          <button onClick={onClear} className="text-xs text-red-500 hover:text-red-600">
            Clear Selection
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Step 3: Set Amount & Due Date ────────────────────────────────────────────

interface ClassOverride {
  classId: string;
  amount: string;
  dueDate: string;
  lateFeeAmount: string;
}

function SetAmountStep({
  classes,
  selectedClassIds,
  fee,
  overrides,
  setOverrides,
}: {
  classes: Class[];
  selectedClassIds: Set<string>;
  fee: FeeItem;
  overrides: Record<string, ClassOverride>;
  setOverrides: (o: Record<string, ClassOverride>) => void;
}) {
  const selectedClasses = classes.filter((c) => selectedClassIds.has(c._id));

  const setField = (classId: string, field: keyof ClassOverride, value: string) => {
    setOverrides({
      ...overrides,
      [classId]: {
        ...(overrides[classId] || {
          classId,
          amount: String(fee.defaultAmount),
          dueDate: fee.defaultDueDate
            ? new Date(fee.defaultDueDate).toISOString().split("T")[0]
            : "",
          lateFeeAmount: String(fee.lateFeeAmount || 0),
        }),
        [field]: value,
      },
    });
  };

  const applyAll = () => {
    if (!selectedClasses[0]) return;
    const first = overrides[selectedClasses[0]._id] || {
      classId: selectedClasses[0]._id,
      amount: String(fee.defaultAmount),
      dueDate: fee.defaultDueDate
        ? new Date(fee.defaultDueDate).toISOString().split("T")[0]
        : "",
      lateFeeAmount: String(fee.lateFeeAmount || 0),
    };
    const updated: Record<string, ClassOverride> = {};
    selectedClasses.forEach((c) => {
      updated[c._id] = { ...first, classId: c._id };
    });
    setOverrides(updated);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
      <div>
        <h2 className="font-semibold text-gray-800">3. Set Amount & Due Date</h2>
        <p className="text-xs text-gray-400 mt-0.5">Set amount and due date for each selected class.</p>
      </div>

      <table className="w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Class</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Students</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Amount (PKR)</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Due Date</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {selectedClasses.map((cls) => {
            const override = overrides[cls._id] || {
              classId: cls._id,
              amount: String(fee.defaultAmount),
              dueDate: fee.defaultDueDate
                ? new Date(fee.defaultDueDate).toISOString().split("T")[0]
                : "",
              lateFeeAmount: String(fee.lateFeeAmount || 0),
            };

            return (
              <tr key={cls._id} className="hover:bg-gray-50/50">
                <td className="px-4 py-3 font-medium text-gray-800">{cls.name}</td>
                <td className="px-4 py-3 text-gray-500">{cls.classCapacity}</td>
                <td className="px-4 py-3">
                  <input
                    type="number"
                    value={override.amount}
                    onChange={(e) => setField(cls._id, "amount", e.target.value)}
                    min="0"
                    className="w-28 border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#003366]/30"
                  />
                </td>
                <td className="px-4 py-3">
                  <input
                    type="date"
                    value={override.dueDate}
                    onChange={(e) => setField(cls._id, "dueDate", e.target.value)}
                    className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#003366]/30"
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={applyAll}
          className="flex items-center gap-1 text-xs text-[#003366] border border-[#003366]/30 rounded-lg px-3 py-1.5 hover:bg-[#003366]/5"
        >
          Apply same amount and due date to all
        </button>
      </div>
    </div>
  );
}

// ─── Step 4: Review & Confirm ─────────────────────────────────────────────────

function ReviewStep({
  fee,
  classes,
  selectedClassIds,
  overrides,
}: {
  fee: FeeItem;
  classes: Class[];
  selectedClassIds: Set<string>;
  overrides: Record<string, ClassOverride>;
}) {
  const cat = fee.categoryId as any;
  const selectedClasses = classes.filter((c) => selectedClassIds.has(c._id));
  const totalAmount = selectedClasses.reduce((sum, c) => {
    const o = overrides[c._id];
    return sum + Number(o?.amount || fee.defaultAmount);
  }, 0);
  const totalStudents = selectedClasses.reduce((s, c) => s + Number(c.classCapacity || 0), 0);

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-5">
      <div>
        <h2 className="font-semibold text-gray-800">4. Review & Confirm</h2>
        <p className="text-xs text-gray-400 mt-0.5">Review the details before assigning this fee.</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Fee Name</span>
            <span className="font-medium text-gray-800">{fee.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Academic Year</span>
            <span className="font-medium text-gray-800">2026 - 2027</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Fee Type</span>
            <span className="font-medium text-gray-800 capitalize">{fee.feeType.replace("_", " ")}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Total Expected</span>
            <span className="font-bold text-[#003366]">PKR {totalAmount.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Total Students</span>
            <span className="font-medium text-gray-800">{totalStudents}</span>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Classes ({selectedClasses.length})
          </p>
          <table className="w-full text-xs">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-3 py-2 text-gray-500">Class</th>
                <th className="text-left px-3 py-2 text-gray-500">Students</th>
                <th className="text-left px-3 py-2 text-gray-500">Amount</th>
                <th className="text-left px-3 py-2 text-gray-500">Due Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {selectedClasses.map((cls) => {
                const o = overrides[cls._id];
                const amount = Number(o?.amount || fee.defaultAmount);
                const dueDate = o?.dueDate
                  ? new Date(o.dueDate).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })
                  : "—";
                return (
                  <tr key={cls._id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 font-medium text-gray-700">{cls.name}</td>
                    <td className="px-3 py-2 text-gray-500">{cls.classCapacity}</td>
                    <td className="px-3 py-2 text-[#003366] font-medium">
                      PKR {amount.toLocaleString()}
                    </td>
                    <td className="px-3 py-2 text-gray-500">{dueDate}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Step 5: Success ──────────────────────────────────────────────────────────

function SuccessStep({
  fee,
  classCount,
  studentCount,
  totalAmount,
  onGoBack,
  onAssignAnother,
}: {
  fee: FeeItem;
  classCount: number;
  studentCount: number;
  totalAmount: number;
  onGoBack: () => void;
  onAssignAnother: () => void;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-12 flex flex-col items-center text-center space-y-5">
      <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
        <FiCheck className="text-green-600" size={28} />
      </div>
      <div>
        <h2 className="text-xl font-bold text-gray-900">Fee Assigned Successfully!</h2>
        <p className="text-sm text-gray-500 mt-1">
          {fee.name} has been assigned to {classCount} class{classCount !== 1 ? "es" : ""}.
        </p>
      </div>
      <div className="grid grid-cols-3 gap-6 w-full max-w-sm">
        <div>
          <p className="text-xs text-gray-400">Total Classes</p>
          <p className="text-2xl font-bold text-gray-800">{classCount}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400">Total Students</p>
          <p className="text-2xl font-bold text-gray-800">{studentCount}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400">Total Amount</p>
          <p className="text-lg font-bold text-[#003366]">PKR {totalAmount.toLocaleString()}</p>
        </div>
      </div>
      <div className="flex gap-3">
        <button
          onClick={onGoBack}
          className="px-5 py-2 text-sm bg-[#003366] text-white rounded-xl font-medium hover:bg-[#003366]/90"
        >
          Go to Fees Management
        </button>
        <button
          onClick={onAssignAnother}
          className="px-5 py-2 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50"
        >
          Assign Another Fee
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

function AssignFeeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedFeeId = searchParams.get("feeId");

  const [step, setStep] = useState(0);
  const [feeItems, setFeeItems] = useState<FeeItem[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedFee, setSelectedFee] = useState<FeeItem | null>(null);
  const [selectedClasses, setSelectedClasses] = useState<Set<string>>(new Set());
  const [overrides, setOverrides] = useState<Record<string, ClassOverride>>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [successStats, setSuccessStats] = useState({ classCount: 0, studentCount: 0, totalAmount: 0 });

  useEffect(() => {
    const load = async () => {
      const [itemsRes, classData] = await Promise.all([
        getFeeItems({ limit: 100, status: "active" }).catch(() => ({ data: [], total: 0 })),
        getClasses().catch(() => []),
      ]);
      setFeeItems(itemsRes.data);
      setClasses(classData);

      if (preselectedFeeId) {
        const fee = itemsRes.data.find((f) => f._id === preselectedFeeId);
        if (fee) { setSelectedFee(fee); setStep(1); }
      }
    };
    load();
  }, [preselectedFeeId]);

  const toggleClass = (id: string) => {
    setSelectedClasses((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleNext = () => {
    if (step === 0 && !selectedFee) {
      toast.error("Please select a fee");
      return;
    }
    if (step === 1 && selectedClasses.size === 0) {
      toast.error("Please select at least one class");
      return;
    }
    setStep((s) => s + 1);
  };

  const handleBack = () => setStep((s) => s - 1);

  const handleAssign = async () => {
    if (!selectedFee) return;

    const selectedClassObjs = classes.filter((c) => selectedClasses.has(c._id));

    const classEntries = selectedClassObjs.map((cls): ClassAssignmentOverride => {
      const o = overrides[cls._id];
      return {
        classId: cls._id,
        amount: Number(o?.amount || selectedFee.defaultAmount),
        dueDate:
          o?.dueDate ||
          (selectedFee.defaultDueDate
            ? new Date(selectedFee.defaultDueDate).toISOString().split("T")[0]
            : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]),
        lateFeeAmount: Number(o?.lateFeeAmount || selectedFee.lateFeeAmount || 0),
        isVisibleToParents: selectedFee.isVisibleToParents,
      };
    });

    setSubmitting(true);
    try {
      const result = await assignFeeToClasses({
        feeItemId: selectedFee._id,
        classes: classEntries,
      });

      const totalAmount = classEntries.reduce((sum, c) => sum + c.amount, 0);
      const totalStudents = selectedClassObjs.reduce((sum, c) => sum + Number(c.classCapacity || 0), 0);

      setSuccessStats({
        classCount: result.assigned,
        studentCount: totalStudents,
        totalAmount,
      });
      toast.success(`Fee assigned to ${result.assigned} class(es)`);
      setSuccess(true);
    } catch (e: any) {
      toast.error(e.message || "Failed to assign fee");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setStep(0);
    setSelectedFee(null);
    setSelectedClasses(new Set());
    setOverrides({});
    setSuccess(false);
  };

  if (success && selectedFee) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-screen-lg mx-auto px-6 py-6">
          <SuccessStep
            fee={selectedFee}
            classCount={successStats.classCount}
            studentCount={successStats.studentCount}
            totalAmount={successStats.totalAmount}
            onGoBack={() => router.push("/fees-management")}
            onAssignAnother={handleReset}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-screen-xl mx-auto px-6 py-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
          <button onClick={() => router.push("/fees-management")} className="hover:text-[#003366]">
            Fees Management
          </button>
          <FiChevronRight size={14} />
          <span className="text-gray-600">Add Existing Fee to Classes</span>
        </div>

        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Add Existing Fee to Classes</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Assign an existing fee to one or more classes. You can set different amounts and due dates for each class if needed.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => router.push("/fees-management")}
              className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50"
            >
              Cancel
            </button>
            {step < 3 ? (
              <button
                onClick={handleNext}
                className="flex items-center gap-2 px-5 py-2 text-sm bg-[#003366] text-white rounded-xl font-medium hover:bg-[#003366]/90"
              >
                Next <FiChevronRight size={15} />
              </button>
            ) : (
              <button
                onClick={handleAssign}
                disabled={submitting}
                className="flex items-center gap-2 px-5 py-2 text-sm bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 disabled:opacity-60"
              >
                <FiCheck size={15} /> {submitting ? "Assigning..." : "Assign Fee"}
              </button>
            )}
          </div>
        </div>

        <StepIndicator current={step} />

        {step === 0 && (
          <SelectFeeStep
            items={feeItems}
            selectedFee={selectedFee}
            onSelect={setSelectedFee}
          />
        )}

        {step === 1 && (
          <SelectClassesStep
            classes={classes}
            selected={selectedClasses}
            onToggle={toggleClass}
            onSelectAll={() => setSelectedClasses(new Set(classes.map((c) => c._id)))}
            onClear={() => setSelectedClasses(new Set())}
          />
        )}

        {step === 2 && selectedFee && (
          <SetAmountStep
            classes={classes}
            selectedClassIds={selectedClasses}
            fee={selectedFee}
            overrides={overrides}
            setOverrides={setOverrides}
          />
        )}

        {step === 3 && selectedFee && (
          <ReviewStep
            fee={selectedFee}
            classes={classes}
            selectedClassIds={selectedClasses}
            overrides={overrides}
          />
        )}

        {/* Bottom navigation */}
        {step > 0 && (
          <div className="mt-6 flex justify-between">
            <button
              onClick={handleBack}
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50"
            >
              <FiChevronLeft size={15} /> Back
            </button>
            {step < 3 ? (
              <button
                onClick={handleNext}
                className="flex items-center gap-2 px-5 py-2 text-sm bg-[#003366] text-white rounded-xl font-medium hover:bg-[#003366]/90"
              >
                Next <FiChevronRight size={15} />
              </button>
            ) : (
              <button
                onClick={handleAssign}
                disabled={submitting}
                className="flex items-center gap-2 px-5 py-2 text-sm bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 disabled:opacity-60"
              >
                <FiCheck size={15} /> {submitting ? "Assigning..." : "Assign Fee"}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AssignFeePage() {
  return (
    <Suspense fallback={<div className="p-8 text-gray-400">Loading...</div>}>
      <AssignFeeContent />
    </Suspense>
  );
}
