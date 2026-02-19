"use client";

import { useEffect } from "react";
import { RelatedResult } from "@packages/types";

interface Props {
  container: HTMLDivElement | null;
  activeMatch: RelatedResult | null;
}

export function HighlightManager({ container, activeMatch }: Props) {
  useEffect(() => {
    if (!container || !activeMatch) return;

    container
      .querySelectorAll(".match-highlight")
      .forEach((el) => el.classList.remove("match-highlight"));

    const page = container.querySelector(
      `[data-page-number="${activeMatch.pageNumber}"]`,
    );

    if (!page) return;

    const spans = page.querySelectorAll(".react-pdf__Page__textContent span");

    spans.forEach((span) => {
      if (
        span.textContent &&
        activeMatch.content.includes(span.textContent.trim())
      ) {
        span.classList.add("match-highlight");
      }
    });
  }, [container, activeMatch]);

  return null;
}
