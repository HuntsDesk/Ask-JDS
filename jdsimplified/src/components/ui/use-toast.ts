
import { toast as sonnerToast } from "sonner";

type ToastProps = {
  title: string;
  description?: string;
  variant?: "default" | "destructive";
  duration?: number;
};

export const toast = ({ 
  title, 
  description, 
  variant = "default", 
  duration = 3000 
}: ToastProps) => {
  if (variant === "destructive") {
    return sonnerToast.error(title, {
      description,
      duration,
    });
  }
  
  return sonnerToast(title, {
    description,
    duration,
  });
};
