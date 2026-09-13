import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import RaidIncomeChartCanvasComponent, {
  createIncomeChartTickRenderer,
  IncomeChartTickComponent,
  renderRaidIncomeChartTooltipValue,
} from '@/routes/_authenticated/-components/RaidIncomeChartCanvasComponent';
import { toIncomeChartPoints } from '@/routes/_authenticated/-lib/raid-income-chart';

describe('RaidIncomeChartCanvasComponent', () => {
  it('renders the chart region for each raid run', () => {
    const points = toIncomeChartPoints([
      {
        id: 'run-1',
        name: '周六团',
        startTime: '2026-09-13T11:00:00.000Z',
        totalIncome: 20000,
        wagePerPerson: 800,
        subsidyAmount: 2000,
      },
    ]);

    render(<RaidIncomeChartCanvasComponent points={points} />);

    expect(screen.getByLabelText('金团收入图')).toBeInTheDocument();
  });

  it('renders gold amounts in the tooltip value row', () => {
    render(renderRaidIncomeChartTooltipValue(20000, 'totalIncome'));
    expect(screen.getByText('金团总计')).toBeInTheDocument();
    expect(screen.getByText('2砖')).toBeInTheDocument();

    render(renderRaidIncomeChartTooltipValue(15_000, 'wagePerPerson'));
    expect(screen.getByText('1砖 5000金')).toBeInTheDocument();

    render(renderRaidIncomeChartTooltipValue(800, 'subsidyAmount'));
    expect(screen.getByText('800金')).toBeInTheDocument();
  });

  it('makes axis ticks open a raid run when clicking is enabled', async () => {
    const user = userEvent.setup();
    const onRaidRunClick = vi.fn();
    const points = toIncomeChartPoints([
      {
        id: 'run-1',
        name: '周六团',
        startTime: '2026-09-13T11:00:00.000Z',
        totalIncome: 20000,
        wagePerPerson: 800,
        subsidyAmount: 2000,
      },
    ]);

    render(
      <svg aria-label="横坐标刻度" role="img">
        <IncomeChartTickComponent
          payload={{ value: 'run-1' }}
          points={points}
          x={10}
          y={20}
          onRaidRunClick={onRaidRunClick}
        />
      </svg>,
    );

    await user.click(screen.getByLabelText('编辑9/13 19:00'));
    expect(onRaidRunClick).toHaveBeenCalledWith('run-1');

    await user.keyboard('{Enter}');
    await user.keyboard(' ');
    await user.keyboard('a');
    expect(onRaidRunClick).toHaveBeenCalledTimes(3);
  });

  it('does not click an empty tick', () => {
    const onRaidRunClick = vi.fn();
    render(
      <svg aria-label="横坐标刻度" role="img">
        <IncomeChartTickComponent
          points={[]}
          x={10}
          y={20}
          onRaidRunClick={onRaidRunClick}
        />
        <IncomeChartTickComponent
          payload={{ value: 'run-1' }}
          points={toIncomeChartPoints([
            {
              id: 'run-1',
              name: '周六团',
              startTime: '2026-09-13T11:00:00.000Z',
              totalIncome: 1,
              wagePerPerson: 1,
              subsidyAmount: 1,
            },
          ])}
          x={10}
          y={40}
        />
      </svg>,
    );

    expect(onRaidRunClick).not.toHaveBeenCalled();
    expect(screen.getByText('9/13 19:00')).toBeInTheDocument();
  });

  it('renders a clickable chart region for admins', () => {
    const points = toIncomeChartPoints([
      {
        id: 'run-1',
        name: '周六团',
        startTime: '2026-09-13T11:00:00.000Z',
        totalIncome: 20000,
        wagePerPerson: 800,
        subsidyAmount: 2000,
      },
    ]);

    render(
      <RaidIncomeChartCanvasComponent
        points={points}
        onRaidRunClick={vi.fn()}
      />,
    );

    expect(
      screen.getByLabelText('金团收入图，点击开团可编辑'),
    ).toBeInTheDocument();
    expect(createIncomeChartTickRenderer(points, vi.fn())({})).toBeTruthy();
  });
});
