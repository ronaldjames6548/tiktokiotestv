/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

// Extend Astro's App.Locals interface to include our custom properties
declare namespace App {
  interface Locals {
    shouldIndex?: boolean;
  }
}
