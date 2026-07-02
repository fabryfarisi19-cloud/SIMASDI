type Props = {
  text: string;
};

export default function RunningText({ text }: Props) {
  return (
    <div className="bg-yellow-400 py-3 overflow-hidden">
      <div className="animate-marquee whitespace-nowrap text-2xl font-bold">
        {text}
      </div>
    </div>
  );
}