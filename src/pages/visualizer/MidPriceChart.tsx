import Highcharts from 'highcharts';
import { ReactNode, useState, useMemo } from 'react';
import { useStore } from '../../store';
import { Chart } from './Chart';
import { Checkbox, Flex, TextInput, Button, Stack, Group, ActionIcon } from '@mantine/core';
import { IconTrash } from '@tabler/icons-react';

interface CustomFunction {
  id: string;
  expression: string;
  color: string;
}

export function MidPriceChart(): ReactNode {
  const algorithm = useStore(state => state.algorithm)!;
  const [visibleSymbols, setVisibleSymbols] = useState<Set<string>>(new Set());
  const [customFunctions, setCustomFunctions] = useState<CustomFunction[]>([]);
  const [newFunction, setNewFunction] = useState('');

  const midPrices: Record<string, [number, number][]> = useMemo(() => {
    const prices: Record<string, [number, number][]> = {};
    const allSymbols = new Set<string>();

    for (const row of algorithm.activityLogs) {
      if (!prices[row.product]) {
        prices[row.product] = [];
        allSymbols.add(row.product);
      }
      prices[row.product].push([row.timestamp, row.midPrice]);
    }

    if (visibleSymbols.size === 0) {
      setVisibleSymbols(new Set(allSymbols));
    }

    return prices;
  }, [algorithm.activityLogs, visibleSymbols]);

  const allSymbols = useMemo(() => Object.keys(midPrices), [midPrices]);

  const symbolSeries: Highcharts.SeriesOptionsType[] = allSymbols
    .filter(symbol => visibleSymbols.has(symbol))
    .map(symbol => ({
      type: 'line',
      name: symbol,
      data: midPrices[symbol],
      visible: visibleSymbols.has(symbol),
    }));

  const customSeries: Highcharts.SeriesOptionsType[] = customFunctions.map(func => {
    const data = midPrices[allSymbols[0]].map(([timestamp]) => {
      const values = allSymbols.reduce((acc, symbol) => {
        acc[symbol] = midPrices[symbol].find(p => p[0] === timestamp)?.[1] || 0;
        return acc;
      }, {} as Record<string, number>);

      const value = eval(func.expression.replace(/\b(\w+)\b/g, (match) => values[match] || match));
      return [timestamp, value];
    });

    return {
      type: 'line',
      name: `Custom: ${func.expression}`,
      data,
      color: func.color,
    };
  });

  const series = [...symbolSeries, ...customSeries];

  const options: Highcharts.Options = {
    yAxis: {
      title: {
        text: 'Price',
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

  const addCustomFunction = () => {
    if (newFunction) {
      setCustomFunctions(prev => [...prev, {
        id: Date.now().toString(),
        expression: newFunction,
        color: getRandomColor()
      }]);
      setNewFunction('');
    }
  };

  const removeCustomFunction = (id: string) => {
    setCustomFunctions(prev => prev.filter(func => func.id !== id));
  };

  const getRandomColor = () => {
    return '#' + Math.floor(Math.random()*16777215).toString(16);
  };

  return (
    <>
      <Chart title="Mid Prices and Custom Functions" options={options} series={series} />
      <Flex wrap="wrap" gap="sm" mt="md">
        {allSymbols.map(symbol => (
          <Checkbox
            key={symbol}
            label={symbol}
            checked={visibleSymbols.has(symbol)}
            onChange={() => toggleSymbol(symbol)}
          />
        ))}
      </Flex>
      <Stack mt="md">
        <Flex align="flex-end" gap="sm">
          <TextInput
            label="Add custom function"
            placeholder="e.g., 6 * SYMBOL1 + 4 * SYMBOL2 + SYMBOL3"
            value={newFunction}
            onChange={(event) => setNewFunction(event.currentTarget.value)}
            style={{ flex: 1 }}
          />
          <Button onClick={addCustomFunction}>Add</Button>
        </Flex>
        {customFunctions.map((func) => (
          <Group key={func.id} position="apart">
            <div style={{ color: func.color }}>{func.expression}</div>
            <ActionIcon color="red" onClick={() => removeCustomFunction(func.id)}>
              <IconTrash size="1rem" />
            </ActionIcon>
          </Group>
        ))}
      </Stack>
    </>
  );
}
