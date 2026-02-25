"use client";
import { useEffect, useState } from "react";

export default function ParentSelector({ schoolId, onSelect }: { schoolId: string, onSelect: (parents: any[]) => void }) {
  const [parents, setParents] = useState([]);
  const [selected, setSelected] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!schoolId) return;
    fetch(`/api/parents?schoolId=${schoolId}`)
      .then(res => res.json())
      .then(data => setParents(data));
  }, [schoolId]);

  const filtered = parents.filter((p: any) => p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <input
        className="w-full border rounded px-3 py-2 mb-2"
        placeholder="Search parents..."
        value={search}
        onChange={e => setSearch(e.target.value)}
      />
      <div className="max-h-48 overflow-y-auto">
        {filtered.map((parent: any) => (
          <label key={parent.id} className="flex items-center gap-2 py-1 cursor-pointer">
            <input
              type="checkbox"
              checked={selected.some(s => s.id === parent.id)}
              onChange={e => {
                if (e.target.checked) {
                  setSelected(sel => [...sel, parent]);
                  onSelect([...selected, parent]);
                } else {
                  const updated = selected.filter(s => s.id !== parent.id);
                  setSelected(updated);
                  onSelect(updated);
                }
              }}
            />
            <span>{parent.name}</span>
          </label>
        ))}
        {filtered.length === 0 && <div className="text-gray-400 text-sm">No parents found</div>}
      </div>
    </div>
  );
}
