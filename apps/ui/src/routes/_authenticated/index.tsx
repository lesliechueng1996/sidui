import { createFileRoute, useNavigate } from '@tanstack/react-router';
import RaidCalendarComponent from './-components/RaidCalendarComponent';
import RaidIncomeChartComponent from './-components/RaidIncomeChartComponent';
import UpcomingRaidsComponent from './-components/UpcomingRaidsComponent';
import { createRaidRunEditorOpener } from './-lib/raid-income-chart';

export const Route = createFileRoute('/_authenticated/')({
  component: HomeComponent,
});

function HomeComponent() {
  const { isAdmin } = Route.useRouteContext();
  const navigate = useNavigate();
  const onRaidRunClick = isAdmin
    ? createRaidRunEditorOpener(navigate)
    : undefined;

  return (
    <section className="flex flex-col gap-6 animate-in duration-500 fade-in slide-in-from-bottom-2">
      <h1 className="font-heading text-3xl font-medium tracking-tight text-foreground">
        概览
      </h1>
      <RaidIncomeChartComponent onRaidRunClick={onRaidRunClick} />
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <RaidCalendarComponent />
        <UpcomingRaidsComponent />
      </div>
    </section>
  );
}
