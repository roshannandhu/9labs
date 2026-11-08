"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { useGSAP } from "@gsap/react";

let registered = false;

export function registerGsap() {
  if (registered || typeof window === "undefined") return;
  gsap.registerPlugin(ScrollTrigger, DrawSVGPlugin, useGSAP);
  ScrollTrigger.config({ ignoreMobileResize: true });
  registered = true;
}

registerGsap();

export { gsap, ScrollTrigger, DrawSVGPlugin, useGSAP };
