/** @jest-environment jsdom */
import { act, renderHook } from "@testing-library/react";
import { useRosterControls } from "@/hooks/users/useRosterControls";

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

/** Advances past the 300 ms search debounce. */
function settleDebounce() {
  act(() => {
    jest.advanceTimersByTime(350);
  });
}

describe("useRosterControls", () => {
  it("holds the search term back until typing stops", () => {
    const { result } = renderHook(() => useRosterControls());

    act(() => result.current.setSearch("a"));
    act(() => result.current.setSearch("ad"));
    act(() => result.current.setSearch("ada"));

    // The input updates immediately; the value queries key off does not.
    expect(result.current.search).toBe("ada");
    expect(result.current.debouncedSearch).toBe("");

    settleDebounce();
    expect(result.current.debouncedSearch).toBe("ada");
  });

  it("returns to page one whenever a filter changes", () => {
    const { result } = renderHook(() => useRosterControls());

    act(() => result.current.setPage(4));
    expect(result.current.page).toBe(4);

    act(() => result.current.setSearch("ada"));
    expect(result.current.page).toBe(1);

    act(() => result.current.setPage(3));
    act(() => result.current.setStatus("inactive"));
    expect(result.current.page).toBe(1);

    act(() => result.current.setPage(3));
    act(() => result.current.setClassId("c1"));
    expect(result.current.page).toBe(1);

    act(() => result.current.setPage(3));
    act(() => result.current.setPageSize(24));
    expect(result.current.page).toBe(1);
    expect(result.current.pageSize).toBe(24);
  });

  it("only counts a search term as filtering once it has settled", () => {
    const { result } = renderHook(() => useRosterControls());

    act(() => result.current.setSearch("ada"));
    expect(result.current.isFiltering).toBe(false);

    settleDebounce();
    expect(result.current.isFiltering).toBe(true);
  });

  it("treats whitespace as no search at all", () => {
    const { result } = renderHook(() => useRosterControls());
    act(() => result.current.setSearch("   "));
    settleDebounce();
    expect(result.current.isFiltering).toBe(false);
  });

  it("counts the class filter in hasAnyFilter but not in isFiltering", () => {
    const { result } = renderHook(() => useRosterControls());

    act(() => result.current.setClassId("c1"));
    expect(result.current.isFiltering).toBe(false);
    expect(result.current.hasAnyFilter).toBe(true);
  });

  it("reset clears every filter and returns to page one", () => {
    const { result } = renderHook(() => useRosterControls(9));

    act(() => result.current.setSearch("ada"));
    act(() => result.current.setStatus("active"));
    act(() => result.current.setClassId("c1"));
    act(() => result.current.setPage(2));
    settleDebounce();

    act(() => result.current.reset());
    settleDebounce();

    expect(result.current.search).toBe("");
    expect(result.current.debouncedSearch).toBe("");
    expect(result.current.status).toBe("");
    expect(result.current.classId).toBeNull();
    expect(result.current.page).toBe(1);
    expect(result.current.hasAnyFilter).toBe(false);
  });

  it("starts on page one with the page size it was given", () => {
    const { result } = renderHook(() => useRosterControls(12));
    expect(result.current.page).toBe(1);
    expect(result.current.pageSize).toBe(12);
  });
});
