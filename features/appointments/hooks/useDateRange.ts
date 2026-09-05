"use client";

import { useState } from "react";

// Sube a 31 para que el rango pueda cubrir un mes completo de una sola vez (antes tope de 21).
export const MAX_RANGE_DAYS = 31;

function toISODate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function addDays(isoDate: string, days: number): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + days);
  return toISODate(date);
}

function daysBetween(fromIso: string, toIso: string): number {
  const [fy, fm, fd] = fromIso.split("-").map(Number);
  const [ty, tm, td] = toIso.split("-").map(Number);
  const fromDate = new Date(fy, fm - 1, fd);
  const toDate = new Date(ty, tm - 1, td);
  return Math.round((toDate.getTime() - fromDate.getTime()) / 86400000);
}

const TODAY = toISODate(new Date());
const DEFAULT_FROM = addDays(TODAY, -7);
const DEFAULT_TO = addDays(TODAY, MAX_RANGE_DAYS - 8);

// Rango acotado a MAX_RANGE_DAYS: si se mueve un extremo más allá del límite respecto
// al otro, el otro extremo se corre para mantener el rango dentro del máximo permitido.
export function useDateRange() {
  const [from, setFromState] = useState(DEFAULT_FROM);
  const [to, setToState] = useState(DEFAULT_TO);

  function setFrom(value: string) {
    if (!value) return;
    let nextTo = to < value ? value : to;
    if (daysBetween(value, nextTo) > MAX_RANGE_DAYS - 1) {
      nextTo = addDays(value, MAX_RANGE_DAYS - 1);
    }
    setFromState(value);
    setToState(nextTo);
  }

  function setTo(value: string) {
    if (!value) return;
    let nextFrom = from > value ? value : from;
    if (daysBetween(nextFrom, value) > MAX_RANGE_DAYS - 1) {
      nextFrom = addDays(value, -(MAX_RANGE_DAYS - 1));
    }
    setFromState(nextFrom);
    setToState(value);
  }

  return { from, to, setFrom, setTo };
}
