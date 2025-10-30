// js-confetti.d.ts
declare module 'js-confetti' {
  export default class JSConfetti {
    addConfetti(options?: {
      emojis?: string[] | string[][];
      emojiSize?: number;
      confettiNumber?: number;
      confettiRadius?: number;
      confettiColors?: string[];
      images?: HTMLImageElement[];
    }): void;
  }
}
