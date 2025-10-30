// js-confetti.d.ts
import 'js-confetti';

declare module 'js-confetti' {
  interface IAddConfettiConfig {
    /** Allow use of custom image elements as confetti */
    images?: HTMLImageElement[];
  }
}
