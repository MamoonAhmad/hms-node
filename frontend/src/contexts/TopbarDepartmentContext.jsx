import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { departmentApi } from '@/services/api';

export const TOPBAR_DEPARTMENT_STORAGE_KEY = 'hms-topbar-department-id';
export const ALL_DEPARTMENTS_VALUE = 'all';

const TopbarDepartmentContext = createContext(null);

function readStoredDepartmentId() {
  try {
    return localStorage.getItem(TOPBAR_DEPARTMENT_STORAGE_KEY) || ALL_DEPARTMENTS_VALUE;
  } catch {
    return ALL_DEPARTMENTS_VALUE;
  }
}

export function TopbarDepartmentProvider({ children }) {
  const [departments, setDepartments] = useState([]);
  const [selectedDepartmentId, setSelectedDepartmentIdState] = useState(readStoredDepartmentId);

  useEffect(() => {
    let cancelled = false;
    departmentApi
      .getActive()
      .then((res) => {
        if (cancelled) return;
        setDepartments(Array.isArray(res?.data) ? res.data : []);
      })
      .catch(() => {
        if (!cancelled) setDepartments([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (selectedDepartmentId === ALL_DEPARTMENTS_VALUE || !departments.length) return;
    const exists = departments.some((d) => d.id === selectedDepartmentId);
    if (!exists) {
      setSelectedDepartmentIdState(ALL_DEPARTMENTS_VALUE);
      try {
        localStorage.setItem(TOPBAR_DEPARTMENT_STORAGE_KEY, ALL_DEPARTMENTS_VALUE);
      } catch {
        /* ignore */
      }
    }
  }, [departments, selectedDepartmentId]);

  const setSelectedDepartmentId = useCallback((value) => {
    const next = value || ALL_DEPARTMENTS_VALUE;
    setSelectedDepartmentIdState(next);
    try {
      localStorage.setItem(TOPBAR_DEPARTMENT_STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  }, []);

  const departmentId =
    selectedDepartmentId && selectedDepartmentId !== ALL_DEPARTMENTS_VALUE
      ? selectedDepartmentId
      : null;

  const selectedDepartment = useMemo(
    () => departments.find((d) => d.id === departmentId) || null,
    [departments, departmentId],
  );

  const value = useMemo(
    () => ({
      departments,
      selectedDepartmentId,
      selectedDepartment,
      departmentId,
      setSelectedDepartmentId,
      ALL_DEPARTMENTS_VALUE,
    }),
    [
      departments,
      selectedDepartmentId,
      selectedDepartment,
      departmentId,
      setSelectedDepartmentId,
    ],
  );

  return (
    <TopbarDepartmentContext.Provider value={value}>
      {children}
    </TopbarDepartmentContext.Provider>
  );
}

export function useTopbarDepartment() {
  const ctx = useContext(TopbarDepartmentContext);
  if (!ctx) {
    return {
      departments: [],
      selectedDepartmentId: ALL_DEPARTMENTS_VALUE,
      selectedDepartment: null,
      departmentId: null,
      setSelectedDepartmentId: () => {},
      ALL_DEPARTMENTS_VALUE,
    };
  }
  return ctx;
}
