import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
export function amountToWords(amount: number): string {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const thousands = ['', 'Thousand', 'Lakh', 'Crore'];
  function toWords(n: number): string {
    if (n < 10) return ones[n];
    if (n < 20) return teens[n - 10];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '');
    if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' ' + toWords(n % 100) : '');
    return '';
  }
  if (amount === 0) return 'Zero';
  let words = '';
  let num = Math.floor(amount);
  let i = 0;
  while (num > 0) {
    let chunk;
    if (i === 0) {
      chunk = num % 1000;
      num = Math.floor(num / 1000);
    } else {
      chunk = num % 100;
      num = Math.floor(num / 100);
    }
    if (chunk > 0) {
      words = toWords(chunk) + ' ' + thousands[i] + ' ' + words;
    }
    i++;
  }
  const rupees = words.trim();
  const paise = Math.round((amount - Math.floor(amount)) * 100);
  if (paise > 0) {
    return `${rupees} Rupees and ${toWords(paise)} Paise Only`;
  } else {
    return `${rupees} Rupees Only`;
  }
}