type QueueCardProps = {
  title: string;
  value: string | number;
  color?: string;
};

export default function QueueCard({
  title,
  value,
  color = "bg-blue-700",
}: QueueCardProps) {
  return (
    <div className={`${color} rounded-2xl shadow-lg p-6 text-white`}>
      <p className="text-sm opacity-90">{title}</p>

      <h2 className="text-4xl font-bold mt-3">
        {value}
      </h2>
    </div>
  );
}