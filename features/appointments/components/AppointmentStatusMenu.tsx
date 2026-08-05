"use client";

import { ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { STATUS_LABELS, STATUS_OPTIONS } from "@/features/appointments/constants";
import type { AppointmentStatus } from "@/features/appointments/types";

export function AppointmentStatusMenu({
  currentStatus,
  onChange,
}: {
  currentStatus: AppointmentStatus;
  onChange: (status: AppointmentStatus) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" variant="outline" className="gap-1.5">
          Cambiar estado
          <ChevronDown className="size-3.5 -ml-0.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" alignOffset={-8} collisionPadding={12}>
        {STATUS_OPTIONS.map((status) => (
          <DropdownMenuItem
            key={status}
            disabled={status === currentStatus}
            onClick={() => onChange(status)}
          >
            {STATUS_LABELS[status]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
