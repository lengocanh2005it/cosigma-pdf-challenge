import { AxiosError } from "axios";
import { clsx, type ClassValue } from "clsx";
import { toast } from "react-toastify";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function handleAxiosError(error: any) {
  if (!error || typeof error !== "object") {
    toast.error("An unexpected error occurred.");
    return;
  }

  const axiosError = error as AxiosError;

  if (!axiosError.response) {
    toast.error("Unable to connect to the server. Please try again later.");
  } else {
    const message =
      (axiosError.response.data as any)?.message ||
      axiosError.message ||
      "An unexpected error occurred. Please try again.";

    const newMessage =
      message === "timeout of 5000ms exceeded"
        ? "Things are a bit slow right now. Please try again in a few seconds."
        : message;

    toast.error(newMessage);
  }
}

export function shortFileSuffix(fileName: string) {
  const base = fileName.replace(".pdf", "");
  const parts = base.split("-");
  return parts[1]?.slice(-4);
}
