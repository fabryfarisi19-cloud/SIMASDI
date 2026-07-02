type Props = {
  title: string;
  value: number | string;
  icon?: React.ReactNode;
  color?: string;
};

export default function StatisticsCard({
  title,
  value,
  icon,
  color = "bg-blue-700",
}: Props) {
  return (
    <div className={`${color} rounded-2xl p-6 shadow-lg text-white`}>
      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm opacity-90">{title}</p>
          <h2 className="text-4xl font-bold mt-2">{value}</h2>
        </div>

        <div className="text-5xl">
          {icon}
        </div>
      </div>
    </div>
  );
}