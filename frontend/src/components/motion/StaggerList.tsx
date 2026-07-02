import {
  Children,
  cloneElement,
  isValidElement,
  type CSSProperties,
  type ReactElement,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

type StaggerListProps = {
  children: ReactNode;
  className?: string;
  /** Delay between each child in ms */
  staggerMs?: number;
  /** Base delay before first child in ms */
  baseDelayMs?: number;
};

/**
 * Applies fade-in-up entrance with staggered delay to direct children.
 * Respects prefers-reduced-motion via motion-safe on child classes.
 */
export function StaggerList({
  children,
  className,
  staggerMs = 55,
  baseDelayMs = 0,
}: StaggerListProps) {
  let index = 0;

  const staggered = Children.map(children, (child) => {
    if (!isValidElement(child)) return child;

    const delay = baseDelayMs + index * staggerMs;
    index += 1;

    const existingStyle = (child.props as { style?: CSSProperties }).style;
    const existingClassName = (child.props as { className?: string }).className;

    return cloneElement(child as ReactElement<{ className?: string; style?: CSSProperties }>, {
      className: cn(
        "motion-safe:animate-fade-in-up motion-reduce:opacity-100 motion-reduce:transform-none",
        existingClassName,
      ),
      style: { ...existingStyle, animationDelay: `${delay}ms` },
    });
  });

  return <div className={className}>{staggered}</div>;
}

type StaggerItemProps = {
  index: number;
  staggerMs?: number;
  baseDelayMs?: number;
  className?: string;
  children: ReactNode;
};

/** Single staggered item when manual index control is needed (e.g. map). */
export function StaggerItem({
  index,
  staggerMs = 55,
  baseDelayMs = 0,
  className,
  children,
}: StaggerItemProps) {
  const delay = baseDelayMs + index * staggerMs;

  return (
    <div
      className={cn(
        "motion-safe:animate-fade-in-up motion-reduce:opacity-100 motion-reduce:transform-none",
        className,
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}
