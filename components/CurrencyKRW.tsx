'use client';

interface CurrencyKRWProps {
  value: number;
}

export default function CurrencyKRW({ value }: CurrencyKRWProps) {
  return <span>{new Intl.NumberFormat("ko-KR").format(value)}원</span>;
}
