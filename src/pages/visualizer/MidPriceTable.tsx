import { Table } from '@mantine/core';
import { ReactNode } from 'react';
import { useStore } from '../../store';
import { formatNumber } from '../../utils/format';
import { SimpleTable } from './SimpleTable';

export function MidPriceTable(): ReactNode {
  const algorithm = useStore(state => state.algorithm)!;

  // Create a map to store mid prices for each symbol and timestamp
  const midPrices: Map<number, Record<string, number>> = new Map();

  // Populate the midPrices map
  for (const row of algorithm.activityLogs) {
    if (!midPrices.has(row.timestamp)) {
      midPrices.set(row.timestamp, {});
    }
    midPrices.get(row.timestamp)![row.product] = row.midPrice;
  }

  // Get unique symbols
  const symbols = [...new Set(algorithm.activityLogs.map(log => log.product))];

  // Create table rows
  const rows = Array.from(midPrices.entries()).map(([timestamp, prices]) => (
    <Table.Tr key={timestamp}>
      <Table.Td>{formatNumber(timestamp)}</Table.Td>
      {symbols.map(symbol => (
        <Table.Td key={symbol}>{prices[symbol] ? formatNumber(prices[symbol]) : '-'}</Table.Td>
      ))}
    </Table.Tr>
  ));

  // Create table columns
  const columns = ['Timestamp', ...symbols];

  return <SimpleTable label="mid prices" columns={columns} rows={rows} />;
}