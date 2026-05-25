"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Download,
  Eye,
  Filter,
  Mail,
  MoreVertical,
  Pencil,
  Phone,
  Search,
  UserRound,
  UsersRound,
} from "lucide-react";
import Avatar from "@/components/Avatar";
import { toast } from "@/components/CustomToast";
import {
  Parent,
  ParentChild,
  parentService,
  ParentsStats,
} from "@/app/services/parent.service";
import { cn } from "@/lib/utils";

const defaultStats: ParentsStats = {
  totalParents: 0,
  activeParents: 0,
  inactiveParents: 0,
  totalChildren: 0,
};

const formatDate = (value?: string) => {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
};

const formatDateTime = (value?: string) => {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
};

const getParentName = (parent: Parent) =>
  `${parent.userId?.firstName ?? ""} ${parent.userId?.lastName ?? ""}`.trim() ||
  "Unknown Parent";

const getChildName = (child: ParentChild) =>
  `${child.userId?.firstName ?? ""} ${child.userId?.lastName ?? ""}`.trim() ||
  "Unknown Student";

const ParentsPage = () => {
  const [parents, setParents] = useState<Parent[]>([]);
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null);
  const [stats, setStats] = useState<ParentsStats>(defaultStats);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [genderFilter, setGenderFilter] = useState("all");
  const [sortBy, setSortBy] = useState("az");
  const [meta, setMeta] = useState({
    total: 0,
    page: 1,
    lastPage: 1,
    limit: 100,
  });
  const [profileCache, setProfileCache] = useState<Record<string, { dateOfBirth?: string; gender?: string }>>({});

  const selectedParent = useMemo(
    () => parents.find((parent) => parent._id === selectedParentId) ?? parents[0],
    [parents, selectedParentId]
  );

  const fetchParents = async () => {
    try {
      setIsLoading(true);
      const response = await parentService.getParentsDashboard({
        page: 1,
        limit: 100,
        search: searchTerm,
        status: statusFilter,
        gender: genderFilter,
        sortBy,
      });
      setParents(response.data);
      setStats(response.stats ?? defaultStats);
      setMeta(response.meta);
      setSelectedParentId((current) => current ?? response.data[0]?._id ?? null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to fetch parents");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(fetchParents, 250);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, statusFilter, genderFilter, sortBy]);

  useEffect(() => {
    if (!selectedParent) return;
    const userIds = [
      selectedParent.userId?._id,
      ...(selectedParent.children ?? []).map((child) => child.userId?._id),
    ].filter((id): id is string => !!id && !(id in profileCache));

    if (!userIds.length) return;

    userIds.forEach(async (userId) => {
      const profile = await parentService.getUserProfile(userId);
      if (profile.dateOfBirth || profile.gender) {
        setProfileCache((cache) => ({ ...cache, [userId]: profile }));
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedParent?._id]);

  const exportParents = () => {
    const rows = parents.map((parent) => ({
      name: getParentName(parent),
      email: parent.userId?.email ?? "",
      phone: parent.userId?.phoneNumber ?? "",
      children: parent.childrenCount ?? parent.children?.length ?? 0,
      status: parent.userId?.isActive ? "Active" : "Inactive",
    }));
    const csv = [
      "Name,Email,Phone,Children,Status",
      ...rows.map((row) =>
        [row.name, row.email, row.phone, row.children, row.status]
          .map((value) => `"${String(value).replace(/"/g, '""')}"`)
          .join(",")
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "talim-parents.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const statCards = [
    {
      label: "Total Parents",
      value: stats.totalParents,
      icon: UsersRound,
      tone: "bg-blue-50 text-[#003366] dark:bg-blue-900/30 dark:text-blue-400",
    },
    {
      label: "Active Parents",
      value: stats.activeParents,
      icon: CheckCircle2,
      tone: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    },
    {
      label: "Inactive Parents",
      value: stats.inactiveParents,
      icon: UserRound,
      tone: "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    },
    {
      label: "Total Children",
      value: stats.totalChildren,
      icon: UsersRound,
      tone: "bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
    },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
      <div className="mx-auto max-w-[1500px] space-y-6">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-950 dark:text-white">
              Parents
            </h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              View and manage parents information.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              onClick={exportParents}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-5 text-sm font-semibold text-slate-700 dark:text-slate-300 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700"
            >
              <Download className="h-4 w-4" />
              Export
            </button>
          </div>
        </header>

        <section className="grid gap-3 sm:grid-cols-2 lg:gap-4 xl:grid-cols-4">
          {statCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.label}
                className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm sm:p-5"
              >
                <div className="flex items-center gap-4">
                  <div className={cn("rounded-2xl p-3", card.tone)}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-950 dark:text-white">
                      {card.value}
                    </p>
                    <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
                      {card.label}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </section>

        <section className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 shadow-sm">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_110px_180px_180px_180px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search parents..."
                className="h-11 w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 pl-10 pr-4 text-sm focus:border-[#003366] dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30"
              />
            </div>
            <button className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-600 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 sm:order-last lg:order-none">
              <Filter className="h-4 w-4" />
              Filter
            </button>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="h-11 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 text-sm font-semibold text-slate-700 dark:text-slate-300"
            >
              <option value="all">Status: All</option>
              <option value="active">Status: Active</option>
              <option value="inactive">Status: Inactive</option>
            </select>
            <select
              value={genderFilter}
              onChange={(event) => setGenderFilter(event.target.value)}
              className="h-11 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 text-sm font-semibold text-slate-700 dark:text-slate-300"
            >
              <option value="all">Gender: All</option>
              <option value="female">Gender: Female</option>
              <option value="male">Gender: Male</option>
              <option value="other">Gender: Other</option>
            </select>
            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
              className="h-11 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 text-sm font-semibold text-slate-700 dark:text-slate-300"
            >
              <option value="az">Sort by: A - Z</option>
              <option value="za">Sort by: Z - A</option>
              <option value="joined_desc">Newest first</option>
              <option value="joined_asc">Oldest first</option>
            </select>
          </div>
        </section>

        <div className="grid gap-4 lg:gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
          <section className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm">
            <div className="space-y-3 p-3 md:hidden">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-32 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-700"
                  />
                ))
              ) : parents.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-600 px-4 py-10 text-center text-sm text-slate-500 dark:text-slate-400">
                  No parents found.
                </div>
              ) : (
                parents.map((parent) => (
                  <ParentMobileCard
                    key={parent._id}
                    parent={parent}
                    selected={selectedParent?._id === parent._id}
                    onSelect={() => setSelectedParentId(parent._id)}
                  />
                ))
              )}
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[900px] text-left">
                <thead className="bg-slate-50 dark:bg-slate-700/50 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  <tr>
                    <th className="px-5 py-4">Parent</th>
                    <th className="px-5 py-4">Contact</th>
                    <th className="px-5 py-4">Children</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4">Joined On</th>
                    <th className="px-5 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, index) => (
                      <tr key={index}>
                        <td className="px-5 py-4" colSpan={6}>
                          <div className="h-10 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-700" />
                        </td>
                      </tr>
                    ))
                  ) : parents.length === 0 ? (
                    <tr>
                      <td
                        className="px-5 py-14 text-center text-sm text-slate-500 dark:text-slate-400"
                        colSpan={6}
                      >
                        No parents found.
                      </td>
                    </tr>
                  ) : (
                    parents.map((parent) => (
                      <tr
                        key={parent._id}
                        onClick={() => setSelectedParentId(parent._id)}
                        className={cn(
                          "cursor-pointer transition hover:bg-slate-50 dark:hover:bg-slate-700/50",
                          selectedParent?._id === parent._id && "bg-blue-50/50 dark:bg-blue-900/20"
                        )}
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <Avatar
                              src={parent.userId?.userAvatar}
                              firstName={parent.userId?.firstName}
                              lastName={parent.userId?.lastName}
                              size="sm"
                            />
                            <div>
                              <p className="font-semibold text-slate-950 dark:text-white">
                                {getParentName(parent)}
                              </p>
                              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                {parent.userId?.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-sm font-medium text-slate-600 dark:text-slate-300">
                          {parent.userId?.phoneNumber ?? "-"}
                        </td>
                        <td className="px-5 py-4 text-sm font-semibold text-slate-700 dark:text-slate-300">
                          {parent.childrenCount ?? parent.children?.length ?? 0}
                        </td>
                        <td className="px-5 py-4">
                          <StatusBadge active={parent.userId?.isActive !== false} />
                        </td>
                        <td className="px-5 py-4 text-sm text-slate-600 dark:text-slate-400">
                          {formatDate(parent.userId?.createdAt ?? parent.createdAt)}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex justify-end gap-2">
                            <button className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-[#003366] dark:hover:text-blue-400">
                              <Eye className="h-4 w-4" />
                            </button>
                            <button className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700">
                              <MoreVertical className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-3 border-t border-slate-200 dark:border-slate-700 px-4 py-4 text-sm text-slate-500 dark:text-slate-400 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <p>
                Showing {parents.length} of {meta.total} parents
              </p>
            </div>
          </section>

          <ParentDetail parent={selectedParent} profileCache={profileCache} />
        </div>
      </div>
    </div>
  );
};

const StatusBadge = ({ active }: { active: boolean }) => (
  <span
    className={cn(
      "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold",
      active
        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
        : "bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400"
    )}
  >
    <span
      className={cn(
        "h-1.5 w-1.5 rounded-full",
        active ? "bg-emerald-600 dark:bg-emerald-400" : "bg-rose-600 dark:bg-rose-400"
      )}
    />
    {active ? "Active" : "Inactive"}
  </span>
);

const ParentMobileCard = ({
  parent,
  selected,
  onSelect,
}: {
  parent: Parent;
  selected: boolean;
  onSelect: () => void;
}) => (
  <button
    type="button"
    onClick={onSelect}
    className={cn(
      "w-full rounded-2xl border p-4 text-left transition",
      selected
        ? "border-[#003366] bg-blue-50/70 dark:border-blue-500 dark:bg-blue-900/20"
        : "border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700/50"
    )}
  >
    <div className="flex items-start gap-3">
      <Avatar
        src={parent.userId?.userAvatar}
        firstName={parent.userId?.firstName}
        lastName={parent.userId?.lastName}
        size="sm"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate font-semibold text-slate-950 dark:text-white">
              {getParentName(parent)}
            </p>
            <p className="mt-1 truncate text-sm text-slate-500 dark:text-slate-400">
              {parent.userId?.email ?? "-"}
            </p>
          </div>
          <StatusBadge active={parent.userId?.isActive !== false} />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <Info label="Phone" value={parent.userId?.phoneNumber ?? "-"} />
          <Info
            label="Children"
            value={String(parent.childrenCount ?? parent.children?.length ?? 0)}
          />
          <Info
            label="Joined"
            value={formatDate(parent.userId?.createdAt ?? parent.createdAt)}
          />
          <Info
            label="Action"
            value={selected ? "Viewing" : "Tap to view"}
          />
        </div>
      </div>
    </div>
  </button>
);

const ParentDetail = ({
  parent,
  profileCache,
}: {
  parent?: Parent;
  profileCache: Record<string, { dateOfBirth?: string; gender?: string }>;
}) => {
  if (!parent) {
    return (
      <aside className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-8 text-center text-sm text-slate-500 dark:text-slate-400 shadow-sm">
        Select a parent to view their profile and linked children.
      </aside>
    );
  }

  const parentProfile = profileCache[parent.userId?._id] ?? {};

  return (
    <aside className="space-y-5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <Avatar
            src={parent.userId?.userAvatar}
            firstName={parent.userId?.firstName}
            lastName={parent.userId?.lastName}
            className="h-16 w-16 text-xl sm:h-20 sm:w-20 sm:text-2xl"
          />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="min-w-0 break-words text-lg font-bold text-slate-950 dark:text-white sm:text-xl">
                {getParentName(parent)}
              </h2>
              <StatusBadge active={parent.userId?.isActive !== false} />
            </div>
            <p className="mt-3 flex min-w-0 items-center gap-2 break-all text-sm text-slate-500 dark:text-slate-400">
              <Mail className="h-4 w-4" />
              {parent.userId?.email ?? "-"}
            </p>
            <p className="mt-2 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              <Phone className="h-4 w-4" />
              {parent.userId?.phoneNumber ?? "-"}
            </p>
          </div>
        </div>
        <button className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600 sm:w-auto">
          <Pencil className="h-4 w-4" />
          Edit
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 rounded-2xl border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50 p-4 text-sm sm:grid-cols-2">
        <Info label="Date of Birth" value={formatDate(parentProfile.dateOfBirth ?? parent.userId?.dateOfBirth)} />
        <Info label="Gender" value={parentProfile.gender ?? parent.userId?.gender ?? "-"} />
        <Info label="Joined On" value={formatDate(parent.userId?.createdAt ?? parent.createdAt)} />
        <Info label="Last Login" value={formatDateTime(parent.userId?.lastLogin)} />
      </div>

      <div>
        <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="font-bold text-slate-950 dark:text-white">
            Children ({parent.children?.length ?? 0})
          </h3>
          <button className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-blue-50 dark:bg-blue-900/30 px-3 text-sm font-semibold text-[#003366] dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50">
            Link Child
          </button>
        </div>

        <div className="space-y-3">
          {parent.children?.length ? (
            parent.children.map((child) => (
              <div
                key={child._id}
                className="rounded-2xl border border-slate-200 dark:border-slate-700 p-4 transition hover:bg-slate-50 dark:hover:bg-slate-700/50"
              >
                <div className="flex gap-3">
                  <Avatar
                    src={child.userId?.userAvatar}
                    firstName={child.userId?.firstName}
                    lastName={child.userId?.lastName}
                    size="sm"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-bold text-slate-950 dark:text-white">{getChildName(child)}</p>
                      <span className="rounded-lg bg-blue-50 dark:bg-blue-900/30 px-2 py-1 text-xs font-bold text-[#003366] dark:text-blue-400">
                        Student
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                      {child.gradeLevel ?? child.classId?.gradeLevel ?? "-"} •{" "}
                      {child.classId?.name ?? "No class"}
                    </p>
                    <p className="mt-2 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                      <Mail className="h-4 w-4" />
                      {child.userId?.email ?? "-"}
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                  <Info label="Date of Birth" value={formatDate((profileCache[child.userId?._id]?.dateOfBirth) ?? child.userId?.dateOfBirth)} />
                  <Info label="Status" value={child.isActive ? "Active" : "Inactive"} />
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-600 p-6 text-center text-sm text-slate-500 dark:text-slate-400">
              No children are linked to this parent yet.
            </div>
          )}
        </div>
      </div>

      <div className="rounded-xl bg-blue-50 dark:bg-blue-900/20 px-4 py-3 text-sm text-slate-600 dark:text-slate-300">
        You can view and manage the children linked to this parent. To make
        changes, please unlink the child first.
      </div>
    </aside>
  );
};

const Info = ({ label, value }: { label: string; value: string }) => (
  <div>
    <p className="text-xs font-semibold text-slate-400 dark:text-slate-500">{label}</p>
    <p className="mt-1 font-semibold text-slate-700 dark:text-slate-200">{value}</p>
  </div>
);

export default ParentsPage;
