import Highcharts from 'highcharts';
import { ReactNode, useState } from 'react';
import { useStore } from '../../store';
import { Chart } from './Chart';
import { Checkbox, Flex } from '@mantine/core';

export function MidPriceChart(): ReactNode {
  const algorithm = useStore(state => state.algorithm)!;
  const [visibleSymbols, setVisibleSymbols] = useState<Set<string>>(new Set());

  // Create a map to store mid prices for each symbol
  const midPrices: Record<string, [number, number][]> = {};

  // Populate the midPrices map and collect all symbols
  const allSymbols = new Set<string>();
  for (const row of algorithm.activityLogs) {
    if (!midPrices[row.product]) {
      midPrices[row.product] = [];
      allSymbols.add(row.product);
    }
    midPrices[row.product].push([row.timestamp, row.midPrice]);
  }

  // Initialize visibleSymbols with all symbols if it's empty
  if (visibleSymbols.size === 0) {
    setVisibleSymbols(new Set(allSymbols));
  }

  // Create series for each visible symbol
  const series: Highcharts.SeriesOptionsType[] = Array.from(allSymbols)
    .filter(symbol => visibleSymbols.has(symbol))
    .map(symbol => ({
      type: 'line',
      name: symbol,
      data: midPrices[symbol],
      visible: visibleSymbols.has(symbol),
    }));

  const options: Highcharts.Options = {
    yAxis: {
      title: {
        text: 'Mid Price',
      },
    },
    tooltip: {
      shared: true,
    },
  };

  const toggleSymbol = (symbol: string) => {
    setVisibleSymbols(prev => {
      const newSet = new Set(prev);
      if (newSet.has(symbol)) {
        newSet.delete(symbol);
      } else {
        newSet.add(symbol);
      }
      return newSet;
    });
  };

  return (
    <>
      <Chart title="Mid Price Overlay" options={options} series={series} />
      <Flex wrap="wrap" gap="sm" mt="md">
        {Array.from(allSymbols).map(symbol => (
          <Checkbox
            key={symbol}
            label={symbol}
            checked={visibleSymbols.has(symbol)}
            onChange={() => toggleSymbol(symbol)}
          />
        ))}
      </Flex>
    </>
  );
}
