import { HugeiconsIcon } from "@hugeicons/react";
import {
  Key01Icon,
  Copy01Icon,
  RefreshIcon,
  ShuffleIcon,
  Cancel01Icon,
  Tick02Icon,
  ViewIcon,
  ViewOffIcon,
  Upload01Icon,
  Download01Icon,
  ArrowRight01Icon,
  ArrowLeftRightIcon,
  Image01Icon,
  SquareLock01Icon,
  SquareUnlock01Icon,
  File01Icon,
} from "@hugeicons/core-free-icons";
const icons = {
  key: Key01Icon,
  copy: Copy01Icon,
  refresh: RefreshIcon,
  random: ShuffleIcon,
  close: Cancel01Icon,
  check: Tick02Icon,
  eye: ViewIcon,
  eyeOff: ViewOffIcon,
  upload: Upload01Icon,
  download: Download01Icon,
  arrow: ArrowRight01Icon,
  compare: ArrowLeftRightIcon,
  image: Image01Icon,
  lock: SquareLock01Icon,
  unlock: SquareUnlock01Icon,
  file: File01Icon,
};
export function Icon({
  name,
  size = 18,
  strokeWidth = 1.7,
  ...props
}: {
  name: keyof typeof icons;
  size?: number;
  strokeWidth?: number;
  className?: string;
}) {
  return (
    <HugeiconsIcon
      icon={icons[name]}
      size={size}
      strokeWidth={strokeWidth}
      aria-hidden="true"
      {...props}
    />
  );
}
export const Check = ({ size = 18, strokeWidth = 1.7 }) => (
  <Icon name="check" size={size} strokeWidth={strokeWidth} />
);
export const Eye = ({ size = 18, strokeWidth = 1.7 }) => (
  <Icon name="eye" size={size} strokeWidth={strokeWidth} />
);
export const EyeOff = ({ size = 18, strokeWidth = 1.7 }) => (
  <Icon name="eyeOff" size={size} strokeWidth={strokeWidth} />
);
export const Upload = ({ size = 18 }) => <Icon name="upload" size={size} />;
export const ArrowRight = ({ size = 18, strokeWidth = 1.7 }) => (
  <Icon name="arrow" size={size} strokeWidth={strokeWidth} />
);
