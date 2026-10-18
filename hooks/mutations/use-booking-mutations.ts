"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  cancelCustomerBookingAction,
  createBookingAction,
} from "@/lib/actions/booking.actions";
import { updateBookingStatusAction } from "@/lib/actions/admin.actions";
import { BOOKING_QUERY_KEYS } from "@/hooks/queries/use-booking-queries";

export function useCreateBookingMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createBookingAction,
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: BOOKING_QUERY_KEYS.all });
      if (result.success) {
        queryClient.invalidateQueries({
          queryKey: BOOKING_QUERY_KEYS.myBookings(result.data.lineId),
        });
      }
    },
  });
}

export function useCancelCustomerBookingMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: cancelCustomerBookingAction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BOOKING_QUERY_KEYS.all });
    },
  });
}

export function useUpdateBookingStatusMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateBookingStatusAction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BOOKING_QUERY_KEYS.all });
    },
  });
}
